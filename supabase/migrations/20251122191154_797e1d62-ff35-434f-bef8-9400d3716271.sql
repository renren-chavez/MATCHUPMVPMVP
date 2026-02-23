-- First, drop the payments policy that depends on athlete_id
DROP POLICY IF EXISTS "Users can view payments for their bookings" ON public.payments;

-- Drop athlete_profiles table (no longer needed)
DROP TABLE IF EXISTS public.athlete_profiles CASCADE;

-- Update bookings table to store athlete info directly instead of foreign key
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_athlete_id_fkey;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS athlete_id CASCADE;

-- Add athlete information columns directly to bookings
ALTER TABLE public.bookings 
  ADD COLUMN athlete_name TEXT NOT NULL DEFAULT 'Unknown',
  ADD COLUMN athlete_email TEXT,
  ADD COLUMN athlete_phone TEXT NOT NULL DEFAULT '',
  ADD COLUMN athlete_notes TEXT;

-- Remove old athlete-related RLS policies
DROP POLICY IF EXISTS "Athletes can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Athletes can update their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Athletes can view their bookings" ON public.bookings;

-- Add new public booking creation policy (anyone can create bookings)
CREATE POLICY "Anyone can create bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (true);

-- Add policy for public to view bookings (needed for public booking confirmation)
CREATE POLICY "Public users can view bookings"
  ON public.bookings
  FOR SELECT
  USING (true);

-- Update payments policy to only allow coaches to view
CREATE POLICY "Coaches can view payments for their bookings"
  ON public.payments
  FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM bookings
    WHERE bookings.id = payments.booking_id 
    AND bookings.coach_id = auth.uid()
  ));

-- Update profiles table - only coaches will have profiles
COMMENT ON TABLE public.profiles IS 'User profiles for coaches/service providers only. Clients do not have accounts.';
COMMENT ON COLUMN public.profiles.user_type IS 'Should always be coach - athlete accounts are deprecated';

-- Add a unique booking reference for athletes to track their bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_reference TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger to auto-generate booking reference
CREATE OR REPLACE FUNCTION set_booking_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.booking_reference IS NULL THEN
    NEW.booking_reference := generate_booking_reference();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_booking_reference_trigger ON public.bookings;
CREATE TRIGGER set_booking_reference_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_reference();