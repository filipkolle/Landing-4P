-- ==========================================================================
-- Migracija: add_finance_assistant_access.sql
-- Dodajanje polja has_finance_assistant_access v tabelo user_profiles
-- Omogoča, da imajo Finančnega asistenta le pooblaščeni obstoječi uporabniki.
-- ==========================================================================

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS has_finance_assistant_access BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.user_profiles.has_finance_assistant_access IS 'Določa, ali ima uporabnik dostop do Finančnega asistenta (privzeto false za vse nove uporabnike).';

-- Nastavi pravico za vse uporabnike, ki so se registrirali s potjo B (Finančni asistent)
UPDATE public.user_profiles 
SET has_finance_assistant_access = true 
WHERE onboarding_path = 'B';

-- Nastavi pravico za administratorske / testne račune
UPDATE public.user_profiles 
SET has_finance_assistant_access = true 
WHERE id IN (
  'ad56011c-2176-4ece-81d6-66331f884e4f', -- Lana Erjavec
  'da298052-039c-4ea1-a719-d551ad0de9f1', -- Eva Zupin Muzik
  'ad13415c-4295-4927-9eef-8064870dec23', -- Barbara Rezar
  'bd1742d4-e7c9-402a-b8b4-2038b9cb5efc', -- Dino Jurinic
  'b3abee73-05f4-4fff-b0b2-a8293ca13fb0', -- Oskar Glavan
  'f18f38a5-f6ef-4a17-836b-b1ed0ffdc6d1', -- Martin Pusar
  'cf08d0f8-8f90-40b8-a805-d7ca3435d0bf', -- Jure Avbersek
  '69a6ecf8-29bf-4b24-98d1-7a6e73f4147d', -- Filip Balog
  '056feffa-712d-4c7c-ad3f-f59865b19b18', -- Tina Bolnar
  '157c4413-43ac-42a5-b84e-46e87e7401f3', -- Maja Kotar
  'd53ea579-ae07-433c-81de-57f1a3a22deb', -- Filip Kolle
  'e469c8c8-0678-49fd-917d-0f60b031d006', -- Filip Kolle
  '739df1e1-825e-4432-b8a9-af9657bf801e', -- Filip Kolle
  '45873dad-64a1-466a-a3cf-8e27806df57c', -- SHOWMEN
  '42855c2c-bc58-4abc-8798-1c7684172b10', -- info
  '3e1c4310-b659-4d9f-8e38-58452bae6db6', -- Bernard Kolle
  'dad64e65-a359-4652-b87c-fbfd6d3c8e61', -- Ružica Kolle
  'b86a72e6-0d2f-42f4-96fa-8f9cdfee7f30', -- Luka Kolle
  '87d47c58-4e3b-45e8-a61b-fdb8066613f8'  -- Marija kolle
);
