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


-- ==========================================================================
-- Migracija: fix_open_shift_concurrency.sql
-- Atomska funkcija za prijavo na odprto izmeno brez možnosti prekoračitve mest
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.sign_up_for_open_shift(
  p_open_shift_id UUID,
  p_user_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_open_shift RECORD;
  v_current_signups INT;
  v_signup_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED', 'message', 'Uporabnik ni prijavljen.');
  END IF;

  -- Zakleni vrstico odprte izmene (FOR UPDATE), da preprečiš hkratno prekomerno prijavo več uporabnikov
  SELECT * INTO v_open_shift
  FROM public.open_shifts
  WHERE id = p_open_shift_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Izmena ne obstaja.');
  END IF;

  -- Preveri, ali je uporabnik že prijavljen
  IF EXISTS (
    SELECT 1 FROM public.open_shift_signups
    WHERE open_shift_id = p_open_shift_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_SIGNED_UP', 'message', 'Na to izmeno ste že prijavljeni.');
  END IF;

  -- Preveri število obstoječih prijav
  SELECT COUNT(*) INTO v_current_signups
  FROM public.open_shift_signups
  WHERE open_shift_id = p_open_shift_id;

  -- Če je izmena že polna, zavrni prijavo
  IF v_current_signups >= v_open_shift.required_spots THEN
    RETURN jsonb_build_object('success', false, 'error', 'SHIFT_FULL', 'message', 'Ta izmena je že polna in ne sprejema več prijav.');
  END IF;

  -- Vstavi prijavo v open_shift_signups
  INSERT INTO public.open_shift_signups (open_shift_id, user_id, user_name)
  VALUES (p_open_shift_id, v_user_id, COALESCE(p_user_name, 'Zaposleni'))
  RETURNING id INTO v_signup_id;

  -- Vstavi osebno izmeno v schedule_shifts
  INSERT INTO public.schedule_shifts (
    open_shift_id,
    employer_id,
    workplace_id,
    user_id,
    date,
    start_time,
    end_time,
    hours,
    note
  )
  VALUES (
    p_open_shift_id,
    v_open_shift.employer_id,
    v_open_shift.workplace_id,
    v_user_id,
    v_open_shift.date,
    v_open_shift.start_time,
    v_open_shift.end_time,
    v_open_shift.hours,
    CASE 
      WHEN v_open_shift.note IS NOT NULL AND v_open_shift.note != '' 
      THEN '[Odprta izmena] ' || v_open_shift.note 
      ELSE 'Odprta izmena' 
    END
  );

  RETURN jsonb_build_object('success', true, 'signup_id', v_signup_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sign_up_for_open_shift(UUID, TEXT) TO authenticated;
