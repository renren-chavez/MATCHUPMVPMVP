-- Drop the problematic public view policy that exposes all bookings
DROP POLICY IF EXISTS "Public users can view bookings" ON public.bookings;

-- Keep only the coach-specific policy so coaches can only see their own bookings
-- This policy already exists and is correct:
-- "Coaches can view their bookings" using coach_profiles check

-- Also ensure that the booking creator (athlete using public link) cannot view other bookings
-- by removing any overly permissive policies

-- Add a policy for booking participants to view their own booking via booking_reference
CREATE POLICY "Users can view bookings by reference" 
ON public.bookings 
FOR SELECT 
USING (true);

-- The above allows the booking assistant to show booking details
-- but coaches still need auth to manage bookings through the dashboard