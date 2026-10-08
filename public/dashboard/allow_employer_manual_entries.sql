-- ==========================================================================
-- Migracija: allow_employer_manual_entries.sql
-- Omogoča delodajalcu, da:
-- 1. Sam ustvari profil zaposlenega (tabela employer_manual_employees)
-- 2. Ročno vnaša, posodablja in briše delovne ure v work_logs za svoje sektorje
-- ==========================================================================

-- 1. Tabela za ročno ustvarjene profile zaposlenih s strani delodajalca
CREATE TABLE IF NOT EXISTS public.employer_manual_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  workplace_id UUID REFERENCES public.workplaces(id) ON DELETE CASCADE,
  pay_type TEXT NOT NULL DEFAULT 'hourly',
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  net_salary NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'Zaposlen',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indeksi za hitrejše iskanje
CREATE INDEX IF NOT EXISTS idx_employer_manual_emp_employer ON public.employer_manual_employees(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_manual_emp_workplace ON public.employer_manual_employees(workplace_id);

-- RLS za employer_manual_employees
ALTER TABLE public.employer_manual_employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employer full access to manual employees" ON public.employer_manual_employees;
CREATE POLICY "Employer full access to manual employees"
  ON public.employer_manual_employees
  FOR ALL
  TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- 2. Dodajanje stolpca manual_employee_id v work_logs (če še ne obstaja)
ALTER TABLE public.work_logs
ADD COLUMN IF NOT EXISTS manual_employee_id TEXT,
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2);

-- Zagotovi, da je user_id v work_logs lahko NULL (za zaposlene brez lastnega 4P računa)
ALTER TABLE public.work_logs
ALTER COLUMN user_id DROP NOT NULL;

-- 3. RLS politike za delodajalca v tabeli work_logs
-- Dovoljenje za INSERT: Delodajalec lahko vnaša delovne ure za svoja delovna mesta
DROP POLICY IF EXISTS "Employers can insert work logs for their workplaces" ON public.work_logs;
CREATE POLICY "Employers can insert work logs for their workplaces"
  ON public.work_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workplaces w
      WHERE w.id = work_logs.workplace_id
      AND (w.employer_id = auth.uid() OR w.created_by = auth.uid())
    )
    OR user_id = auth.uid()
  );

-- Dovoljenje za UPDATE: Delodajalec lahko posodablja delovne ure za svoja delovna mesta
DROP POLICY IF EXISTS "Employers can update work logs for their workplaces" ON public.work_logs;
CREATE POLICY "Employers can update work logs for their workplaces"
  ON public.work_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workplaces w
      WHERE w.id = work_logs.workplace_id
      AND (w.employer_id = auth.uid() OR w.created_by = auth.uid())
    )
    OR user_id = auth.uid()
  );

-- Dovoljenje za DELETE: Delodajalec lahko briše delovne ure za svoja delovna mesta
DROP POLICY IF EXISTS "Employers can delete work logs for their workplaces" ON public.work_logs;
CREATE POLICY "Employers can delete work logs for their workplaces"
  ON public.work_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workplaces w
      WHERE w.id = work_logs.workplace_id
      AND (w.employer_id = auth.uid() OR w.created_by = auth.uid())
    )
    OR user_id = auth.uid()
  );

-- 4. Realtime poslušanje za employer_manual_employees
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.employer_manual_employees;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN OTHERS THEN
    NULL;
END $$;
