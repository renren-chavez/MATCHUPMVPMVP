
-- Drop the overly permissive public SELECT policy on profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Only authenticated users can view profiles
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create a secure function for the public booking page to get coach display info
-- This avoids exposing phone numbers or other private profile data
CREATE OR REPLACE FUNCTION public.get_coach_public_info(coach_uuid uuid)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', cp.id,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'business_name', cp.business_name,
    'sports_offered', cp.sports_offered,
    'locations', cp.locations,
    'hourly_rate', cp.hourly_rate,
    'years_of_experience', cp.years_of_experience,
    'bio', cp.bio,
    'certifications', cp.certifications,
    'cancellation_policy', cp.cancellation_policy,
    'venue_details', cp.venue_details,
    'is_active', cp.is_active
  ) INTO result
  FROM public.coach_profiles cp
  JOIN public.profiles p ON p.id = cp.id
  WHERE cp.id = coach_uuid AND cp.is_active = true;
  
  RETURN result;
END;
$$;
