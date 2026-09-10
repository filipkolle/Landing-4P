-- ==========================================================================
-- Migracija: shift_presets (Hitre izbire / prednastavitve delovnih izmen)
-- Omogoča delodajalcem prilagoditev hitrih gumbov za vnos izmen na urniku
-- ==========================================================================

-- 1. Ustvarjanje tabele shift_presets
CREATE TABLE IF NOT EXISTS public.shift_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TEXT NOT NULL,       -- npr. '08:00'
  end_time TEXT NOT NULL,         -- npr. '16:00'
  label TEXT,                     -- npr. 'Dopoldanska' ali prazno
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indeks za hitro filtriranje po delodajalcu
CREATE INDEX IF NOT EXISTS idx_shift_presets_employer 
  ON public.shift_presets(employer_id);

-- 3. Row Level Security (RLS)
ALTER TABLE public.shift_presets ENABLE ROW LEVEL SECURITY;

-- 4. Varnostne politike za delodajalca
DROP POLICY IF EXISTS "Employer full access to own shift presets" ON public.shift_presets;
CREATE POLICY "Employer full access to own shift presets"
  ON public.shift_presets
  FOR ALL
  TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- 5. Dodaj tabelo v Supabase Realtime publikacijo
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_presets;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
