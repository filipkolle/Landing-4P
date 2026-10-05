-- ==========================================================================
-- Migracija: employer_tasks (Zadolžitve in naloge delodajalca za delavce)
-- Omogoča ustvarjanje nalog z rokom, lokacijo, dodeljenim delavcem
-- ter rednih nalog (predlog) za urnik in delovne izmene.
-- ==========================================================================

-- 1. Ustvarjanje tabele employer_tasks
CREATE TABLE IF NOT EXISTS public.employer_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- dodeljeni delavec (NULL pomeni vsi / splošno)
  title TEXT NOT NULL,                                       -- naziv zadolžitve
  description TEXT,                                          -- podrobnejša navodila
  location TEXT,                                             -- lokacija / delovno mesto
  due_date DATE,                                             -- rok izvedbe (datum)
  due_time TEXT,                                             -- rok izvedbe (ura, npr. '14:00')
  is_recurring BOOLEAN DEFAULT false,                        -- redna / ponavljajoča se naloga (predloga)
  recurrence_type TEXT DEFAULT 'none',                       -- 'daily', 'weekly', 'shift', 'none'
  status TEXT DEFAULT 'pending',                             -- 'pending', 'completed'
  completed BOOLEAN DEFAULT false,                           -- stanje opravljenosti
  shift_id UUID REFERENCES public.schedule_shifts(id) ON DELETE SET NULL, -- povezava na določeno izmeno
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indeksi za visoko odzivnost
CREATE INDEX IF NOT EXISTS idx_employer_tasks_employer ON public.employer_tasks(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_tasks_user ON public.employer_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_tasks_due ON public.employer_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_employer_tasks_recurring ON public.employer_tasks(is_recurring);
CREATE INDEX IF NOT EXISTS idx_employer_tasks_shift ON public.employer_tasks(shift_id);

-- 3. Omogočitev Row Level Security (RLS)
ALTER TABLE public.employer_tasks ENABLE ROW LEVEL SECURITY;

-- 4. RLS Politike
-- Delodajalec ima poln dostop do vseh svojih nalog
DROP POLICY IF EXISTS "Employer full access to own tasks" ON public.employer_tasks;
CREATE POLICY "Employer full access to own tasks"
  ON public.employer_tasks
  FOR ALL
  TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- Zaposleni lahko vidi naloge, ki so mu dodeljene (ali tiste brez določenega delavca)
DROP POLICY IF EXISTS "Employee can view assigned tasks" ON public.employer_tasks;
CREATE POLICY "Employee can view assigned tasks"
  ON public.employer_tasks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Zaposleni lahko posodobi stanje opravljenosti naloge
DROP POLICY IF EXISTS "Employee can update task completion" ON public.employer_tasks;
CREATE POLICY "Employee can update task completion"
  ON public.employer_tasks
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- 5. Realtime publikacija
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.employer_tasks;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN undefined_object THEN
    NULL;
END $$;
