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
