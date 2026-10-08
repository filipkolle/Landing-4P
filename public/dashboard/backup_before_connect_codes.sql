-- ==========================================================================
-- VARNOSTNA KOPIJA pred uvedbo osebnih kod (connect codes)
-- Zaženi v Supabase SQL Editorju PRED connect_codes_migration.sql
-- Skripta je idempotentna: ob ponovnem zagonu NE prepiše obstoječe kopije.
-- ==========================================================================

CREATE SCHEMA IF NOT EXISTS backup_2026_10;

-- Shema backup ni dostopna prek API-ja (anon/authenticated)
REVOKE ALL ON SCHEMA backup_2026_10 FROM PUBLIC;
REVOKE ALL ON SCHEMA backup_2026_10 FROM anon, authenticated;

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'workplaces',
    'workplace_requests',
    'income_sources',
    'work_logs',
    'schedule_shifts',
    'open_shifts',
    'open_shift_signups',
    'employer_tasks',
    'employer_manual_employees',
    'employee_absences',
    'shift_presets',
    'calendar_feeds',
    'user_profiles'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t)
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_2026_10' AND table_name = t) THEN
      EXECUTE format('CREATE TABLE backup_2026_10.%I AS TABLE public.%I', t, t);
      RAISE NOTICE 'Kopija ustvarjena: %', t;
    ELSE
      RAISE NOTICE 'Preskočeno (ne obstaja ali kopija že obstaja): %', t;
    END IF;
  END LOOP;
END $$;

-- Kopija RLS politik (za referenco pri obnovi)
CREATE TABLE IF NOT EXISTS backup_2026_10.policies_snapshot AS
  SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
  FROM pg_policies
  WHERE schemaname = 'public';

-- Preverjanje: število vrstic original vs. kopija
SELECT 'workplaces' AS tabela, (SELECT count(*) FROM public.workplaces) AS original, (SELECT count(*) FROM backup_2026_10.workplaces) AS kopija
UNION ALL SELECT 'workplace_requests', (SELECT count(*) FROM public.workplace_requests), (SELECT count(*) FROM backup_2026_10.workplace_requests)
UNION ALL SELECT 'income_sources', (SELECT count(*) FROM public.income_sources), (SELECT count(*) FROM backup_2026_10.income_sources)
UNION ALL SELECT 'work_logs', (SELECT count(*) FROM public.work_logs), (SELECT count(*) FROM backup_2026_10.work_logs);

-- ==========================================================================
-- OBNOVA (samo v sili – odkomentiraj posamezno tabelo)
-- ==========================================================================
-- BEGIN;
--   TRUNCATE public.workplace_requests;
--   INSERT INTO public.workplace_requests SELECT * FROM backup_2026_10.workplace_requests;
-- COMMIT;
-- Opomba: če je migracija dodala nove stolpce, uporabi INSERT z naštetimi stolpci.
