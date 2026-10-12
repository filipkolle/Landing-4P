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

-- 3. Poskrbi, da obstaja sektor 'Gusto catering' pod delodajalcem Peter Rakuljič
DO $$
DECLARE
    v_peter_id UUID;
BEGIN
    SELECT id INTO v_peter_id 
    FROM public.employer_profiles 
    WHERE LOWER(company_name) LIKE '%peter%rakulji%' OR email = 'pero17@gmail.com'
    LIMIT 1;

    IF v_peter_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.workplaces WHERE employer_id = v_peter_id AND LOWER(TRIM(name)) = 'gusto catering') THEN
            INSERT INTO public.workplaces (employer_id, name, sector_name, sector_color, join_code)
            VALUES (v_peter_id, 'Gusto catering', 'Gusto catering', '#10b981', 'GC1400');
        END IF;
    END IF;
END $$;

-- 4. Posodobi RPC funkcijo za dodeljene sektorje (da nikoli ne meša sektorjev različnih delodajalcev)
CREATE OR REPLACE FUNCTION public.get_assigned_workplaces_for_user(p_connection_id UUID DEFAULT NULL)
RETURNS TABLE (
  workplace_id UUID,
  sector_name TEXT,
  sector_color TEXT,
  sector_notes TEXT,
  connection_id UUID,
  status TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_employer_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niste prijavljeni.'; END IF;

  IF p_connection_id IS NOT NULL THEN
    SELECT employer_id INTO v_employer_id
    FROM public.employer_connections
    WHERE id = p_connection_id;
  END IF;

  RETURN QUERY
  SELECT
    w.id AS workplace_id,
    COALESCE(w.sector_name, w.name, 'Glavni sektor') AS sector_name,
    COALESCE(w.sector_color, '#56829d') AS sector_color,
    w.sector_notes,
    wr.connection_id,
    wr.status
  FROM public.workplace_requests wr
  JOIN public.workplaces w ON w.id = wr.workplace_id
  WHERE wr.user_id = auth.uid()
    AND wr.status IN ('invited', 'approved')
    AND COALESCE(wr.is_active, true) = true
    AND (
      (p_connection_id IS NOT NULL AND (wr.connection_id = p_connection_id OR (v_employer_id IS NOT NULL AND w.employer_id = v_employer_id)))
      OR
      (p_connection_id IS NULL)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.get_assigned_workplaces_for_user(UUID) TO authenticated;

-- 5. Nastavi povezavo in točno določene sektorje za Filip Kolle in Peter Rakuljič
DO $$
DECLARE
    v_filip_id UUID;
    v_peter_id UUID;
    v_conn_id UUID;
    v_wp_record RECORD;
BEGIN
    SELECT id INTO v_filip_id FROM auth.users WHERE email = 'filipkolleinc@gmail.com' LIMIT 1;
    SELECT id INTO v_peter_id FROM public.employer_profiles WHERE email = 'pero17@gmail.com' OR LOWER(company_name) LIKE '%peter%rakulji%' LIMIT 1;

    IF v_filip_id IS NOT NULL AND v_peter_id IS NOT NULL THEN
        -- Preveri obstoječo povezavo
        SELECT id INTO v_conn_id
        FROM public.employer_connections
        WHERE employer_id = v_peter_id AND user_id = v_filip_id;

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
                v_peter_id,
                v_filip_id,
                'approved',
                'migration',
                'Peter Rakuljič',
                'Filip Kolle',
                NOW(),
                NOW(),
                NOW(),
                NOW()
            )
            RETURNING id INTO v_conn_id;
        ELSE
            UPDATE public.employer_connections
            SET status = 'approved',
                company_name = 'Peter Rakuljič',
                user_name = 'Filip Kolle',
                updated_at = NOW()
            WHERE id = v_conn_id;
        END IF;

        -- Poveži točno 5 dodeljenih sektorjev Petra Rakuljiča v workplace_requests:
        -- Grad Mokrice, Gusto catering, Postojna, Divino, Repnik
        FOR v_wp_record IN (
            SELECT id, name
            FROM public.workplaces
            WHERE employer_id = v_peter_id
              AND (
                LOWER(TRIM(name)) IN ('grad mokrice', 'gusto catering', 'postojna', 'divino', 'repnik')
                OR LOWER(TRIM(COALESCE(sector_name, ''))) IN ('grad mokrice', 'gusto catering', 'postojna', 'divino', 'repnik')
              )
        ) LOOP
            -- Vstavi ali posodobi v workplace_requests
            IF EXISTS (SELECT 1 FROM public.workplace_requests WHERE user_id = v_filip_id AND workplace_id = v_wp_record.id) THEN
                UPDATE public.workplace_requests
                SET connection_id = v_conn_id,
                    status = 'approved',
                    is_active = true,
                    updated_at = NOW()
                WHERE user_id = v_filip_id AND workplace_id = v_wp_record.id;
            ELSE
                INSERT INTO public.workplace_requests (
                    workplace_id,
                    user_id,
                    user_name,
                    status,
                    is_active,
                    connection_id,
                    created_at,
                    updated_at
                ) VALUES (
                    v_wp_record.id,
                    v_filip_id,
                    'Filip Kolle',
                    'approved',
                    true,
                    v_conn_id,
                    NOW(),
                    NOW()
                );
            END IF;

            -- Sinhroniziraj ustrezen vir dohodka v income_sources
            UPDATE public.income_sources
            SET connection_id = v_conn_id,
                employer_name = 'Peter Rakuljič',
                company_name = 'Peter Rakuljič',
                workplace_id = v_wp_record.id,
                workplace_status = 'approved',
                is_active = true
            WHERE user_id = v_filip_id
              AND (
                (LOWER(TRIM(v_wp_record.name)) = 'grad mokrice' AND LOWER(TRIM(name)) = 'grad mokrice')
                OR (LOWER(TRIM(v_wp_record.name)) = 'gusto catering' AND LOWER(TRIM(name)) = 'gusto catering')
                OR (LOWER(TRIM(v_wp_record.name)) = 'postojna' AND (LOWER(TRIM(name)) = 'postojnska jama' OR LOWER(TRIM(name)) = 'postojna'))
                OR (LOWER(TRIM(v_wp_record.name)) = 'divino' AND LOWER(TRIM(name)) = 'divino')
                OR (LOWER(TRIM(v_wp_record.name)) = 'repnik' AND LOWER(TRIM(name)) = 'repnik')
              );
        END LOOP;

        -- Prepričaj se, da vsi ostali osebni viri Filipa Kolleta ostanejo BREZ delodajalca
        UPDATE public.income_sources
        SET connection_id = NULL,
            employer_name = NULL,
            company_name = NULL,
            workplace_id = NULL,
            workplace_status = NULL
        WHERE user_id = v_filip_id
          AND LOWER(TRIM(name)) NOT IN ('grad mokrice', 'gusto catering', 'postojnska jama', 'divino', 'repnik', 'o sole mio');

    END IF;
END $$;

-- 6. Splošni onboarding za vse ostale uporabnike in delodajalce z obstoječimi potrjenimi zahtevami
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
          AND wr.is_active = true
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
          AND wr.status = 'approved'
          AND wr.is_active = true;

        -- Sinhroniziraj vire dohodka v aplikaciji (income_sources)
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

-- 7. Poročilo o vseh povezanih zaposlenih in delodajalcih
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
JOIN public.workplace_requests wr ON wr.connection_id = c.id AND wr.status = 'approved' AND wr.is_active = true
JOIN public.workplaces w ON w.id = wr.workplace_id
WHERE c.status = 'approved'
GROUP BY c.user_name, uc.connect_code, u.email, c.company_name, ep.connect_code, ep.email, c.status
ORDER BY c.company_name, c.user_name;
