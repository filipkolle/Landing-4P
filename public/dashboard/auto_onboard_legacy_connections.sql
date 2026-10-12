-- ============================================================================
-- Migracija: auto_onboard_legacy_connections.sql
-- Samodejni onboarding vseh obstoječih delavcev in sektorjev na nov sistem povezav.
-- Zaženite v Supabase SQL Editorju.
-- ============================================================================

-- 1. Prepričaj se, da imajo vsi registrirani uporabniki svojo 5-mestno kodo
INSERT INTO public.user_connect_codes (user_id, connect_code)
SELECT u.id, public.generate_connect_code()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_connect_codes c WHERE c.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- Sinhroniziraj kodo tudi v auth.users.raw_user_meta_data za hitro iskanje po kodi
UPDATE auth.users u
SET raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('app_user_code', uc.connect_code)
FROM public.user_connect_codes uc
WHERE uc.user_id = u.id
  AND (u.raw_user_meta_data->>'app_user_code' IS NULL OR u.raw_user_meta_data->>'app_user_code' != uc.connect_code);

-- 2. Prepričaj se, da imajo vsi delodajalci svojo 5-mestno kodo
UPDATE public.employer_profiles
SET connect_code = public.generate_connect_code()
WHERE connect_code IS NULL;

-- 3. Ustvari ali posodobi povezave v employer_connections ter sinhroniziraj zahteve in vire dohodka
DO $$
DECLARE
    r RECORD;
    v_conn_id UUID;
    v_user_name TEXT;
    v_company_name TEXT;
BEGIN
    FOR r IN (
        SELECT DISTINCT
            w.employer_id,
            wr.user_id
        FROM public.workplace_requests wr
        JOIN public.workplaces w ON w.id = wr.workplace_id
        WHERE wr.user_id IS NOT NULL 
          AND w.employer_id IS NOT NULL
          AND wr.status = 'approved'
    ) LOOP
        -- Določi ime uporabnika in podjetja
        v_user_name := public.resolve_user_display_name(r.user_id);
        SELECT COALESCE(company_name, 'Delodajalec') INTO v_company_name
        FROM public.employer_profiles WHERE id = r.employer_id;

        -- Preveri obstoječo povezavo
        SELECT id INTO v_conn_id
        FROM public.employer_connections
        WHERE employer_id = r.employer_id AND user_id = r.user_id;

        IF v_conn_id IS NULL THEN
            INSERT INTO public.employer_connections (
                employer_id,
                user_id,
                status,
                initiated_by,
                company_name,
                user_name,
                consent_at,
                responded_at,
                created_at,
                updated_at
            )
            VALUES (
                r.employer_id,
                r.user_id,
                'approved',
                'migration',
                v_company_name,
                v_user_name,
                NOW(),
                NOW(),
                NOW(),
                NOW()
            )
            RETURNING id INTO v_conn_id;
        ELSE
            UPDATE public.employer_connections
            SET status = 'approved',
                company_name = v_company_name,
                user_name = COALESCE(NULLIF(user_name, ''), v_user_name),
                updated_at = NOW()
            WHERE id = v_conn_id;
        END IF;

        -- Poveži connection_id na vse ustrezne zahteve v workplace_requests
        UPDATE public.workplace_requests wr
        SET connection_id = v_conn_id,
            status = 'approved',
            is_active = true,
            user_name = COALESCE(NULLIF(wr.user_name, ''), v_user_name),
            updated_at = NOW()
        FROM public.workplaces w
        WHERE wr.workplace_id = w.id
          AND w.employer_id = r.employer_id
          AND wr.user_id = r.user_id
          AND wr.status = 'approved';

        -- Sinhroniziraj vire dohodka v aplikaciji (income_sources)
        -- SAMO in IZKLJUČNO tiste vire, ki imajo potrjeno aktivno delovno mesto pri tem delodajalcu
        UPDATE public.income_sources s
        SET connection_id = v_conn_id,
            employer_name = v_company_name,
            company_name = v_company_name,
            workplace_status = 'approved',
            is_active = true
        FROM public.workplaces w, public.workplace_requests wr
        WHERE s.workplace_id = w.id
          AND w.employer_id = r.employer_id
          AND s.user_id = r.user_id
          AND wr.workplace_id = w.id
          AND wr.user_id = r.user_id
          AND wr.status = 'approved'
          AND wr.is_active = true;
    END LOOP;
END $$;

-- 4. Poročilo o vseh povezanih zaposlenih in delodajalcih
SELECT 
    c.user_name AS "Zaposleni",
    COALESCE(uc.connect_code, 'N/A') AS "Koda zaposlenega",
    u.email AS "Email zaposlenega",
    c.company_name AS "Delodajalec",
    ep.connect_code AS "Koda delodajalca",
    ep.email AS "Email delodajalca",
    c.status AS "Status povezave",
    STRING_AGG(DISTINCT COALESCE(w.name, w.sector_name), ', ') AS "Dodeljeni sektorji"
FROM public.employer_connections c
JOIN auth.users u ON u.id = c.user_id
LEFT JOIN public.user_connect_codes uc ON uc.user_id = c.user_id
JOIN public.employer_profiles ep ON ep.id = c.employer_id
LEFT JOIN public.workplaces w ON w.employer_id = c.employer_id
LEFT JOIN public.workplace_requests wr ON wr.workplace_id = w.id AND wr.user_id = c.user_id
WHERE c.status = 'approved' AND (wr.status = 'approved' OR wr.status IS NULL)
GROUP BY c.user_name, uc.connect_code, u.email, c.company_name, ep.connect_code, ep.email, c.status
ORDER BY c.company_name, c.user_name;
