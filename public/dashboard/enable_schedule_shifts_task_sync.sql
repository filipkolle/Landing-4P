-- ==========================================================================
-- Migracija: enable_schedule_shifts_task_sync.sql
-- Omogoča zaposlenim shranjevanje in posodabljanje opomb ter obkljukanih
-- zadolžitev/nalog v njihovih delovnih izmenah (schedule_shifts).
-- ==========================================================================

-- 1. Prepričaj se, da je Row Level Security (RLS) vklopljen
ALTER TABLE public.schedule_shifts ENABLE ROW LEVEL SECURITY;

-- 2. Odstrani morebitne stare/podvojene politike za posodabljanje
DROP POLICY IF EXISTS "Users can update own schedule shifts" ON public.schedule_shifts;
DROP POLICY IF EXISTS "Employee can update assigned shifts" ON public.schedule_shifts;
DROP POLICY IF EXISTS "Employee update own shifts" ON public.schedule_shifts;

-- 3. Nova politika: Zaposleni lahko posodobi svoje dodeljene izmene (user_id = auth.uid())
CREATE POLICY "Users can update own schedule shifts"
  ON public.schedule_shifts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Prepričaj se, da ima delodajalec še naprej poln dostop do svojih izmen
DROP POLICY IF EXISTS "Employer full access to own shifts" ON public.schedule_shifts;
CREATE POLICY "Employer full access to own shifts"
  ON public.schedule_shifts
  FOR ALL
  TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- 5. Prepričaj se, da zaposleni lahko bere svoje izmene
DROP POLICY IF EXISTS "Employee view assigned shifts" ON public.schedule_shifts;
CREATE POLICY "Employee view assigned shifts"
  ON public.schedule_shifts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 6. Omogoči poslušanje v živo (Realtime) za tabelo schedule_shifts
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_shifts;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

