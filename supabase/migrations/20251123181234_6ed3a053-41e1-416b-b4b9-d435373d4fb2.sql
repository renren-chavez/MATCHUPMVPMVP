-- Fix search_path for phone validation functions
-- Drop constraints first, then recreate functions, then recreate constraints

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS phone_format_check;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS athlete_phone_format_check;

DROP FUNCTION IF EXISTS format_philippine_phone(text);
CREATE OR REPLACE FUNCTION format_philippine_phone(phone text)
RETURNS text AS $$
BEGIN
  phone := REGEXP_REPLACE(phone, '[\s\-\(\)]', '', 'g');
  IF phone ~ '^0' THEN
    phone := '+63' || SUBSTRING(phone FROM 2);
  END IF;
  IF NOT (phone ~ '^\+63') THEN
    phone := '+63' || phone;
  END IF;
  RETURN phone;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

DROP FUNCTION IF EXISTS validate_philippine_phone(text);
CREATE OR REPLACE FUNCTION validate_philippine_phone(phone text)
RETURNS boolean AS $$
BEGIN
  RETURN phone ~ '^\+63[0-9]{10}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Recreate constraints
ALTER TABLE public.profiles
ADD CONSTRAINT phone_format_check 
CHECK (phone IS NULL OR validate_philippine_phone(phone));

ALTER TABLE public.bookings
ADD CONSTRAINT athlete_phone_format_check 
CHECK (athlete_phone = '' OR validate_philippine_phone(athlete_phone));