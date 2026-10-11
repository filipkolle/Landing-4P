-- ============================================================================
-- Migracija: add_termination_tracking.sql
-- Sledenje odpovedi delavca ('resigned') in odpusta delodajalca ('dismissed')
-- Zaženite ta SQL v Supabase SQL Editorju.
-- ============================================================================

-- 1. Posodobitev funkcije disconnect_from_employer
-- Ko delavec samostojno poda odpoved, nastavi status v workplace_requests na 'resigned'
CREATE OR REPLACE FUNCTION public.disconnect_from_employer(p_connection_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;

  -- Posodobi povezavo v employer_connections
  UPDATE public.employer_connections
    SET status = 'disconnected', updated_at = now()
    WHERE id = p_connection_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Povezava ne obstaja.'; END IF;

  -- Posodobi zahteve v workplace_requests na 'resigned' (delavec podal odpoved)
  UPDATE public.workplace_requests
    SET status = 'resigned', is_active = false, disconnected_at = now(), updated_at = now()
    WHERE connection_id = p_connection_id AND user_id = auth.uid();

  RETURN 'disconnected';
END $$;

GRANT EXECUTE ON FUNCTION public.disconnect_from_employer(UUID) TO authenticated;
