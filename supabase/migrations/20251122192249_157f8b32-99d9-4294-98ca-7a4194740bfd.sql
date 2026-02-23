-- Add venue_details column to coach_profiles to store exact court/venue info per location
ALTER TABLE public.coach_profiles 
  ADD COLUMN venue_details JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.coach_profiles.venue_details IS 'JSON object mapping location names to venue details (e.g., {"Makati": "XYZ Sports Complex, 123 Main St", "BGC Taguig": "ABC Court, Bonifacio High Street"})';