-- ==========================================================================
-- Migracija: schedule_shifts (Urnik delovnih izmen)
-- Omogoča delodajalcem vodenje urnika, zaposlenim pa pregled njihovih izmen
-- ==========================================================================

-- 1. Ustvarjanje tabele schedule_shifts
CREATE TABLE IF NOT EXISTS public.schedule_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workplace_id UUID NOT NULL REFERENCES public.workplaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,      -- npr. '08:00'
  end_time TEXT NOT NULL,        -- npr. '16:00'
  hours NUMERIC(4, 2) NOT NULL,  -- npr. 8.0 ali 7.5
  note TEXT,                     -- opomba delodajalca (npr. 'Dopoldanska izmena')
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ustvarjanje indeksov za optimalne poizvedbe
CREATE INDEX IF NOT EXISTS idx_schedule_shifts_employer_date 
  ON public.schedule_shifts(employer_id, date);

CREATE INDEX IF NOT EXISTS idx_schedule_shifts_user_date 
  ON public.schedule_shifts(user_id, date);

CREATE INDEX IF NOT EXISTS idx_schedule_shifts_workplace 
  ON public.schedule_shifts(workplace_id);

-- 3. Omogočitev Row Level Security (RLS)
ALTER TABLE public.schedule_shifts ENABLE ROW LEVEL SECURITY;

-- 4. Politike za delodajalca (Poln dostop do lastnih ustvarjenih izmen)
DROP POLICY IF EXISTS "Employer full access to own shifts" ON public.schedule_shifts;
CREATE POLICY "Employer full access to own shifts"
  ON public.schedule_shifts
  FOR ALL
  TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- 5. Politika za zaposlenega (Branje izmen, kjer je uporabnik dodeljen)
DROP POLICY IF EXISTS "Employee view assigned shifts" ON public.schedule_shifts;
CREATE POLICY "Employee view assigned shifts"
  ON public.schedule_shifts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 6. Omogočitev Realtime poslušanja za tabelo schedule_shifts (če publikacija že vsebuje tabelo, ignorira napako)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_shifts;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
