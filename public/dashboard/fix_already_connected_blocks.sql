-- ============================================================================
-- Migracija: fix_already_connected_blocks.sql
-- Preprečitev ponovnega pošiljanja povabil/prošenj, ko sta delavec in podjetje že povezana.
-- Zaženite ta SQL v Supabase SQL Editorju.
-- ============================================================================

-- 1. Predogled podjetja po kodi: preveri tudi, ali je prijavljeni uporabnik že povezan
DROP FUNCTION IF EXISTS public.lookup_employer_by_code(TEXT);

CREATE OR REPLACE FUNCTION public.lookup_employer_by_code(p_code TEXT)
RETURNS TABLE (company_name TEXT, is_already_connected BOOLEAN, connection_status TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_clean TEXT;
  v_employer UUID;
  v_conn public.employer_connections%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;
  v_clean := replace(upper(trim(p_code)), ' ', '');

  SELECT ep.id INTO v_employer FROM public.employer_profiles ep WHERE ep.connect_code = v_clean;
  IF v_employer IS NULL THEN RETURN; END IF;

  SELECT * INTO v_conn FROM public.employer_connections c WHERE c.employer_id = v_employer AND c.user_id = auth.uid();

  RETURN QUERY
    SELECT 
      COALESCE(ep.company_name, 'Podjetje'),
      (v_conn.id IS NOT NULL AND v_conn.status = 'approved'),
      COALESCE(v_conn.status, 'none')
    FROM public.employer_profiles ep
    WHERE ep.id = v_employer;
END $$;

GRANT EXECUTE ON FUNCTION public.lookup_employer_by_code(TEXT) TO authenticated;

-- 2. Zaposleni vpiše kodo podjetja: prepreči, če je že povezan ali prošnja že obstaja
DROP FUNCTION IF EXISTS public.request_employer_by_code(TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.request_employer_by_code(p_code TEXT, p_consent BOOLEAN)
RETURNS TABLE (connection_id UUID, company_name TEXT, status TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_employer UUID;
  v_company TEXT;
  v_existing public.employer_connections%ROWTYPE;
  v_id UUID;
  v_clean TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;
  IF p_consent IS NOT TRUE THEN RAISE EXCEPTION 'Za povezavo morate potrditi soglasje o deljenju podatkov.'; END IF;

  v_clean := replace(upper(trim(p_code)), ' ', '');
  SELECT ep.id, COALESCE(ep.company_name, 'Podjetje') INTO v_employer, v_company
  FROM public.employer_profiles ep WHERE ep.connect_code = v_clean;

  IF v_employer IS NULL THEN RAISE EXCEPTION 'Delodajalec s to kodo ne obstaja.'; END IF;

  SELECT * INTO v_existing FROM public.employer_connections c WHERE c.employer_id = v_employer AND c.user_id = auth.uid();

  -- Če je že povezan, zavrni
  IF v_existing.id IS NOT NULL AND v_existing.status = 'approved' THEN
    RAISE EXCEPTION 'S tem podjetjem ste že povezani.';
  END IF;

  -- Če prošnja že čaka na odobritev
  IF v_existing.id IS NOT NULL AND v_existing.status = 'pending' THEN
    RAISE EXCEPTION 'Temu podjetju ste že poslali prošnjo za povezavo, ki čaka na potrditev.';
  END IF;

  -- Če je delodajalec že poslal povabilo
  IF v_existing.id IS NOT NULL AND v_existing.status = 'invited' THEN
    RAISE EXCEPTION 'To podjetje vam je že poslalo povabilo. Prosimo, preverite in sprejmite vabilo v aplikaciji.';
  END IF;

  -- Ustvari novo prošnjo (ali ponastavi staro neaktivno/prekinjeno povezavo)
  IF v_existing.id IS NOT NULL THEN
    v_id := v_existing.id;
    UPDATE public.employer_connections ec
    SET status = 'pending',
        initiated_by = 'employee',
        company_name = v_company,
        user_name = public.resolve_user_display_name(auth.uid()),
        consent_at = now(),
        responded_at = NULL,
        updated_at = now()
    WHERE ec.id = v_id;
  ELSE
    INSERT INTO public.employer_connections (employer_id, user_id, status, initiated_by, company_name, user_name, consent_at, created_at, updated_at)
    VALUES (v_employer, auth.uid(), 'pending', 'employee', v_company, public.resolve_user_display_name(auth.uid()), now(), now(), now())
    RETURNING id INTO v_id;
  END IF;

  RETURN QUERY SELECT v_id, v_company, 'pending'::TEXT;
END $$;

GRANT EXECUTE ON FUNCTION public.request_employer_by_code(TEXT, BOOLEAN) TO authenticated;

-- 3. Predogled zaposlenega po kodi: preveri tudi, ali je že povezan z delodajalcem
DROP FUNCTION IF EXISTS public.lookup_employee_by_code(TEXT);

CREATE OR REPLACE FUNCTION public.lookup_employee_by_code(p_code TEXT)
RETURNS TABLE (user_name TEXT, is_already_connected BOOLEAN, connection_status TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID;
  v_clean TEXT;
  v_conn public.employer_connections%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;
  v_clean := replace(upper(trim(p_code)), ' ', '');
  SELECT uc.user_id INTO v_user FROM public.user_connect_codes uc WHERE uc.connect_code = v_clean;
  IF v_user IS NULL THEN RETURN; END IF;

  SELECT * INTO v_conn FROM public.employer_connections c WHERE c.employer_id = auth.uid() AND c.user_id = v_user;

  RETURN QUERY SELECT 
    public.resolve_user_display_name(v_user),
    (v_conn.id IS NOT NULL AND v_conn.status = 'approved'),
    COALESCE(v_conn.status, 'none');
END $$;

GRANT EXECUTE ON FUNCTION public.lookup_employee_by_code(TEXT) TO authenticated;

-- 4. Delodajalec povabi zaposlenega po kodi: blokiraj ponovno pošiljanje, če je že povezan
DROP FUNCTION IF EXISTS public.invite_employee_by_code(TEXT, UUID[]);

CREATE OR REPLACE FUNCTION public.invite_employee_by_code(p_code TEXT, p_workplace_ids UUID[])
RETURNS TABLE (connection_id UUID, user_id UUID, user_name TEXT, status TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
  v_user UUID;
  v_name TEXT;
  v_company TEXT;
  v_conn public.employer_connections%ROWTYPE;
  v_id UUID;
  v_status TEXT;
  v_row_status TEXT;
  v_wp UUID;
  v_clean TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;
  IF p_workplace_ids IS NULL OR array_length(p_workplace_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Izberite vsaj en sektor.';
  END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_workplace_ids) x WHERE NOT public.is_workplace_owner(x)) THEN
    RAISE EXCEPTION 'Izbrani sektor ne pripada vašemu podjetju.';
  END IF;

  v_clean := replace(upper(trim(p_code)), ' ', '');
  SELECT uc.user_id INTO v_user FROM public.user_connect_codes uc WHERE uc.connect_code = v_clean;
  IF v_user IS NULL THEN RAISE EXCEPTION 'Uporabnik s to kodo ne obstaja.'; END IF;

  v_name := public.resolve_user_display_name(v_user);
  SELECT COALESCE(ep.company_name, 'Podjetje') INTO v_company FROM public.employer_profiles ep WHERE ep.id = auth.uid();

  SELECT * INTO v_conn FROM public.employer_connections c WHERE c.employer_id = auth.uid() AND c.user_id = v_user;

  -- BLOKADA: če je zaposleni že povezan, NE SME ponovno prejeti povabila!
  IF v_conn.id IS NOT NULL AND v_conn.status = 'approved' THEN
    RAISE EXCEPTION 'Ta zaposleni je že povezan z vašim podjetjem.';
  END IF;

  -- BLOKADA: če povabilo že čaka na odobritev zaposlenega
  IF v_conn.id IS NOT NULL AND v_conn.status = 'invited' THEN
    RAISE EXCEPTION 'Temu zaposlenemu ste že poslali povabilo, ki čaka na njegovo potrditev.';
  END IF;

  -- BLOKADA: če je zaposleni že sam poslal prošnjo podjetju
  IF v_conn.id IS NOT NULL AND v_conn.status = 'pending' THEN
    RAISE EXCEPTION 'Ta zaposleni vam je že poslal prošnjo za povezavo. Prošnjo lahko potrdite v obvestilih.';
  END IF;

  IF v_conn.id IS NOT NULL THEN
    -- Ponastavimo le, če je bila povezava prej prekinjena ('disconnected' ali 'rejected')
    v_id := v_conn.id;
    v_status := 'invited';
    v_row_status := 'invited';
    UPDATE public.employer_connections ec
    SET status = 'invited',
        initiated_by = 'employer',
        company_name = v_company,
        user_name = v_name,
        consent_at = NULL,
        responded_at = NULL,
        updated_at = now()
    WHERE ec.id = v_id;
  ELSE
    -- Povezava še ne obstaja: nov zapis v stanju 'invited'
    v_status := 'invited';
    v_row_status := 'invited';
    INSERT INTO public.employer_connections (employer_id, user_id, status, initiated_by, company_name, user_name, consent_at, responded_at, updated_at)
    VALUES (auth.uid(), v_user, 'invited', 'employer', v_company, v_name, NULL, NULL, now())
    RETURNING id INTO v_id;
  END IF;

  -- 1. Odstranimo obstoječe sektorje tega podjetja za tega uporabnika, ki NISO med izbranimi
  DELETE FROM public.workplace_requests wr
  WHERE wr.user_id = v_user
    AND wr.workplace_id IN (SELECT wp.id FROM public.workplaces wp WHERE wp.employer_id = auth.uid())
    AND NOT (wr.workplace_id = ANY(p_workplace_ids));

  -- 2. Posodobimo ali dodamo sektorje v workplace_requests kot 'invited' in is_active = false
  FOREACH v_wp IN ARRAY p_workplace_ids LOOP
    IF EXISTS (SELECT 1 FROM public.workplace_requests wr WHERE wr.workplace_id = v_wp AND wr.user_id = v_user) THEN
      UPDATE public.workplace_requests wr
      SET status = 'invited',
          connection_id = v_id,
          user_name = v_name,
          is_active = false,
          disconnected_at = NULL,
          updated_at = now()
      WHERE wr.workplace_id = v_wp AND wr.user_id = v_user;
    ELSE
      INSERT INTO public.workplace_requests (workplace_id, user_id, user_name, status, connection_id, is_active, disconnected_at, updated_at)
      VALUES (v_wp, v_user, v_name, 'invited', v_id, false, NULL, now());
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_id, v_user, v_name, v_status;
END $$;

GRANT EXECUTE ON FUNCTION public.invite_employee_by_code(TEXT, UUID[]) TO authenticated;
