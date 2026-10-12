-- ============================================================================
-- Migracija: enable_manual_user_deletion.sql
-- Omogoča nemoten ročni izbris uporabnikov v Supabase Authentication (Dashboard)
-- in preko aplikacije brez "Database error" napak.
--
-- Zavaruje podatke delodajalca (pretekle izmene in delovne ure ostanejo),
-- medtem ko se vsi osebni podatki uporabnika trajno in varno izbrišejo.
-- Zaženite v Supabase SQL Editorju.
-- ============================================================================

-- 1. Dodaj stolpec employee_name v schedule_shifts in work_logs (če še ne obstaja)
ALTER TABLE public.schedule_shifts 
ADD COLUMN IF NOT EXISTS employee_name TEXT;

ALTER TABLE public.work_logs 
ADD COLUMN IF NOT EXISTS employee_name TEXT;

-- Zapolni obstoječa imena
UPDATE public.schedule_shifts s
SET employee_name = COALESCE(
    s.employee_name,
    p.name,
    wr.user_name,
    'Zaposleni'
)
FROM public.schedule_shifts s2
LEFT JOIN public.user_profiles p ON p.id = s2.user_id
LEFT JOIN public.workplace_requests wr ON wr.user_id = s2.user_id AND wr.workplace_id = s2.workplace_id
WHERE s.id = s2.id AND s.employee_name IS NULL;

UPDATE public.work_logs l
SET employee_name = COALESCE(
    l.employee_name,
    p.name,
    'Zaposleni'
)
FROM public.work_logs l2
LEFT JOIN public.user_profiles p ON p.id = l2.user_id
WHERE l.id = l2.id AND l.employee_name IS NULL;


-- 2. Odstranitev blokirajočih FK omejitev na user_id za tabele delodajalcev
-- S tem preprečimo "Database error" ob brisanju uporabnika, hkrati pa ohranimo
-- vso zgodovino oddelanih ur in izmen podjetja.

ALTER TABLE public.schedule_shifts DROP CONSTRAINT IF EXISTS schedule_shifts_user_id_fkey;
ALTER TABLE public.schedule_shifts ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.workplace_requests DROP CONSTRAINT IF EXISTS workplace_requests_user_id_fkey;
ALTER TABLE public.workplace_requests ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.employer_connections DROP CONSTRAINT IF EXISTS employer_connections_user_id_fkey;
ALTER TABLE public.employer_connections ALTER COLUMN user_id DROP NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'work_logs' AND constraint_name = 'work_logs_user_id_fkey'
    ) THEN
        ALTER TABLE public.work_logs DROP CONSTRAINT work_logs_user_id_fkey;
    END IF;
END $$;
ALTER TABLE public.work_logs ALTER COLUMN user_id DROP NOT NULL;


-- 3. Dinamična posodobitev vseh ostalih tujih ključev v public shemi, ki kažejo na auth.users:
-- Vsak osebni FK, ki je prej imel NO ACTION ali RESTRICT (kar je povzročalo "Database error"),
-- se nastavi na ON DELETE CASCADE!
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT 
            cl.relname AS table_name,
            c.conname AS constraint_name,
            a.attname AS column_name
        FROM pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid
        JOIN pg_namespace ns ON ns.oid = cl.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
        WHERE ns.nspname = 'public'
          AND c.contype = 'f'
          AND c.confrelid = 'auth.users'::regclass
    ) LOOP
        -- Tabele z evidenco delodajalca (user_id ne sme kazati na auth.users, da se ne briše)
        IF (r.table_name = 'schedule_shifts' AND r.column_name = 'user_id') OR
           (r.table_name = 'workplace_requests' AND r.column_name = 'user_id') OR
           (r.table_name = 'work_logs' AND r.column_name = 'user_id') OR
           (r.table_name = 'employer_connections' AND r.column_name = 'user_id') THEN
           
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL', r.table_name, r.column_name);

        ELSIF (r.table_name = 'workplaces' AND r.column_name = 'created_by') THEN
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL', r.table_name, r.column_name);
            EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE SET NULL', 
                           r.table_name, r.constraint_name, r.column_name);

        ELSE
            -- Vse ostale tabele: ON DELETE CASCADE
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
            EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE', 
                           r.table_name, r.constraint_name, r.column_name);
        END IF;
    END LOOP;
END $$;


-- 4. Samodejni sprožilec (TRIGGER) BEFORE DELETE ON auth.users:
-- Ta trigger se sproži VEDNO, ko se uporabnik izbriše (ročno v Supabase Authentication
-- ALI preko mobilne aplikacije). Preden se uporabnik izbriše iz auth.users:
-- - shrani ime delavca na vseh preteklih izmenah in delovnih urah,
-- - prekine delodajalske povezave (status = 'disconnected'),
-- - pobriše le prihodnje izmene,
-- - pobriše osebne finance uporabnika.
CREATE OR REPLACE FUNCTION public.handle_auth_user_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_name TEXT;
BEGIN
    -- 1. Pridobi ime uporabnika pred izbrisom
    BEGIN
        SELECT name INTO v_name FROM public.user_profiles WHERE id = OLD.id;
    EXCEPTION WHEN OTHERS THEN v_name := NULL;
    END;

    IF v_name IS NULL OR TRIM(v_name) = '' THEN
        BEGIN
            SELECT user_name INTO v_name FROM public.employer_connections WHERE user_id = OLD.id AND user_name IS NOT NULL LIMIT 1;
        EXCEPTION WHEN OTHERS THEN v_name := NULL;
        END;
    END IF;

    IF v_name IS NULL OR TRIM(v_name) = '' THEN
        BEGIN
            SELECT user_name INTO v_name FROM public.workplace_requests WHERE user_id = OLD.id AND user_name IS NOT NULL LIMIT 1;
        EXCEPTION WHEN OTHERS THEN v_name := NULL;
        END;
    END IF;

    IF v_name IS NULL OR TRIM(v_name) = '' THEN
        v_name := COALESCE(OLD.raw_user_meta_data->>'full_name', OLD.raw_user_meta_data->>'name', 'Nekdanji zaposleni');
    END IF;

    -- 2. Prekini povezave delodajalcev
    BEGIN
        UPDATE public.employer_connections
        SET status = 'disconnected',
            user_name = COALESCE(user_name, v_name),
            updated_at = NOW()
        WHERE user_id = OLD.id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
        UPDATE public.workplace_requests
        SET status = 'disconnected',
            is_active = false,
            user_name = COALESCE(user_name, v_name),
            disconnected_at = NOW(),
            updated_at = NOW()
        WHERE user_id = OLD.id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- 3. Urnik: Bodoče izmene pobriši, pretekle ohrani za delodajalca z imenom
    BEGIN
        DELETE FROM public.schedule_shifts
        WHERE user_id = OLD.id AND date > CURRENT_DATE;

        UPDATE public.schedule_shifts
        SET employee_name = COALESCE(employee_name, v_name)
        WHERE user_id = OLD.id AND date <= CURRENT_DATE;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- 4. Delovne ure: Osebne vnose pobriši, za sektorje delodajalca pa ohrani z imenom
    BEGIN
        DELETE FROM public.work_logs
        WHERE user_id = OLD.id AND workplace_id IS NULL;

        UPDATE public.work_logs
        SET employee_name = COALESCE(employee_name, v_name)
        WHERE user_id = OLD.id AND workplace_id IS NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- 5. Počisti vse osebne tabele uporabnika (GDPR)
    BEGIN DELETE FROM public.incomes WHERE user_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.expenses WHERE user_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.assets WHERE user_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.liabilities WHERE user_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.income_sources WHERE user_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.subscriptions WHERE user_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.fixed_costs WHERE user_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.expense_categories WHERE user_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.asset_categories WHERE user_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.income_categories WHERE user_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.expense_purposes WHERE user_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.expense_purpose_members WHERE user_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.open_shift_signups WHERE user_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.user_settings WHERE user_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.user_connect_codes WHERE user_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.user_profiles WHERE id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;

    -- Če je bil uporabnik delodajalec, pospravi delodajalske zapise
    BEGIN DELETE FROM public.employer_profiles WHERE id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.workplaces WHERE employer_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.schedule_shifts WHERE employer_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.open_shifts WHERE employer_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.employer_connections WHERE employer_id = OLD.id; EXCEPTION WHEN OTHERS THEN NULL; END;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_before_auth_user_delete ON auth.users;
CREATE TRIGGER trg_before_auth_user_delete
BEFORE DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_delete();


-- 5. Samodejno nastavljanje employee_name ob novih vnosih
CREATE OR REPLACE FUNCTION public.set_employee_name_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (NEW.employee_name IS NULL OR TRIM(NEW.employee_name) = '') AND NEW.user_id IS NOT NULL THEN
        SELECT name INTO NEW.employee_name
        FROM public.user_profiles
        WHERE id = NEW.user_id;

        IF NEW.employee_name IS NULL OR TRIM(NEW.employee_name) = '' THEN
            SELECT user_name INTO NEW.employee_name
            FROM public.workplace_requests
            WHERE user_id = NEW.user_id AND user_name IS NOT NULL
            LIMIT 1;
        END IF;

        IF NEW.employee_name IS NULL OR TRIM(NEW.employee_name) = '' THEN
            SELECT user_name INTO NEW.employee_name
            FROM public.employer_connections
            WHERE user_id = NEW.user_id AND user_name IS NOT NULL
            LIMIT 1;
        END IF;

        IF NEW.employee_name IS NULL OR TRIM(NEW.employee_name) = '' THEN
            SELECT COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name') INTO NEW.employee_name
            FROM auth.users
            WHERE id = NEW.user_id;
        END IF;

        IF NEW.employee_name IS NULL OR TRIM(NEW.employee_name) = '' THEN
            NEW.employee_name := 'Zaposleni';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_employee_name_shifts ON public.schedule_shifts;
CREATE TRIGGER trg_set_employee_name_shifts
BEFORE INSERT OR UPDATE ON public.schedule_shifts
FOR EACH ROW
EXECUTE FUNCTION public.set_employee_name_on_insert();

DROP TRIGGER IF EXISTS trg_set_employee_name_logs ON public.work_logs;
CREATE TRIGGER trg_set_employee_name_logs
BEFORE INSERT OR UPDATE ON public.work_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_employee_name_on_insert();


-- 6. RPC funkcija delete_user_account() za klic iz mobilne aplikacije
DROP FUNCTION IF EXISTS public.delete_user_account();
DROP FUNCTION IF EXISTS public.delete_user_account(UUID);

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Uporabnik ni prijavljen.';
    END IF;

    -- Brisanje iz auth.users samodejno sproži trigger trg_before_auth_user_delete,
    -- ki poskrbi za celotno čiščenje in zaščito delodajalskih podatkov.
    DELETE FROM auth.users WHERE id = v_user_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
