-- Remove deposit-related columns from coach_profiles table
ALTER TABLE public.coach_profiles 
DROP COLUMN IF EXISTS deposit_required,
DROP COLUMN IF EXISTS deposit_percentage;