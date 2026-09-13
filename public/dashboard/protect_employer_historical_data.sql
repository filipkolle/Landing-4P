-- ==========================================================================
-- Migracija: protect_employer_historical_data.sql
-- Trajna zaščita preteklih podatkov podjetja ob prekinitvi povezave ali
-- izbrisu računa zaposlenega.
-- ==========================================================================

-- 1. Dodajanje stolpcev v work_logs za trajno ohranitev podatkov o delavcu
ALTER TABLE public.work_logs
ADD COLUMN IF NOT EXISTS employee_name TEXT,
ADD COLUMN IF NOT EXISTS is_historical BOOLEAN DEFAULT false;

-- Izpolni employee_name za obstoječe zapise iz tabel profiles in workplace_requests
DO $$
BEGIN
    -- Poskusi iz profiles / user_profiles
    UPDATE public.work_logs wl
    SET employee_name = COALESCE(p.full_name, p.name)
    FROM public.profiles p
    WHERE wl.user_id = p.id AND (wl.employee_name IS NULL OR wl.employee_name = '');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    -- Poskusi iz workplace_requests
    UPDATE public.work_logs wl
    SET employee_name = wr.user_name
    FROM public.workplace_requests wr
    WHERE wl.user_id = wr.user_id 
      AND (wl.employee_name IS NULL OR wl.employee_name = '')
      AND wr.user_name IS NOT NULL;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2. Zaščita tujega ključa na user_id v work_logs in workplace_requests (preprečitev kaskadnega brisanja)
-- Če zaposleni izbriše svoj račun v aplikaciji (auth.users), delovni logi in zahteve podjetja NE SMEJO izginiti!
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    -- Za work_logs
    FOR constraint_rec IN (
        SELECT conname, relname
        FROM pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid
        JOIN pg_namespace ns ON ns.oid = cl.relnamespace
        WHERE ns.nspname = 'public' 
          AND cl.relname = 'work_logs'
          AND c.contype = 'f'
          AND confrelid = 'auth.users'::regclass
    ) LOOP
        EXECUTE 'ALTER TABLE public.work_logs DROP CONSTRAINT ' || quote_ident(constraint_rec.conname);
        EXECUTE 'ALTER TABLE public.work_logs ALTER COLUMN user_id DROP NOT NULL';
        EXECUTE 'ALTER TABLE public.work_logs ADD CONSTRAINT ' || quote_ident(constraint_rec.conname) || 
                ' FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL';
    END LOOP;

    -- Za workplace_requests
    FOR constraint_rec IN (
        SELECT conname, relname
        FROM pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid
        JOIN pg_namespace ns ON ns.oid = cl.relnamespace
        WHERE ns.nspname = 'public' 
          AND cl.relname = 'workplace_requests'
          AND c.contype = 'f'
          AND confrelid = 'auth.users'::regclass
    ) LOOP
        EXECUTE 'ALTER TABLE public.workplace_requests DROP CONSTRAINT ' || quote_ident(constraint_rec.conname);
        EXECUTE 'ALTER TABLE public.workplace_requests ALTER COLUMN user_id DROP NOT NULL';
        EXECUTE 'ALTER TABLE public.workplace_requests ADD CONSTRAINT ' || quote_ident(constraint_rec.conname) || 
                ' FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL';
    END LOOP;
END $$;

-- 3. Zaščita zgodovine v workplace_requests
ALTER TABLE public.workplace_requests
ADD COLUMN IF NOT EXISTS disconnected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Zapisi, ki so approved, so privzeto aktivni, razen če imajo disconnected_at
UPDATE public.workplace_requests
SET is_active = (status = 'approved')
WHERE is_active IS NULL;

-- 4. Posodobitev RLS politik za workplace_requests:
-- Zaposleni NE MORE izbrisati odobrene zahteve (evidence o zaposlitvi).
-- Lahko jo le prekine (status = 'disconnected', disconnected_at = now()).
DROP POLICY IF EXISTS "Users can delete their own workplace requests" ON public.workplace_requests;
DROP POLICY IF EXISTS "Users can delete only pending workplace requests" ON public.workplace_requests;

CREATE POLICY "Users can delete only pending workplace requests"
    ON public.workplace_requests FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Users can disconnect their own workplace requests" ON public.workplace_requests;
CREATE POLICY "Users can disconnect their own workplace requests"
    ON public.workplace_requests FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. RLS za vpogled v delovne vnose:
-- Zagotovi neoviran dostop do branja zapisov (aplikacija filtrira po sektorjih podjetja)
DROP POLICY IF EXISTS "Employers can view work logs for their workplaces" ON public.work_logs;
DROP POLICY IF EXISTS "Allow authenticated read on work_logs" ON public.work_logs;

CREATE POLICY "Allow authenticated read on work_logs"
    ON public.work_logs FOR SELECT
    TO authenticated
    USING (true);

-- 6. Trigger za samodejno shranjevanje imena zaposlenega ob vnosu dela
CREATE OR REPLACE FUNCTION public.set_work_log_employee_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.employee_name IS NULL OR NEW.employee_name = '' THEN
        BEGIN
            SELECT user_name INTO NEW.employee_name
            FROM public.workplace_requests
            WHERE user_id = NEW.user_id AND (workplace_id = NEW.workplace_id OR workplace_id IS NOT NULL)
            ORDER BY created_at DESC
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;

        IF NEW.employee_name IS NULL OR NEW.employee_name = '' THEN
            BEGIN
                SELECT COALESCE(full_name, name) INTO NEW.employee_name
                FROM public.profiles
                WHERE id = NEW.user_id;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_work_log_employee_name ON public.work_logs;
CREATE TRIGGER trg_set_work_log_employee_name
BEFORE INSERT OR UPDATE ON public.work_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_work_log_employee_name();
