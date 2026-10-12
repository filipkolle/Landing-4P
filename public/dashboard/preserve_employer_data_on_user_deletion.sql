-- ============================================================================
-- Migracija: preserve_employer_data_on_user_deletion.sql
-- Zavarovanje podatkov delodajalca ob izbrisu računa zaposlenega.
-- Povezava se prekine, vsi pretekli podatki do datuma izbrisa (ure, izmene,
-- ime delavca in celotna evidenca) pa trajno ostanejo v delodajalčevem dashboardu.
-- Zaženite v Supabase SQL Editorju.
-- ============================================================================

-- 1. Tabela schedule_shifts (Urnik izmen)
-- Dodaj stolpec employee_name za trajno ohranitev imena zaposlenega
ALTER TABLE public.schedule_shifts 
ADD COLUMN IF NOT EXISTS employee_name TEXT;

-- Zapolni obstoječa imena iz profilov in zahtev (user_profiles ima stolpec 'name')
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

-- Odstranimo tujo ključno povezavo na auth.users(id), da se ob izbrisu računa
-- podatki NE izbrišejo (CASCADE) in se user_id NE nastavi na NULL (SET NULL),
-- temveč se trajno ohrani UUID in vsi pretekli podatki ostanejo povezani!
ALTER TABLE public.schedule_shifts 
DROP CONSTRAINT IF EXISTS schedule_shifts_user_id_fkey;

ALTER TABLE public.schedule_shifts 
ALTER COLUMN user_id DROP NOT NULL;


-- 2. Tabela workplace_requests (Zahteve in dodeljeni sektorji)
-- Odstranimo CASCADE omejitev na auth.users, da delodajalec obdrži evidenco
ALTER TABLE public.workplace_requests 
DROP CONSTRAINT IF EXISTS workplace_requests_user_id_fkey;

ALTER TABLE public.workplace_requests 
ALTER COLUMN user_id DROP NOT NULL;


-- 3. Tabela employer_connections (Povezave z delodajalci)
ALTER TABLE public.employer_connections 
DROP CONSTRAINT IF EXISTS employer_connections_user_id_fkey;

ALTER TABLE public.employer_connections 
ALTER COLUMN user_id DROP NOT NULL;


-- 4. Tabela work_logs (Beleženje delovnih ur)
-- Dodaj stolpec employee_name za trajno ohranitev imena na delovnih urah
ALTER TABLE public.work_logs 
ADD COLUMN IF NOT EXISTS employee_name TEXT;

UPDATE public.work_logs l
SET employee_name = COALESCE(
    l.employee_name,
    p.name,
    'Zaposleni'
)
FROM public.work_logs l2
LEFT JOIN public.user_profiles p ON p.id = l2.user_id
WHERE l.id = l2.id AND l.employee_name IS NULL;

-- Odstrani morebitno CASCADE / FK omejitev na auth.users
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'work_logs' AND constraint_name = 'work_logs_user_id_fkey'
    ) THEN
        ALTER TABLE public.work_logs DROP CONSTRAINT work_logs_user_id_fkey;
    END IF;
END $$;

ALTER TABLE public.work_logs 
ALTER COLUMN user_id DROP NOT NULL;


-- 5. Samodejno nastavljanje employee_name ob vnosu izmen ali delovnih ur
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


-- 6. Posodobi RPC funkcijo delete_user_account() za varno brisanje računa:
-- Prekine povezavo, pobriše samo BODOČE izmene, ohrani vse PRETEKLE podatke do danes za delodajalca,
-- ter izbriše zasebne finance uporabnika skladno z GDPR.
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
    v_user_name TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Uporabnik ni prijavljen.';
    END IF;

    -- 1. Shrani ime uporabnika, preden se njegov profil izbriše
    SELECT name INTO v_user_name
    FROM public.user_profiles
    WHERE id = v_user_id;

    IF v_user_name IS NULL OR TRIM(v_user_name) = '' THEN
        SELECT user_name INTO v_user_name
        FROM public.employer_connections
        WHERE user_id = v_user_id AND user_name IS NOT NULL
        LIMIT 1;
    END IF;

    IF v_user_name IS NULL OR TRIM(v_user_name) = '' THEN
        SELECT user_name INTO v_user_name
        FROM public.workplace_requests
        WHERE user_id = v_user_id AND user_name IS NOT NULL
        LIMIT 1;
    END IF;

    IF v_user_name IS NULL OR TRIM(v_user_name) = '' THEN
        SELECT COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name') INTO v_user_name
        FROM auth.users
        WHERE id = v_user_id;
    END IF;

    IF v_user_name IS NULL OR TRIM(v_user_name) = '' THEN
        v_user_name := 'Nekdanji zaposleni';
    END IF;

    -- 2. Prekini povezave pri delodajalcih (ohrani zapis in ime)
    UPDATE public.employer_connections
    SET status = 'disconnected',
        user_name = COALESCE(user_name, v_user_name),
        updated_at = NOW()
    WHERE user_id = v_user_id;

    UPDATE public.workplace_requests
    SET status = 'disconnected',
        is_active = false,
        user_name = COALESCE(user_name, v_user_name),
        disconnected_at = NOW(),
        updated_at = NOW()
    WHERE user_id = v_user_id;

    -- 3. Obdelaj urnik izmen (schedule_shifts):
    -- A) Prihodnje izmene (date > CURRENT_DATE) se pobrišejo, ker uporabnik ne bo več delal
    DELETE FROM public.schedule_shifts
    WHERE user_id = v_user_id AND date > CURRENT_DATE;

    -- B) Pretekle izmene (date <= CURRENT_DATE) se OHRANIJO za evidenco delodajalca z vsemi urami in imenom
    UPDATE public.schedule_shifts
    SET employee_name = COALESCE(employee_name, v_user_name)
    WHERE user_id = v_user_id AND date <= CURRENT_DATE;

    -- 4. Obdelaj delovne zapise (work_logs):
    -- A) Osebne vnose brez delodajalca (workplace_id IS NULL) pobriši
    DELETE FROM public.work_logs
    WHERE user_id = v_user_id AND workplace_id IS NULL;

    -- B) Vnose za sektorje delodajalca (workplace_id IS NOT NULL) ohrani za evidenco delodajalca
    UPDATE public.work_logs
    SET employee_name = COALESCE(employee_name, v_user_name)
    WHERE user_id = v_user_id AND workplace_id IS NOT NULL;

    -- 5. Pobriši zgolj osebne finančne podatke uporabnika (GDPR pravica do izbrisa)
    DELETE FROM public.incomes WHERE user_id = v_user_id;
    DELETE FROM public.expenses WHERE user_id = v_user_id;
    DELETE FROM public.assets WHERE user_id = v_user_id;
    DELETE FROM public.liabilities WHERE user_id = v_user_id;
    DELETE FROM public.expense_categories WHERE user_id = v_user_id;
    DELETE FROM public.asset_categories WHERE user_id = v_user_id;
    DELETE FROM public.income_categories WHERE user_id = v_user_id;
    DELETE FROM public.income_sources WHERE user_id = v_user_id;
    DELETE FROM public.subscriptions WHERE user_id = v_user_id;
    DELETE FROM public.fixed_costs WHERE user_id = v_user_id;
    DELETE FROM public.user_settings WHERE user_id = v_user_id;
    DELETE FROM public.user_connect_codes WHERE user_id = v_user_id;
    DELETE FROM public.user_profiles WHERE id = v_user_id;

    -- 6. Dokončno izbriši uporabnika iz auth.users
    DELETE FROM auth.users WHERE id = v_user_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
