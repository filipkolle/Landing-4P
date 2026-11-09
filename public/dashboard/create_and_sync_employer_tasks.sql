-- ==========================================================================
-- Migracija: create_and_sync_employer_tasks.sql
-- Podpora za naloge/zadolžitve delodajalca, povezane z urnikom in delovnimi izmenami.
-- Naloge se shranjujejo v ločeno tabelo employer_tasks in se NE zapisujejo v opombe izmene!
-- ==========================================================================

-- 1. Ustvarjanje tabele employer_tasks, če še ne obstaja
CREATE TABLE IF NOT EXISTS public.employer_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  due_date DATE,
  due_time TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT DEFAULT 'none',
  status TEXT DEFAULT 'pending',
  completed BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  shift_id UUID REFERENCES public.schedule_shifts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Dodajanje manjkajočih stolpcev, če tabela že obstaja iz prejšnjih verzij
ALTER TABLE public.employer_tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.employer_tasks ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.employer_tasks ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
ALTER TABLE public.employer_tasks ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE public.employer_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.employer_tasks ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES public.schedule_shifts(id) ON DELETE SET NULL;
ALTER TABLE public.employer_tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.employer_tasks ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.employer_tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.employer_tasks ADD COLUMN IF NOT EXISTS due_time TEXT;
ALTER TABLE public.employer_tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE public.employer_tasks ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'none';

-- 3. Indeksi za hitro poizvedovanje
CREATE INDEX IF NOT EXISTS idx_employer_tasks_employer ON public.employer_tasks(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_tasks_user ON public.employer_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_tasks_assigned_user ON public.employer_tasks(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_employer_tasks_shift ON public.employer_tasks(shift_id);
CREATE INDEX IF NOT EXISTS idx_employer_tasks_due ON public.employer_tasks(due_date);

-- 4. Samodejno usklajevanje polj user_id/assigned_user_id ter completed/is_completed
CREATE OR REPLACE FUNCTION public.sync_employer_tasks_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Uskladi ID delavca
  IF NEW.user_id IS NULL AND NEW.assigned_user_id IS NOT NULL THEN
    NEW.user_id := NEW.assigned_user_id;
  ELSIF NEW.assigned_user_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.assigned_user_id := NEW.user_id;
  END IF;

  -- Uskladi stanje opravljenosti
  IF NEW.is_completed IS TRUE OR NEW.completed IS TRUE THEN
    NEW.is_completed := true;
    NEW.completed := true;
    NEW.status := 'completed';
    IF NEW.completed_at IS NULL THEN
      NEW.completed_at := timezone('utc'::text, now());
    END IF;
  ELSE
    NEW.is_completed := false;
    NEW.completed := false;
    NEW.status := 'pending';
    NEW.completed_at := NULL;
  END IF;

  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_employer_tasks_fields ON public.employer_tasks;
CREATE TRIGGER trg_sync_employer_tasks_fields
BEFORE INSERT OR UPDATE ON public.employer_tasks
FOR EACH ROW
EXECUTE FUNCTION public.sync_employer_tasks_fields();

-- 5. Row Level Security (RLS)
ALTER TABLE public.employer_tasks ENABLE ROW LEVEL SECURITY;

-- Delodajalec ima poln dostop do vseh nalog, ki jih je ustvaril
DROP POLICY IF EXISTS "Employer full access to own tasks" ON public.employer_tasks;
CREATE POLICY "Employer full access to own tasks"
  ON public.employer_tasks
  FOR ALL
  TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- Zaposleni lahko vidi naloge, ki so mu dodeljene (ali splošne brez dodeljenega delavca)
DROP POLICY IF EXISTS "Employee can view assigned tasks" ON public.employer_tasks;
CREATE POLICY "Employee can view assigned tasks"
  ON public.employer_tasks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR assigned_user_id = auth.uid() OR (user_id IS NULL AND assigned_user_id IS NULL));

-- Zaposleni lahko posodobi stanje opravljenosti nalog
DROP POLICY IF EXISTS "Employee can update task completion" ON public.employer_tasks;
CREATE POLICY "Employee can update task completion"
  ON public.employer_tasks
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR assigned_user_id = auth.uid() OR (user_id IS NULL AND assigned_user_id IS NULL))
  WITH CHECK (user_id = auth.uid() OR assigned_user_id = auth.uid() OR (user_id IS NULL AND assigned_user_id IS NULL));

-- 6. Omogoči Realtime poslušanje
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.employer_tasks;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

