
-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public users can view bookings" ON public.bookings;
