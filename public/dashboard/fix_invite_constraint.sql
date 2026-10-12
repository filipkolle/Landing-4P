-- ============================================================================
-- FIX: Zagotovitev stanja 'invited' in pravilnih RPC funkcij za povabila
-- Zaženite ta SQL v Supabase SQL Editorju.
-- ============================================================================

-- 1. Odstranitev morebitnih omejitev CHECK na stolpcu status v tabeli workplace_requests
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

-- 2. Zagotovitev stolpcev in unikatne omejitve na (employer_id, user_id) v tabeli employer_connections
ALTER TABLE public.employer_connections ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.employer_connections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.employer_connections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Zagotovi branje povezav za obe vpleteni strani
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employer_connections' AND policyname = 'conn_select_parties'
  ) THEN
    CREATE POLICY "conn_select_parties" ON public.employer_connections
      FOR SELECT TO authenticated USING (employer_id = auth.uid() OR user_id = auth.uid());
  END IF;

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
    NULL;
  END;
END $$;

-- 3. Posodobitev funkcije za pošiljanje povabila delodajalca (VEDNO nastavi status 'invited')
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

-- 4. Posodobitev funkcije respond_to_invitation (ko zaposleni sprejme ali zavrne)
CREATE OR REPLACE FUNCTION public.respond_to_invitation(p_connection_id UUID, p_accept BOOLEAN)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_conn public.employer_connections%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;
  SELECT * INTO v_conn FROM public.employer_connections WHERE id = p_connection_id AND user_id = auth.uid();
  IF v_conn.id IS NULL THEN RAISE EXCEPTION 'Povabilo ne obstaja.'; END IF;
  IF v_conn.status <> 'invited' THEN RAISE EXCEPTION 'Povabilo ni več aktivno.'; END IF;

  IF p_accept THEN
    UPDATE public.employer_connections
      SET status = 'approved', consent_at = now(), responded_at = now(), updated_at = now()
      WHERE id = p_connection_id;
    UPDATE public.workplace_requests
      SET status = 'approved', connection_id = p_connection_id, is_active = true, disconnected_at = NULL, updated_at = now()
      WHERE user_id = auth.uid() 
        AND (connection_id = p_connection_id OR workplace_id IN (
          SELECT id FROM public.workplaces WHERE employer_id = v_conn.employer_id
        ))
        AND status = 'invited';
    RETURN 'approved';
  ELSE
    UPDATE public.employer_connections
      SET status = 'rejected', responded_at = now(), updated_at = now()
      WHERE id = p_connection_id;
    DELETE FROM public.workplace_requests
      WHERE user_id = auth.uid()
        AND (connection_id = p_connection_id OR workplace_id IN (
          SELECT id FROM public.workplaces WHERE employer_id = v_conn.employer_id
        ))
        AND status = 'invited';
    RETURN 'rejected';
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.respond_to_invitation(UUID, BOOLEAN) TO authenticated;

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

ALTER TABLE public.employer_connections REPLICA IDENTITY FULL;
ALTER TABLE public.workplace_requests REPLICA IDENTITY FULL;

-- 6. Politike RLS za employer_connections (omogočanje prekinitve in brisanja povezave delodajalcu)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employer_connections' AND policyname = 'conn_update_parties'
  ) THEN
    CREATE POLICY "conn_update_parties" ON public.employer_connections
      FOR UPDATE TO authenticated
      USING (employer_id = auth.uid() OR user_id = auth.uid())
      WITH CHECK (employer_id = auth.uid() OR user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employer_connections' AND policyname = 'conn_delete_employer'
  ) THEN
    CREATE POLICY "conn_delete_employer" ON public.employer_connections
      FOR DELETE TO authenticated
      USING (employer_id = auth.uid());
  END IF;
END $$;

-- 7. Posodobitev funkcije request_employer_by_code (ko zaposleni vpiše kodo podjetja v aplikaciji)
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
  v_has_active_workplace BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;
  IF p_consent IS NOT TRUE THEN RAISE EXCEPTION 'Za povezavo morate potrditi soglasje o deljenju podatkov.'; END IF;

  v_clean := replace(upper(trim(p_code)), ' ', '');
  SELECT ep.id, COALESCE(ep.company_name, 'Podjetje') INTO v_employer, v_company
  FROM public.employer_profiles ep WHERE ep.connect_code = v_clean;

  IF v_employer IS NULL THEN RAISE EXCEPTION 'Delodajalec s to kodo ne obstaja.'; END IF;

  SELECT * INTO v_existing FROM public.employer_connections c WHERE c.employer_id = v_employer AND c.user_id = auth.uid();

  -- Če v bazi piše 'approved', preverimo, ali ima zaposleni dejansko še kakšen aktiven sektor pri tem delodajalcu
  IF v_existing.id IS NOT NULL AND v_existing.status = 'approved' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.workplace_requests wr
      JOIN public.workplaces w ON w.id = wr.workplace_id
      WHERE wr.user_id = auth.uid()
        AND w.employer_id = v_employer
        AND wr.status = 'approved'
        AND COALESCE(wr.is_active, true) = true
    ) INTO v_has_active_workplace;

    -- Če dejansko še dela v podjetju, zavrni z obvestilom, da je že povezan
    IF v_has_active_workplace THEN
      RAISE EXCEPTION 'S tem podjetjem ste že povezani.';
    END IF;
  END IF;

  -- Če prošnja že čaka na odobritev s strani delodajalca
  IF v_existing.id IS NOT NULL AND v_existing.status = 'pending' AND v_existing.initiated_by = 'employee' THEN
    UPDATE public.employer_connections
    SET updated_at = now()
    WHERE id = v_existing.id;
    RETURN QUERY SELECT v_existing.id, v_company, 'pending'::TEXT;
    RETURN;
  END IF;

  -- Če povezava že obstaja (npr. je bila prekinjena 'disconnected', 'rejected' ali pa nima več aktivnih sektorjev),
  -- jo ponastavimo v 'pending' z novo prošnjo zaposlenega
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
    INSERT INTO public.employer_connections (employer_id, user_id, status, initiated_by, company_name, user_name, consent_at, created_at, updated_at)
    VALUES (v_employer, auth.uid(), 'pending', 'employee', v_company, public.resolve_user_display_name(auth.uid()), now(), now(), now())
    RETURNING id INTO v_id;
  END IF;

  RETURN QUERY SELECT v_id, v_company, 'pending'::TEXT;
END $$;

GRANT EXECUTE ON FUNCTION public.request_employer_by_code(TEXT, BOOLEAN) TO authenticated;

-- 8. Popravek vseh starih povezav v employer_connections, kjer zaposleni nima nobenega aktivnega sektorja
UPDATE public.employer_connections ec
SET status = 'disconnected', updated_at = now()
WHERE ec.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM public.workplace_requests wr
    JOIN public.workplaces w ON w.id = wr.workplace_id
    WHERE wr.user_id = ec.user_id
      AND w.employer_id = ec.employer_id
      AND wr.status = 'approved'
      AND COALESCE(wr.is_active, true) = true
  );

-- 9. Delodajalec odobri prošnjo zaposlenega in mu dodeli izbrane sektorje
DROP FUNCTION IF EXISTS public.approve_connection_request(UUID, UUID[]);

CREATE OR REPLACE FUNCTION public.approve_connection_request(p_connection_id UUID, p_workplace_ids UUID[])
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_conn public.employer_connections%ROWTYPE;
  v_wp UUID;
  v_user_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;

  SELECT * INTO v_conn FROM public.employer_connections WHERE id = p_connection_id AND employer_id = auth.uid();
  IF v_conn.id IS NULL THEN RAISE EXCEPTION 'Prošnja ne obstaja ali niste lastnik podjetja.'; END IF;
  IF v_conn.status <> 'pending' THEN RAISE EXCEPTION 'Prošnja ni več v stanju čakanja.'; END IF;

  IF p_workplace_ids IS NULL OR array_length(p_workplace_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Izberite vsaj en sektor.';
  END IF;

  -- Preveri, ali vsi izbrani sektorji dejansko pripadajo trenutnemu delodajalcu
  IF EXISTS (
    SELECT 1 FROM unnest(p_workplace_ids) wid
    WHERE NOT EXISTS (
      SELECT 1 FROM public.workplaces w WHERE w.id = wid AND w.employer_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Izbrani sektor ne pripada vašemu podjetju.';
  END IF;

  -- Posodobi status krovne povezave na 'approved'
  UPDATE public.employer_connections
    SET status = 'approved',
        responded_at = now(),
        updated_at = now()
    WHERE id = p_connection_id;

  v_user_name := COALESCE(v_conn.user_name, public.resolve_user_display_name(v_conn.user_id), 'Zaposleni');

  -- Dodelimo izbrane sektorje v workplace_requests
  FOREACH v_wp IN ARRAY p_workplace_ids LOOP
    IF EXISTS (SELECT 1 FROM public.workplace_requests WHERE workplace_id = v_wp AND user_id = v_conn.user_id) THEN
      UPDATE public.workplace_requests
      SET status = 'approved',
          connection_id = p_connection_id,
          user_name = v_user_name,
          is_active = true,
          disconnected_at = NULL,
          updated_at = now()
      WHERE workplace_id = v_wp AND user_id = v_conn.user_id;
    ELSE
      INSERT INTO public.workplace_requests (workplace_id, user_id, user_name, status, connection_id, is_active, disconnected_at, updated_at)
      VALUES (v_wp, v_conn.user_id, v_user_name, 'approved', p_connection_id, true, NULL, now());
    END IF;
  END LOOP;

  RETURN 'approved';
END $$;

GRANT EXECUTE ON FUNCTION public.approve_connection_request(UUID, UUID[]) TO authenticated;

-- 10. Delodajalec zavrne prošnjo zaposlenega
DROP FUNCTION IF EXISTS public.reject_connection_request(UUID);

CREATE OR REPLACE FUNCTION public.reject_connection_request(p_connection_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;

  UPDATE public.employer_connections
    SET status = 'rejected', responded_at = now(), updated_at = now()
    WHERE id = p_connection_id AND employer_id = auth.uid();

  IF NOT FOUND THEN RAISE EXCEPTION 'Prošnja ne obstaja.'; END IF;

  RETURN 'rejected';
END $$;

GRANT EXECUTE ON FUNCTION public.reject_connection_request(UUID) TO authenticated;

-- 11. Zaposleni prekliče svojo oddano prošnjo, ki še čaka na odobritev
DROP FUNCTION IF EXISTS public.cancel_pending_employer_request(UUID);

CREATE OR REPLACE FUNCTION public.cancel_pending_employer_request(p_connection_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;

  UPDATE public.employer_connections
    SET status = 'disconnected', updated_at = now()
    WHERE id = p_connection_id AND user_id = auth.uid() AND status = 'pending';

  IF NOT FOUND THEN RAISE EXCEPTION 'Prošnja ne obstaja ali je ni več mogoče preklicati.'; END IF;

  RETURN 'cancelled';
END $$;

GRANT EXECUTE ON FUNCTION public.cancel_pending_employer_request(UUID) TO authenticated;

-- 12. Pomožna funkcija za varno pridobivanje dodeljenih sektorjev zaposlenega
DROP FUNCTION IF EXISTS public.get_assigned_workplaces_for_user(UUID);

CREATE OR REPLACE FUNCTION public.get_assigned_workplaces_for_user(p_connection_id UUID DEFAULT NULL)
RETURNS TABLE (
  workplace_id UUID,
  sector_name TEXT,
  sector_color TEXT,
  sector_notes TEXT,
  connection_id UUID,
  status TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_employer_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;

  IF p_connection_id IS NOT NULL THEN
    SELECT employer_id INTO v_employer_id
    FROM public.employer_connections
    WHERE id = p_connection_id;
  END IF;

  RETURN QUERY
  SELECT
    w.id AS workplace_id,
    COALESCE(w.sector_name, w.name, 'Glavni sektor') AS sector_name,
    COALESCE(w.sector_color, '#56829d') AS sector_color,
    w.sector_notes,
    wr.connection_id,
    wr.status
  FROM public.workplace_requests wr
  JOIN public.workplaces w ON w.id = wr.workplace_id
  WHERE wr.user_id = auth.uid()
    AND wr.status IN ('invited', 'approved')
    AND COALESCE(wr.is_active, true) = true
    AND (
      (p_connection_id IS NOT NULL AND (wr.connection_id = p_connection_id OR (v_employer_id IS NOT NULL AND w.employer_id = v_employer_id)))
      OR
      (p_connection_id IS NULL)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_assigned_workplaces_for_user(UUID) TO authenticated;

-- 13. Politika za branje sektorjev za člane podjetja
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workplaces' AND policyname = 'wp_select_member_direct'
  ) THEN
    CREATE POLICY "wp_select_member_direct" ON public.workplaces
      FOR SELECT TO authenticated
      USING (
        employer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.workplace_requests wr
          WHERE wr.workplace_id = workplaces.id AND wr.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 14. Zagotovitev vseh stolpcev in RLS politik za income_sources (povezava sektorjev med zaposlenim in delodajalcem)
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS connection_id UUID;
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS employer_name TEXT;
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS sector_name TEXT;
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS workplace_id UUID;
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS workplace_status TEXT;
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS join_code TEXT;
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS employment_type TEXT;
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS standard_hours INTEGER;
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS first_payment_date DATE;
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS net_salary NUMERIC(12, 2);
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(12, 2);
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS rate_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS is_resigned BOOLEAN DEFAULT false;
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS resigned_at TIMESTAMPTZ;

-- Dovoljenje delodajalcu za branje virov dohodka zaposlenih, ki so povezani z njegovim podjetjem ali sektorjem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'income_sources' AND policyname = 'inc_sources_employer_select'
  ) THEN
    CREATE POLICY "inc_sources_employer_select" ON public.income_sources
      FOR SELECT TO authenticated
      USING (
        user_id = auth.uid()
        OR connection_id IN (
          SELECT id FROM public.employer_connections WHERE employer_id = auth.uid()
        )
        OR workplace_id IN (
          SELECT id FROM public.workplaces WHERE employer_id = auth.uid()
        )
      );
  END IF;
END $$;
