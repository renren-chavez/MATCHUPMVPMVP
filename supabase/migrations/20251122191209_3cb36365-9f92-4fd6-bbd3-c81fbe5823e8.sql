-- Fix search_path for security
ALTER FUNCTION generate_booking_reference() SET search_path = public;
ALTER FUNCTION set_booking_reference() SET search_path = public;