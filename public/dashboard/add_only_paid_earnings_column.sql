-- ==========================================================================
-- Migracija: add_only_paid_earnings_column.sql
-- Dodajanje polja only_paid_earnings_in_cash v tabelo user_profiles
-- ==========================================================================

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS only_paid_earnings_in_cash BOOLEAN DEFAULT true;

-- Dodaj komentar k stolpcu
COMMENT ON COLUMN public.user_profiles.only_paid_earnings_in_cash IS 'Določa, ali se v gotovino na voljo prištejejo le izplačani vnosi delovnih ur (privzeto true).';
