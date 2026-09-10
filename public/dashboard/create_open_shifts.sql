-- ==========================================================================
-- Migracija: create_open_shifts.sql
-- Podpora za odprte izmene (Open Shifts) z možnostjo proste prijave zaposlenih
-- ==========================================================================

-- 1. Ustvari tabelo open_shifts
CREATE TABLE IF NOT EXISTS public.open_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workplace_id UUID NOT NULL REFERENCES public.workplaces(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,         -- npr. '08:00'
  end_time TEXT NOT NULL,           -- npr. '16:00'
  hours NUMERIC(4, 2) NOT NULL,     -- npr. 8.0
  required_spots INT NOT NULL DEFAULT 1, -- število potrebnih oseb
  note TEXT,                        -- opomba (npr. 'Vikend gneča, terasa')
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ustvari tabelo open_shift_signups
CREATE TABLE IF NOT EXISTS public.open_shift_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  open_shift_id UUID NOT NULL REFERENCES public.open_shifts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(open_shift_id, user_id)
);

-- 3. Dodaj open_shift_id v schedule_shifts, če še ne obstaja
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schedule_shifts' AND column_name = 'open_shift_id'
  ) THEN
    ALTER TABLE public.schedule_shifts 
    ADD COLUMN open_shift_id UUID REFERENCES public.open_shifts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Indeksi za hitrost poizvedb
CREATE INDEX IF NOT EXISTS idx_open_shifts_employer_date ON public.open_shifts(employer_id, date);
CREATE INDEX IF NOT EXISTS idx_open_shifts_workplace_date ON public.open_shifts(workplace_id, date);
CREATE INDEX IF NOT EXISTS idx_open_shift_signups_shift ON public.open_shift_signups(open_shift_id);
CREATE INDEX IF NOT EXISTS idx_open_shift_signups_user ON public.open_shift_signups(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_shifts_open_shift ON public.schedule_shifts(open_shift_id);

-- 5. Row Level Security (RLS)
ALTER TABLE public.open_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_shift_signups ENABLE ROW LEVEL SECURITY;

-- Politike za open_shifts:
-- Delodajalec ima poln dostop do svojih odprtih izmen
DROP POLICY IF EXISTS "Employer full access to own open shifts" ON public.open_shifts;
CREATE POLICY "Employer full access to own open shifts"
  ON public.open_shifts
  FOR ALL
  TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- Zaposleni lahko vidi odprte izmene za delovna mesta, kjer ima odobren zahtevek
DROP POLICY IF EXISTS "Employees view open shifts for approved workplaces" ON public.open_shifts;
CREATE POLICY "Employees view open shifts for approved workplaces"
  ON public.open_shifts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workplace_requests wr
      WHERE wr.workplace_id = open_shifts.workplace_id
      AND wr.user_id = auth.uid()
      AND wr.status = 'approved'
    )
  );

-- Politike za open_shift_signups:
-- Delodajalec lahko vidi in upravlja prijave za svoje odprte izmene
DROP POLICY IF EXISTS "Employer full access to signups" ON public.open_shift_signups;
CREATE POLICY "Employer full access to signups"
  ON public.open_shift_signups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.open_shifts os
      WHERE os.id = open_shift_signups.open_shift_id
      AND os.employer_id = auth.uid()
    )
  );

-- Zaposleni lahko vidi prijave na odprte izmene (da vidi število in kdo je prijavljen)
DROP POLICY IF EXISTS "Employees view signups" ON public.open_shift_signups;
CREATE POLICY "Employees view signups"
  ON public.open_shift_signups
  FOR SELECT
  TO authenticated
  USING (true);

-- Zaposleni se lahko prijavi na odprto izmeno (INSERT)
DROP POLICY IF EXISTS "Employees can signup for open shift" ON public.open_shift_signups;
CREATE POLICY "Employees can signup for open shift"
  ON public.open_shift_signups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Zaposleni se lahko odjavi iz odprte izmene (DELETE)
DROP POLICY IF EXISTS "Employees can cancel own signup" ON public.open_shift_signups;
CREATE POLICY "Employees can cancel own signup"
  ON public.open_shift_signups
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Politika za schedule_shifts: zaposleni si lahko sam ustvari vnos v urniku ob prijavi na odprto izmeno
DROP POLICY IF EXISTS "Employee can insert schedule shift from open shift" ON public.schedule_shifts;
CREATE POLICY "Employee can insert schedule shift from open shift"
  ON public.schedule_shifts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND open_shift_id IS NOT NULL
  );

-- Zaposleni lahko izbriše svojo dodeljeno izmeno iz odprte izmene ob odjavi
DROP POLICY IF EXISTS "Employee can delete own shift from open shift" ON public.schedule_shifts;
CREATE POLICY "Employee can delete own shift from open shift"
  ON public.schedule_shifts
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- 6. Dodaj tabeli v Realtime publikacijo
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.open_shifts;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.open_shift_signups;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
