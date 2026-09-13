-- ==========================================================================
-- Migracija: add_shift_presets_days_of_week.sql
-- Dodajanje podpore za tedenske hitre izmene (celoten teden ali izbrani dnevi)
-- ==========================================================================

-- 1. Dodajanje stolpca days_of_week v tabelo shift_presets
ALTER TABLE public.shift_presets
ADD COLUMN IF NOT EXISTS days_of_week TEXT;

-- 2. Posodobitev obstoječih zapisov, če stolpec še nima vrednosti (privzeto null = posamezen dan)
COMMENT ON COLUMN public.shift_presets.days_of_week IS 'JSON polje dni v tednu npr. [1,2,3,4,5] za Pon-Pet ali NULL za en dan';
