-- ==========================================================================
-- Migracija: fix_workplace_disconnection.sql
-- Omogoča varno prekinitev povezave in brisanje podatkov (Odpusti zaposlenega / Izbris kode)
-- ==========================================================================

-- 1. RLS politike za brisanje in posodabljanje v tabeli workplace_requests
ALTER TABLE public.workplace_requests ENABLE ROW LEVEL SECURITY;

-- Zaposleni lahko izbriše svojo lastno zahtevo (ko odstrani kodo ali vir)
DROP POLICY IF EXISTS "Users can delete their own workplace requests" ON public.workplace_requests;
CREATE POLICY "Users can delete their own workplace requests"
    ON public.workplace_requests FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Zaposleni lahko posodobi svojo lastno zahtevo
DROP POLICY IF EXISTS "Users can update their own workplace requests" ON public.workplace_requests;
CREATE POLICY "Users can update their own workplace requests"
    ON public.workplace_requests FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Delodajalec lahko vidi zahteve za svoja delovna mesta
DROP POLICY IF EXISTS "Employers can view requests for their workplaces" ON public.workplace_requests;
CREATE POLICY "Employers can view requests for their workplaces"
    ON public.workplace_requests FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.workplaces w 
            WHERE w.id = workplace_requests.workplace_id 
            AND w.created_by = auth.uid()
        )
    );

-- Delodajalec lahko posodobi zahteve za svoja delovna mesta (npr. odobri, zavrne)
DROP POLICY IF EXISTS "Employers can update requests for their workplaces" ON public.workplace_requests;
CREATE POLICY "Employers can update requests for their workplaces"
    ON public.workplace_requests FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.workplaces w 
            WHERE w.id = workplace_requests.workplace_id 
            AND w.created_by = auth.uid()
        )
    );

-- Delodajalec lahko izbriše zahteve za svoja delovna mesta (Odpusti zaposlenega)
DROP POLICY IF EXISTS "Employers can delete requests for their workplaces" ON public.workplace_requests;
CREATE POLICY "Employers can delete requests for their workplaces"
    ON public.workplace_requests FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.workplaces w 
            WHERE w.id = workplace_requests.workplace_id 
            AND w.created_by = auth.uid()
        )
    );

-- 2. Dovoljenje za zaposlenega za brisanje dodeljenih izmen (če prekine povezavo)
DROP POLICY IF EXISTS "Employee can delete assigned shifts" ON public.schedule_shifts;
CREATE POLICY "Employee can delete assigned shifts"
    ON public.schedule_shifts
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
