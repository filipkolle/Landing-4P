-- Migracija: employee_absences (Evidenca odsotnosti: dopust, bolniška in druge odsotnosti)

-- 1. Ustvarjanje tabele employee_absences
CREATE TABLE IF NOT EXISTS public.employee_absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vacation', 'sick_leave', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  hours_per_day NUMERIC(5,2) NOT NULL DEFAULT 8.00,
  pay_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_dates CHECK (end_date >= start_date)
);

-- 2. Indeksi za hitro poizvedovanje po delodajalcu, zaposlenem in datumih
CREATE INDEX IF NOT EXISTS idx_employee_absences_employer ON public.employee_absences(employer_id);
CREATE INDEX IF NOT EXISTS idx_employee_absences_user ON public.employee_absences(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_absences_dates ON public.employee_absences(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_employee_absences_user_dates ON public.employee_absences(user_id, start_date, end_date);

-- 3. Omogočitev Row Level Security (RLS)
ALTER TABLE public.employee_absences ENABLE ROW LEVEL SECURITY;

-- 4. Varnostne politike za delodajalca
DROP POLICY IF EXISTS "Employer full access to employee absences" ON public.employee_absences;
CREATE POLICY "Employer full access to employee absences"
  ON public.employee_absences
  FOR ALL
  TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- 5. Varnostne politike za zaposlenega (branje in vnos lastnih odsotnosti)
DROP POLICY IF EXISTS "Employee view own absences" ON public.employee_absences;
CREATE POLICY "Employee view own absences"
  ON public.employee_absences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Employee insert own absences" ON public.employee_absences;
CREATE POLICY "Employee insert own absences"
  ON public.employee_absences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Employee update own absences" ON public.employee_absences;
CREATE POLICY "Employee update own absences"
  ON public.employee_absences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Employee delete own absences" ON public.employee_absences;
CREATE POLICY "Employee delete own absences"
  ON public.employee_absences
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 6. Omogočitev Realtime poslušanja za tabelo employee_absences
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_absences;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN OTHERS THEN
    NULL;
END $$;
