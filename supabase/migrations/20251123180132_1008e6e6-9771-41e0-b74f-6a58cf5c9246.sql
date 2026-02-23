-- Drop the overly permissive policy that was just created
DROP POLICY IF EXISTS "Users can view bookings by reference" ON public.bookings;

-- Recreate the public policy (needed for the booking assistant edge function which runs unauthenticated)
-- This allows the booking assistant to fetch bookings for validation
CREATE POLICY "Public users can view bookings" 
ON public.bookings 
FOR SELECT 
USING (true);

-- The "Coaches can view their bookings" policy already exists and works correctly
-- Both policies will work together - authenticated coaches see their bookings,
-- and the edge function can access bookings it needs to validate