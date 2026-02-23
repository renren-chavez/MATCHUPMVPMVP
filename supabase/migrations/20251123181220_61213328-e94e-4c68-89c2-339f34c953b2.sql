-- Add cancellation fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelled_by text,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_status text DEFAULT 'none';

-- Add refund tracking to payments table
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS refund_notes text;

-- Create function to validate and format Philippine phone numbers
CREATE OR REPLACE FUNCTION format_philippine_phone(phone text)
RETURNS text AS $$
BEGIN
  -- Remove all spaces, dashes, and parentheses
  phone := REGEXP_REPLACE(phone, '[\s\-\(\)]', '', 'g');
  
  -- If starts with 0, replace with +63
  IF phone ~ '^0' THEN
    phone := '+63' || SUBSTRING(phone FROM 2);
  END IF;
  
  -- If doesn't start with +63, add it
  IF NOT (phone ~ '^\+63') THEN
    phone := '+63' || phone;
  END IF;
  
  RETURN phone;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to validate Philippine phone numbers
CREATE OR REPLACE FUNCTION validate_philippine_phone(phone text)
RETURNS boolean AS $$
BEGIN
  -- Phone must start with +63 and be 13 characters total (+63 + 10 digits)
  RETURN phone ~ '^\+63[0-9]{10}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing bookings to have proper Philippine phone format
UPDATE public.bookings
SET athlete_phone = format_philippine_phone(athlete_phone)
WHERE athlete_phone IS NOT NULL AND athlete_phone != '';

-- Update existing profiles to have proper Philippine phone format  
UPDATE public.profiles
SET phone = format_philippine_phone(phone)
WHERE phone IS NOT NULL AND phone != '';

-- Add check constraint for Philippine phone format on profiles
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS phone_format_check,
ADD CONSTRAINT phone_format_check 
CHECK (phone IS NULL OR validate_philippine_phone(phone));

-- Add check constraint for Philippine phone format on bookings
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS athlete_phone_format_check,
ADD CONSTRAINT athlete_phone_format_check 
CHECK (athlete_phone = '' OR validate_philippine_phone(athlete_phone));