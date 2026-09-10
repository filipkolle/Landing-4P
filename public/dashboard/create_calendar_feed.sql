-- ============================================================================
-- Finance 4P - Tabela in funkcija za koledarsko naročnino (Google & Apple Koledar)
-- ============================================================================

-- 1. Ustvari tabelo calendar_feeds za shranjevanje iCal podatkov urnika
CREATE TABLE IF NOT EXISTS public.calendar_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  calendar_name TEXT DEFAULT 'Urnik 4P',
  calendar_data TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_calendar_feeds_employer UNIQUE (employer_id)
);

-- Indeks za hitro iskanje po varnostnem žetonu
CREATE INDEX IF NOT EXISTS idx_calendar_feeds_token ON public.calendar_feeds(token);

-- 2. Vklopi varnost na ravni vrstic (RLS)
ALTER TABLE public.calendar_feeds ENABLE ROW LEVEL SECURITY;

-- Delodajalec ima poln dostop do svojega vira
DROP POLICY IF EXISTS "Employer can manage own calendar feed" ON public.calendar_feeds;
CREATE POLICY "Employer can manage own calendar feed"
  ON public.calendar_feeds
  FOR ALL
  USING (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);

-- Anonimno branje preko varnostnega žetona (za Google/Apple koledar)
DROP POLICY IF EXISTS "Public can read feed with valid token" ON public.calendar_feeds;
CREATE POLICY "Public can read feed with valid token"
  ON public.calendar_feeds
  FOR SELECT
  TO anon, authenticated
  USING (token IS NOT NULL AND length(token) >= 16);

-- 3. Varnostna RPC funkcija za branje koledarja po žetonu
CREATE OR REPLACE FUNCTION public.get_calendar_feed(feed_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_data TEXT;
BEGIN
  SELECT calendar_data INTO v_data
  FROM public.calendar_feeds
  WHERE token = feed_token;

  RETURN COALESCE(v_data, '');
END;
$$;

-- Podelitev pravic za izvajanje RPC funkcije
GRANT EXECUTE ON FUNCTION public.get_calendar_feed(TEXT) TO anon, authenticated;
