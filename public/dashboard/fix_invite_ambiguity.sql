-- ============================================================================
-- Migracija: fix_invite_ambiguity.sql
-- Odprava napake "column reference user_id is ambiguous" pri pošiljanju povabila
-- Zaženite ta SQL v Supabase SQL Editorju.
-- ============================================================================

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

  IF v_conn.id IS NOT NULL THEN
    -- Vedno ponastavimo v 'invited', ko delodajalec pošlje novo povabilo
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
