-- ==========================================================================
-- Migracija: restrict_schedule_shift_deletion.sql
-- Preprečuje brisanje izmen, ki jih je zaposlenemu dodelil delodajalec
-- (vključno z odprtimi izmenami).
-- Zaposleni lahko v aplikaciji briše zgolj izmene, ki si jih je sam osebno vnesel/načrtoval.
-- ==========================================================================

-- 1. Dodajanje stolpca is_self_planned v tabelo schedule_shifts, če še ne obstaja
ALTER TABLE public.schedule_shifts 
ADD COLUMN IF NOT EXISTS is_self_planned BOOLEAN DEFAULT false;

-- 2. Odprte izmene veljajo za izmene delodajalca
UPDATE public.schedule_shifts 
SET is_self_planned = false 
WHERE open_shift_id IS NOT NULL;

-- 3. Posodobitev RLS politik za brisanje (DELETE) v tabeli schedule_shifts
DROP POLICY IF EXISTS "Employee can delete assigned shifts" ON public.schedule_shifts;
DROP POLICY IF EXISTS "Users can delete own schedule shifts" ON public.schedule_shifts;
DROP POLICY IF EXISTS "Employee can only delete self planned shifts" ON public.schedule_shifts;

-- Nova varnostna politika: Zaposleni lahko briše SAMO svoje osebno načrtovane izmene
CREATE POLICY "Employee can only delete self planned shifts"
    ON public.schedule_shifts
    FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid() 
        AND (is_self_planned = true OR is_self_planned IS NULL)
        AND open_shift_id IS NULL
    );
