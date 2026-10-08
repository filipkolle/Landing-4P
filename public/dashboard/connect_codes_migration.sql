-- ==========================================================================
-- MIGRACIJA: connect_codes_migration.sql
-- Nov sistem povezovanja delodajalec <-> zaposleni prek osebnih 5-mestnih kod.
--
-- PREDPOGOJ: najprej zaženi backup_before_connect_codes.sql
-- Skripta je idempotentna (varno jo je zagnati večkrat).
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 0. Generator kod (5 znakov, brez dvoumnih 0/O/1/I/L)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_connect_codes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  connect_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employer_profiles
  ADD COLUMN IF NOT EXISTS connect_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS employer_profiles_connect_code_key
  ON public.employer_profiles(connect_code) WHERE connect_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_connect_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alphabet CONSTANT TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate TEXT;
  i INT;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..5 LOOP
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    -- Koda mora biti unikatna med uporabniki IN delodajalci (nikoli dvoumna)
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_connect_codes WHERE connect_code = candidate)
          AND NOT EXISTS (SELECT 1 FROM public.employer_profiles WHERE connect_code = candidate);
  END LOOP;
  RETURN candidate;
END $$;

REVOKE ALL ON FUNCTION public.generate_connect_code() FROM PUBLIC, anon, authenticated;

-- Samodejna koda ob registraciji novega uporabnika
CREATE OR REPLACE FUNCTION public.handle_new_user_connect_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_connect_codes(user_id, connect_code)
  VALUES (NEW.id, public.generate_connect_code())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Registracija ne sme nikoli pasti zaradi kode (koda se ustvari ob prvem klicu get_my_connect_code)
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created_connect_code ON auth.users;
CREATE TRIGGER on_auth_user_created_connect_code
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_connect_code();

-- Kode za vse obstoječe uporabnike
INSERT INTO public.user_connect_codes(user_id, connect_code)
SELECT u.id, public.generate_connect_code()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_connect_codes c WHERE c.user_id = u.id);

-- Kode za vse obstoječe delodajalce
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.employer_profiles WHERE connect_code IS NULL LOOP
    UPDATE public.employer_profiles SET connect_code = public.generate_connect_code() WHERE id = r.id;
  END LOOP;
END $$;

-- Samodejna koda za nove delodajalce (dashboard ustvari vrstico v employer_profiles)
CREATE OR REPLACE FUNCTION public.employer_profiles_set_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.connect_code IS NULL OR TG_OP = 'UPDATE' THEN
    -- Kode ni mogoče ročno spremeniti iz odjemalca
    NEW.connect_code := COALESCE(CASE WHEN TG_OP = 'UPDATE' THEN OLD.connect_code END, NEW.connect_code, public.generate_connect_code());
    IF NEW.connect_code IS NULL THEN
      NEW.connect_code := public.generate_connect_code();
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS employer_profiles_set_code_trg ON public.employer_profiles;
CREATE TRIGGER employer_profiles_set_code_trg
  BEFORE INSERT OR UPDATE ON public.employer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.employer_profiles_set_code();

-- --------------------------------------------------------------------------
-- 1. Lastništvo sektorjev: workplaces.employer_id
-- --------------------------------------------------------------------------
ALTER TABLE public.workplaces ADD COLUMN IF NOT EXISTS employer_id UUID;
ALTER TABLE public.workplaces ALTER COLUMN employer_id SET DEFAULT auth.uid();
ALTER TABLE public.workplaces ALTER COLUMN join_code DROP NOT NULL;

-- a) iz created_by (če stolpec obstaja)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='workplaces' AND column_name='created_by') THEN
    EXECUTE 'UPDATE public.workplaces SET employer_id = created_by WHERE employer_id IS NULL AND created_by IS NOT NULL';
  END IF;
END $$;

-- b) iz oznake [emp:<uuid>] v sector_notes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='workplaces' AND column_name='sector_notes') THEN
    UPDATE public.workplaces
    SET employer_id = (substring(sector_notes FROM '\[emp:([0-9a-fA-F-]{36})\]'))::uuid
    WHERE employer_id IS NULL
      AND sector_notes ~ '\[emp:[0-9a-fA-F-]{36}\]';
  END IF;
END $$;

-- c) sektorji brez oznake dobijo id delodajalca
UPDATE public.workplaces SET employer_id = COALESCE(
  (SELECT id FROM public.employer_profiles LIMIT 1),
  'e469c8c8-0678-49fd-917d-0f60b031d006'::uuid
)
WHERE employer_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_workplaces_employer ON public.workplaces(employer_id);

-- --------------------------------------------------------------------------
-- 2. Povezave podjetje <-> zaposleni
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employer_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('invited', 'pending', 'approved', 'rejected', 'disconnected')),
  initiated_by TEXT NOT NULL CHECK (initiated_by IN ('employer', 'employee', 'migration')),
  company_name TEXT,
  user_name TEXT,
  consent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employer_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_employer_connections_user ON public.employer_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_connections_employer ON public.employer_connections(employer_id);

ALTER TABLE public.workplace_requests ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES public.employer_connections(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_workplace_requests_connection ON public.workplace_requests(connection_id);

-- Viri dohodka v aplikaciji: sektorji se združujejo pod podjetje
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS connection_id UUID;
ALTER TABLE public.income_sources ADD COLUMN IF NOT EXISTS employer_name TEXT;

-- --------------------------------------------------------------------------
-- 3. Pomožne funkcije (SECURITY DEFINER -> brez rekurzije v RLS)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_workplace_owner(p_workplace_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workplaces WHERE id = p_workplace_id AND employer_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_workplace_member(p_workplace_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workplace_requests WHERE workplace_id = p_workplace_id AND user_id = auth.uid());
$$;

-- Ali je bil uporabnik (kadarkoli) povezan s podjetjem, ki mu pripada sektor
CREATE OR REPLACE FUNCTION public.has_connection_for_workplace(p_workplace_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workplaces w
    JOIN public.employer_connections c ON c.employer_id = w.employer_id
    WHERE w.id = p_workplace_id AND c.user_id = auth.uid()
  ) OR public.is_workplace_member(p_workplace_id);
$$;

CREATE OR REPLACE FUNCTION public.resolve_user_display_name(p_user_id UUID)
RETURNS TEXT LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name TEXT;
BEGIN
  BEGIN
    SELECT NULLIF(name, '') INTO v_name FROM public.user_profiles WHERE id = p_user_id;
  EXCEPTION WHEN OTHERS THEN v_name := NULL;
  END;
  IF v_name IS NULL THEN
    SELECT COALESCE(NULLIF(raw_user_meta_data->>'full_name', ''), NULLIF(raw_user_meta_data->>'name', ''), split_part(email, '@', 1))
    INTO v_name FROM auth.users WHERE id = p_user_id;
  END IF;
  RETURN COALESCE(v_name, 'Uporabnik');
END $$;

REVOKE ALL ON FUNCTION public.resolve_user_display_name(UUID) FROM PUBLIC, anon, authenticated;

-- --------------------------------------------------------------------------
-- 4. Prenos obstoječih povezav (stari sistem -> nov)
-- --------------------------------------------------------------------------
INSERT INTO public.employer_connections (employer_id, user_id, status, initiated_by, company_name, user_name, consent_at, responded_at, created_at)
SELECT
  w.employer_id,
  wr.user_id,
  'approved',
  'migration',
  (SELECT ep.company_name FROM public.employer_profiles ep WHERE ep.id = w.employer_id),
  max(wr.user_name),
  min(wr.created_at),
  min(wr.updated_at),
  min(wr.created_at)
FROM public.workplace_requests wr
JOIN public.workplaces w ON w.id = wr.workplace_id
WHERE wr.status = 'approved' AND wr.user_id IS NOT NULL AND w.employer_id IS NOT NULL
GROUP BY w.employer_id, wr.user_id
ON CONFLICT (employer_id, user_id) DO NOTHING;

-- Odprte stare prošnje (pending) -> pending povezava
INSERT INTO public.employer_connections (employer_id, user_id, status, initiated_by, company_name, user_name, consent_at, created_at)
SELECT w.employer_id, wr.user_id, 'pending', 'employee',
  (SELECT ep.company_name FROM public.employer_profiles ep WHERE ep.id = w.employer_id),
  max(wr.user_name), min(wr.created_at), min(wr.created_at)
FROM public.workplace_requests wr
JOIN public.workplaces w ON w.id = wr.workplace_id
WHERE wr.status = 'pending' AND wr.user_id IS NOT NULL AND w.employer_id IS NOT NULL
GROUP BY w.employer_id, wr.user_id
ON CONFLICT (employer_id, user_id) DO NOTHING;

UPDATE public.workplace_requests wr
SET connection_id = c.id
FROM public.workplaces w, public.employer_connections c
WHERE w.id = wr.workplace_id
  AND c.employer_id = w.employer_id
  AND c.user_id = wr.user_id
  AND wr.connection_id IS NULL;

UPDATE public.income_sources s
SET connection_id = c.id,
    employer_name = COALESCE(s.employer_name, c.company_name)
FROM public.workplaces w, public.employer_connections c
WHERE s.workplace_id = w.id
  AND c.employer_id = w.employer_id
  AND c.user_id = s.user_id
  AND s.connection_id IS NULL;

-- --------------------------------------------------------------------------
-- 5. RPC funkcije (edini način za ustvarjanje/spreminjanje povezav)
-- --------------------------------------------------------------------------

-- Moja koda (uporabnik aplikacije); ustvari jo, če manjka
CREATE OR REPLACE FUNCTION public.get_my_connect_code()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_code TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;
  SELECT connect_code INTO v_code FROM public.user_connect_codes WHERE user_id = auth.uid();
  IF v_code IS NULL THEN
    INSERT INTO public.user_connect_codes(user_id, connect_code)
    VALUES (auth.uid(), public.generate_connect_code())
    ON CONFLICT (user_id) DO NOTHING;
    SELECT connect_code INTO v_code FROM public.user_connect_codes WHERE user_id = auth.uid();
  END IF;
  RETURN v_code;
END $$;

-- Koda delodajalca (dashboard); ustvari jo, če manjka
CREATE OR REPLACE FUNCTION public.get_my_employer_code()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_code TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;
  SELECT connect_code INTO v_code FROM public.employer_profiles WHERE id = auth.uid();
  IF v_code IS NULL THEN
    UPDATE public.employer_profiles SET connect_code = public.generate_connect_code() WHERE id = auth.uid() AND connect_code IS NULL;
    SELECT connect_code INTO v_code FROM public.employer_profiles WHERE id = auth.uid();
  END IF;
  RETURN v_code;
END $$;

-- Predogled podjetja po kodi (vrne SAMO ime podjetja)
CREATE OR REPLACE FUNCTION public.lookup_employer_by_code(p_code TEXT)
RETURNS TABLE (company_name TEXT) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;
  RETURN QUERY
    SELECT COALESCE(ep.company_name, 'Podjetje')
    FROM public.employer_profiles ep
    WHERE ep.connect_code = upper(trim(p_code)) AND ep.id <> auth.uid();
END $$;

-- Predogled zaposlenega po kodi (za delodajalca, vrne SAMO ime zaposlenega)
CREATE OR REPLACE FUNCTION public.lookup_employee_by_code(p_code TEXT)
RETURNS TABLE (user_name TEXT) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;
  SELECT uc.user_id INTO v_user FROM public.user_connect_codes uc WHERE uc.connect_code = upper(trim(p_code));
  IF v_user IS NULL OR v_user = auth.uid() THEN RETURN; END IF;
  RETURN QUERY SELECT public.resolve_user_display_name(v_user);
END $$;

-- Zaposleni pošlje prošnjo delodajalcu (s potrjenim soglasjem)
CREATE OR REPLACE FUNCTION public.request_employer_by_code(p_code TEXT, p_consent BOOLEAN)
RETURNS TABLE (connection_id UUID, company_name TEXT, status TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_employer UUID;
  v_company TEXT;
  v_existing public.employer_connections%ROWTYPE;
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;
  IF p_consent IS NOT TRUE THEN RAISE EXCEPTION 'Za povezavo morate potrditi soglasje o deljenju podatkov.'; END IF;

  SELECT ep.id, COALESCE(ep.company_name, 'Podjetje') INTO v_employer, v_company
  FROM public.employer_profiles ep WHERE ep.connect_code = upper(trim(p_code));

  IF v_employer IS NULL THEN RAISE EXCEPTION 'Delodajalec s to kodo ne obstaja.'; END IF;
  IF v_employer = auth.uid() THEN RAISE EXCEPTION 'S samim seboj se ne morete povezati.'; END IF;

  SELECT * INTO v_existing FROM public.employer_connections c WHERE c.employer_id = v_employer AND c.user_id = auth.uid();

  IF v_existing.id IS NOT NULL AND v_existing.status = 'approved' THEN
    RAISE EXCEPTION 'S tem podjetjem ste že povezani.';
  END IF;

  INSERT INTO public.employer_connections (employer_id, user_id, status, initiated_by, company_name, user_name, consent_at, updated_at)
  VALUES (v_employer, auth.uid(), 'pending', 'employee', v_company, public.resolve_user_display_name(auth.uid()), now(), now())
  ON CONFLICT (employer_id, user_id) DO UPDATE
    SET status = 'pending', initiated_by = 'employee', company_name = EXCLUDED.company_name,
        user_name = EXCLUDED.user_name, consent_at = now(), responded_at = NULL, updated_at = now()
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, v_company, 'pending'::TEXT;
END $$;

-- Delodajalec povabi zaposlenega po kodi in mu dodeli sektorje
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
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;
  IF p_workplace_ids IS NULL OR array_length(p_workplace_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Izberite vsaj en sektor.';
  END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_workplace_ids) x WHERE NOT public.is_workplace_owner(x)) THEN
    RAISE EXCEPTION 'Izbrani sektor ne pripada vašemu podjetju.';
  END IF;

  SELECT uc.user_id INTO v_user FROM public.user_connect_codes uc WHERE uc.connect_code = upper(trim(p_code));
  IF v_user IS NULL THEN RAISE EXCEPTION 'Uporabnik s to kodo ne obstaja.'; END IF;
  IF v_user = auth.uid() THEN RAISE EXCEPTION 'Samega sebe ne morete povabiti.'; END IF;

  v_name := public.resolve_user_display_name(v_user);
  SELECT COALESCE(ep.company_name, 'Podjetje') INTO v_company FROM public.employer_profiles ep WHERE ep.id = auth.uid();

  SELECT * INTO v_conn FROM public.employer_connections c WHERE c.employer_id = auth.uid() AND c.user_id = v_user;

  IF v_conn.id IS NOT NULL AND v_conn.status = 'approved' THEN
    -- Že povezan: novi sektorji so takoj aktivni (zaposleni nastavi le postavko)
    v_id := v_conn.id;
    v_status := 'approved';
    v_row_status := 'approved';
    UPDATE public.employer_connections SET company_name = v_company, user_name = v_name, updated_at = now() WHERE id = v_id;
  ELSE
    INSERT INTO public.employer_connections (employer_id, user_id, status, initiated_by, company_name, user_name, consent_at, responded_at, updated_at)
    VALUES (auth.uid(), v_user, 'invited', 'employer', v_company, v_name, NULL, NULL, now())
    ON CONFLICT (employer_id, user_id) DO UPDATE
      SET status = 'invited', initiated_by = 'employer', company_name = EXCLUDED.company_name,
          user_name = EXCLUDED.user_name, consent_at = NULL, responded_at = NULL, updated_at = now()
    RETURNING id INTO v_id;
    v_status := 'invited';
    v_row_status := 'invited';
  END IF;

  FOREACH v_wp IN ARRAY p_workplace_ids LOOP
    INSERT INTO public.workplace_requests (workplace_id, user_id, user_name, status, connection_id, is_active, disconnected_at, updated_at)
    VALUES (v_wp, v_user, v_name, v_row_status, v_id, v_row_status = 'approved', NULL, now())
    ON CONFLICT (workplace_id, user_id) DO UPDATE
      SET status = CASE WHEN public.workplace_requests.status = 'approved' THEN 'approved' ELSE EXCLUDED.status END,
          connection_id = v_id,
          user_name = EXCLUDED.user_name,
          is_active = (CASE WHEN public.workplace_requests.status = 'approved' THEN 'approved' ELSE EXCLUDED.status END) = 'approved',
          disconnected_at = NULL,
          updated_at = now();
  END LOOP;

  RETURN QUERY SELECT v_id, v_name, v_status;
END $$;

-- Zaposleni sprejme ali zavrne povabilo
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
      SET status = 'approved', is_active = true, disconnected_at = NULL, updated_at = now()
      WHERE connection_id = p_connection_id AND user_id = auth.uid() AND status = 'invited';
    RETURN 'approved';
  ELSE
    UPDATE public.employer_connections
      SET status = 'rejected', responded_at = now(), updated_at = now()
      WHERE id = p_connection_id;
    DELETE FROM public.workplace_requests
      WHERE connection_id = p_connection_id AND user_id = auth.uid() AND status = 'invited';
    RETURN 'rejected';
  END IF;
END $$;

-- Delodajalec odobri prošnjo zaposlenega in izbere sektorje
CREATE OR REPLACE FUNCTION public.approve_connection_request(p_connection_id UUID, p_workplace_ids UUID[])
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_conn public.employer_connections%ROWTYPE;
  v_wp UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;
  SELECT * INTO v_conn FROM public.employer_connections WHERE id = p_connection_id AND employer_id = auth.uid();
  IF v_conn.id IS NULL THEN RAISE EXCEPTION 'Prošnja ne obstaja.'; END IF;
  IF v_conn.status <> 'pending' THEN RAISE EXCEPTION 'Prošnja ni več v čakanju.'; END IF;
  IF p_workplace_ids IS NULL OR array_length(p_workplace_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Izberite vsaj en sektor.';
  END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_workplace_ids) x WHERE NOT public.is_workplace_owner(x)) THEN
    RAISE EXCEPTION 'Izbrani sektor ne pripada vašemu podjetju.';
  END IF;

  UPDATE public.employer_connections
    SET status = 'approved', responded_at = now(), updated_at = now()
    WHERE id = p_connection_id;

  FOREACH v_wp IN ARRAY p_workplace_ids LOOP
    INSERT INTO public.workplace_requests (workplace_id, user_id, user_name, status, connection_id, is_active, disconnected_at, updated_at)
    VALUES (v_wp, v_conn.user_id, v_conn.user_name, 'approved', p_connection_id, true, NULL, now())
    ON CONFLICT (workplace_id, user_id) DO UPDATE
      SET status = 'approved', connection_id = p_connection_id, is_active = true, disconnected_at = NULL, updated_at = now();
  END LOOP;

  RETURN 'approved';
END $$;

-- Delodajalec zavrne prošnjo ali prekliče povabilo
CREATE OR REPLACE FUNCTION public.reject_connection_request(p_connection_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;
  UPDATE public.employer_connections
    SET status = 'rejected', responded_at = now(), updated_at = now()
    WHERE id = p_connection_id AND employer_id = auth.uid() AND status IN ('pending', 'invited');
  IF NOT FOUND THEN RAISE EXCEPTION 'Prošnja ne obstaja ali ni več aktivna.'; END IF;
  DELETE FROM public.workplace_requests
    WHERE connection_id = p_connection_id AND status IN ('pending', 'invited');
  RETURN 'rejected';
END $$;

-- Zaposleni prekine povezavo s podjetjem (zgodovina ur ostane delodajalcu)
CREATE OR REPLACE FUNCTION public.disconnect_from_employer(p_connection_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;
  UPDATE public.employer_connections
    SET status = 'disconnected', updated_at = now()
    WHERE id = p_connection_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Povezava ne obstaja.'; END IF;
  UPDATE public.workplace_requests
    SET status = 'disconnected', is_active = false, disconnected_at = now(), updated_at = now()
    WHERE connection_id = p_connection_id AND user_id = auth.uid();
  RETURN 'disconnected';
END $$;

GRANT EXECUTE ON FUNCTION
  public.get_my_connect_code(),
  public.get_my_employer_code(),
  public.lookup_employer_by_code(TEXT),
  public.lookup_employee_by_code(TEXT),
  public.request_employer_by_code(TEXT, BOOLEAN),
  public.invite_employee_by_code(TEXT, UUID[]),
  public.respond_to_invitation(UUID, BOOLEAN),
  public.approve_connection_request(UUID, UUID[]),
  public.reject_connection_request(UUID),
  public.disconnect_from_employer(UUID),
  public.is_workplace_owner(UUID),
  public.is_workplace_member(UUID),
  public.has_connection_for_workplace(UUID)
TO authenticated;

REVOKE EXECUTE ON FUNCTION
  public.get_my_connect_code(),
  public.get_my_employer_code(),
  public.lookup_employer_by_code(TEXT),
  public.lookup_employee_by_code(TEXT),
  public.request_employer_by_code(TEXT, BOOLEAN),
  public.invite_employee_by_code(TEXT, UUID[]),
  public.respond_to_invitation(UUID, BOOLEAN),
  public.approve_connection_request(UUID, UUID[]),
  public.reject_connection_request(UUID),
  public.disconnect_from_employer(UUID)
FROM anon;

-- Ko delodajalec izbriše zadnji sektor zaposlenega, se povezava zaključi
CREATE OR REPLACE FUNCTION public.workplace_requests_after_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.connection_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.workplace_requests WHERE connection_id = OLD.connection_id) THEN
    UPDATE public.employer_connections
      SET status = 'disconnected', updated_at = now()
      WHERE id = OLD.connection_id AND status IN ('approved', 'invited', 'pending');
  END IF;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS workplace_requests_after_delete_trg ON public.workplace_requests;
CREATE TRIGGER workplace_requests_after_delete_trg
  AFTER DELETE ON public.workplace_requests
  FOR EACH ROW EXECUTE FUNCTION public.workplace_requests_after_delete();

-- Zaposleni NE sme sam spremeniti statusa sektorja (razen prekinitve)
CREATE OR REPLACE FUNCTION public.workplace_requests_guard_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND auth.uid() = OLD.user_id
     AND NOT public.is_workplace_owner(OLD.workplace_id) THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'disconnected' THEN
      RAISE EXCEPTION 'Statusa povezave ne morete spremeniti sami.';
    END IF;
    NEW.workplace_id := OLD.workplace_id;
    NEW.user_id := OLD.user_id;
    NEW.connection_id := OLD.connection_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS workplace_requests_guard_status_trg ON public.workplace_requests;
CREATE TRIGGER workplace_requests_guard_status_trg
  BEFORE UPDATE ON public.workplace_requests
  FOR EACH ROW EXECUTE FUNCTION public.workplace_requests_guard_status();

-- --------------------------------------------------------------------------
-- 6. RLS – odstrani VSE stare politike na ključnih tabelah in postavi nove
--    (kopija starih politik je v backup_2026_10.policies_snapshot)
-- --------------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('workplaces', 'workplace_requests', 'work_logs', 'employer_connections', 'user_connect_codes', 'employer_profiles')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

ALTER TABLE public.workplaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workplace_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connect_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

-- user_connect_codes: vsak vidi samo svojo kodo (spremembe le prek funkcij)
CREATE POLICY "cc_select_own" ON public.user_connect_codes
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- employer_profiles: delodajalec vidi in ureja samo svoj profil
CREATE POLICY "ep_select_own" ON public.employer_profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "ep_insert_own" ON public.employer_profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "ep_update_own" ON public.employer_profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- employer_connections: vidita le obe strani; spremembe samo prek RPC funkcij
CREATE POLICY "conn_select_parties" ON public.employer_connections
  FOR SELECT TO authenticated USING (employer_id = auth.uid() OR user_id = auth.uid());

-- workplaces: lastnik vse; zaposleni le sektorje, kamor je povabljen/uvrščen
CREATE POLICY "wp_select_owner_or_member" ON public.workplaces
  FOR SELECT TO authenticated USING (employer_id = auth.uid() OR public.is_workplace_member(id));
CREATE POLICY "wp_insert_owner" ON public.workplaces
  FOR INSERT TO authenticated WITH CHECK (employer_id = auth.uid());
CREATE POLICY "wp_update_owner" ON public.workplaces
  FOR UPDATE TO authenticated USING (employer_id = auth.uid()) WITH CHECK (employer_id = auth.uid());
CREATE POLICY "wp_delete_owner" ON public.workplaces
  FOR DELETE TO authenticated USING (employer_id = auth.uid());

-- workplace_requests: zaposleni svoje vrstice, delodajalec vrstice svojih sektorjev
-- (INSERT samo prek RPC funkcij -> nihče se ne more sam uvrstiti v tuj sektor)
CREATE POLICY "wr_select_parties" ON public.workplace_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_workplace_owner(workplace_id));
CREATE POLICY "wr_update_parties" ON public.workplace_requests
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_workplace_owner(workplace_id))
  WITH CHECK (user_id = auth.uid() OR public.is_workplace_owner(workplace_id));
CREATE POLICY "wr_delete_owner" ON public.workplace_requests
  FOR DELETE TO authenticated USING (public.is_workplace_owner(workplace_id));
CREATE POLICY "wr_delete_own_unapproved" ON public.workplace_requests
  FOR DELETE TO authenticated USING (user_id = auth.uid() AND status IN ('pending', 'invited', 'rejected', 'denied'));

-- work_logs: zaposleni svoje ure; delodajalec SAMO ure v svojih sektorjih
CREATE POLICY "wl_select" ON public.work_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (workplace_id IS NOT NULL AND public.is_workplace_owner(workplace_id)));

CREATE POLICY "wl_insert" ON public.work_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND (workplace_id IS NULL OR public.has_connection_for_workplace(workplace_id)))
    OR (workplace_id IS NOT NULL AND public.is_workplace_owner(workplace_id))
  );

CREATE POLICY "wl_update" ON public.work_logs
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR (workplace_id IS NOT NULL AND public.is_workplace_owner(workplace_id)))
  WITH CHECK (
    (user_id = auth.uid() AND (workplace_id IS NULL OR public.has_connection_for_workplace(workplace_id)))
    OR (workplace_id IS NOT NULL AND public.is_workplace_owner(workplace_id))
  );

CREATE POLICY "wl_delete" ON public.work_logs
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR (workplace_id IS NOT NULL AND public.is_workplace_owner(workplace_id)));

-- --------------------------------------------------------------------------
-- 7. Realtime
-- --------------------------------------------------------------------------
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

-- --------------------------------------------------------------------------
-- 8. Preverjanje
-- --------------------------------------------------------------------------
SELECT 'sektorji brez lastnika' AS preverjanje, count(*) AS stevilo FROM public.workplaces WHERE employer_id IS NULL
UNION ALL SELECT 'uporabniki brez kode', count(*) FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM public.user_connect_codes c WHERE c.user_id = u.id)
UNION ALL SELECT 'delodajalci brez kode', count(*) FROM public.employer_profiles WHERE connect_code IS NULL
UNION ALL SELECT 'povezave (approved)', count(*) FROM public.employer_connections WHERE status = 'approved'
UNION ALL SELECT 'povezave (pending)', count(*) FROM public.employer_connections WHERE status = 'pending'
UNION ALL SELECT 'sektorji zaposlenih brez povezave', count(*) FROM public.workplace_requests WHERE connection_id IS NULL AND status = 'approved'
UNION ALL SELECT 'viri dohodka povezani s podjetjem', count(*) FROM public.income_sources WHERE connection_id IS NOT NULL;
