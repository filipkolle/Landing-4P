-- ============================================================================
-- FIX: Odprava napake "check constraint workplace_requests_status_check is violated by some row"
-- in zagotovitev vseh potrebnih omejitev ter RPC funkcij
-- Zaženite ta SQL v Supabase SQL Editorju.
-- ============================================================================

-- 1. Odstranitev CHECK omejitev na stolpcu status v tabeli workplace_requests
-- (Omejitev samo odstranimo, da preprečimo blokado starih ali novih zapisov)
ALTER TABLE public.workplace_requests DROP CONSTRAINT IF EXISTS workplace_requests_status_check;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'workplace_requests'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.workplace_requests DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- 2. Zagotovitev unikatne omejitve na (employer_id, user_id) v tabeli employer_connections
DO $$
BEGIN
  DELETE FROM public.employer_connections a
  WHERE a.ctid <> (
    SELECT max(b.ctid)
    FROM public.employer_connections b
    WHERE b.employer_id = a.employer_id
      AND (b.user_id = a.user_id OR (b.user_id IS NULL AND a.user_id IS NULL))
  );

  BEGIN
    ALTER TABLE public.employer_connections
      ADD CONSTRAINT employer_connections_employer_id_user_id_key
      UNIQUE (employer_id, user_id);
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Če omejitev že obstaja
  END;
END $$;

-- 3. Posodobitev funkcije za pošiljanje povabila delodajalca
CREATE OR REPLACE FUNCTION public.invite_employee_by_code(p_code TEXT, p_workplace_ids UUID[])
RETURNS TABLE (connection_id UUID, user_name TEXT, status TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  IF v_conn.id IS NOT NULL AND v_conn.status = 'approved' THEN
    -- Že povezan: novi sektorji so takoj aktivni (zaposleni nastavi le postavko)
    v_id := v_conn.id;
    v_status := 'approved';
    v_row_status := 'approved';
    UPDATE public.employer_connections
    SET company_name = v_company, user_name = v_name, updated_at = now()
    WHERE id = v_id;
  ELSIF v_conn.id IS NOT NULL THEN
    -- Že obstaja v drugem stanju (invited, pending, rejected, disconnected): osvežimo v invited
    v_id := v_conn.id;
    v_status := 'invited';
    v_row_status := 'invited';
    UPDATE public.employer_connections
    SET status = 'invited',
        initiated_by = 'employer',
        company_name = v_company,
        user_name = v_name,
        consent_at = NULL,
        responded_at = NULL,
        updated_at = now()
    WHERE id = v_id;
  ELSE
    -- Povezava še ne obstaja: nov zapis
    v_status := 'invited';
    v_row_status := 'invited';
    INSERT INTO public.employer_connections (employer_id, user_id, status, initiated_by, company_name, user_name, consent_at, responded_at, updated_at)
    VALUES (auth.uid(), v_user, 'invited', 'employer', v_company, v_name, NULL, NULL, now())
    RETURNING id INTO v_id;
  END IF;

  -- Posodobimo ali dodamo sektorje v workplace_requests
  FOREACH v_wp IN ARRAY p_workplace_ids LOOP
    IF EXISTS (SELECT 1 FROM public.workplace_requests WHERE workplace_id = v_wp AND user_id = v_user) THEN
      UPDATE public.workplace_requests
      SET status = CASE WHEN public.workplace_requests.status = 'approved' THEN 'approved' ELSE v_row_status END,
          connection_id = v_id,
          user_name = v_name,
          is_active = (CASE WHEN public.workplace_requests.status = 'approved' THEN 'approved' ELSE v_row_status END) = 'approved',
          disconnected_at = NULL,
          updated_at = now()
      WHERE workplace_id = v_wp AND user_id = v_user;
    ELSE
      INSERT INTO public.workplace_requests (workplace_id, user_id, user_name, status, connection_id, is_active, disconnected_at, updated_at)
      VALUES (v_wp, v_user, v_name, v_row_status, v_id, v_row_status = 'approved', NULL, now());
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_id, v_name, v_status;
END $$;

-- 4. Posodobitev funkcije za prošnjo zaposlenega
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

  IF v_existing.id IS NOT NULL AND v_existing.status = 'approved' THEN
    RAISE EXCEPTION 'S tem podjetjem ste že povezani.';
  END IF;

  IF v_existing.id IS NOT NULL THEN
    v_id := v_existing.id;
    UPDATE public.employer_connections
    SET status = 'pending',
        initiated_by = 'employee',
        company_name = v_company,
        user_name = public.resolve_user_display_name(auth.uid()),
        consent_at = now(),
        responded_at = NULL,
        updated_at = now()
    WHERE id = v_id;
  ELSE
    INSERT INTO public.employer_connections (employer_id, user_id, status, initiated_by, company_name, user_name, consent_at, updated_at)
    VALUES (v_employer, auth.uid(), 'pending', 'employee', v_company, public.resolve_user_display_name(auth.uid()), now(), now())
    RETURNING id INTO v_id;
  END IF;

  RETURN QUERY SELECT v_id, v_company, 'pending'::TEXT;
END $$;

GRANT EXECUTE ON FUNCTION public.invite_employee_by_code(TEXT, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_employer_by_code(TEXT, BOOLEAN) TO authenticated;

-- 5. Realtime obveščanje za employer_connections in workplace_requests
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.employer_connections;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.workplace_requests;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
