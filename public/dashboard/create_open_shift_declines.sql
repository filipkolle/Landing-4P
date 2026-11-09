-- ==========================================================================
-- Migracija: create_open_shift_declines.sql
-- Podpora za beleženje zaposlenih, ki ne morejo prevzeti odprte izmene ("Ne morem")
-- ==========================================================================

-- 1. Ustvari tabelo open_shift_declines
CREATE TABLE IF NOT EXISTS public.open_shift_declines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  open_shift_id UUID NOT NULL REFERENCES public.open_shifts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(open_shift_id, user_id)
);

-- 2. Indeksi za hitrost poizvedb
CREATE INDEX IF NOT EXISTS idx_open_shift_declines_shift ON public.open_shift_declines(open_shift_id);
CREATE INDEX IF NOT EXISTS idx_open_shift_declines_user ON public.open_shift_declines(user_id);

-- 3. Row Level Security (RLS)
ALTER TABLE public.open_shift_declines ENABLE ROW LEVEL SECURITY;

-- Politika: Delodajalec lahko vidi vse odklone za svoje odprte izmene
DROP POLICY IF EXISTS "Employer view declines" ON public.open_shift_declines;
CREATE POLICY "Employer view declines"
  ON public.open_shift_declines
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.open_shifts os
      WHERE os.id = open_shift_declines.open_shift_id
      AND os.employer_id = auth.uid()
    )
  );

-- Politika: Zaposleni lahko vidi svoje odklone
DROP POLICY IF EXISTS "Employees view own declines" ON public.open_shift_declines;
CREATE POLICY "Employees view own declines"
  ON public.open_shift_declines
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Politika: Zaposleni lahko zabeleži odklon ("Ne morem")
DROP POLICY IF EXISTS "Employees can decline open shift" ON public.open_shift_declines;
CREATE POLICY "Employees can decline open shift"
  ON public.open_shift_declines
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Politika: Zaposleni lahko izbriše svoj odklon (npr. če se kasneje odloči prijaviti)
DROP POLICY IF EXISTS "Employees can cancel decline" ON public.open_shift_declines;
CREATE POLICY "Employees can cancel decline"
  ON public.open_shift_declines
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- 4. Dodaj v Realtime publikacijo
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.open_shift_declines;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
