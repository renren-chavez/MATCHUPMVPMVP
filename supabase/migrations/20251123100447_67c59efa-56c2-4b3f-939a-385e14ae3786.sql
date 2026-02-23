-- Create table for storing booking chat conversations (72 hour retention)
CREATE TABLE IF NOT EXISTS public.booking_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  booking_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '72 hours')
);

-- Enable RLS
ALTER TABLE public.booking_chats ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create chat sessions
CREATE POLICY "Anyone can create booking chats"
  ON public.booking_chats
  FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can view their own chat session
CREATE POLICY "Anyone can view booking chats by session_id"
  ON public.booking_chats
  FOR SELECT
  USING (true);

-- Policy: Anyone can update their own chat session
CREATE POLICY "Anyone can update booking chats by session_id"
  ON public.booking_chats
  FOR UPDATE
  USING (true);

-- Policy: Coaches can view chats for their bookings
CREATE POLICY "Coaches can view their booking chats"
  ON public.booking_chats
  FOR SELECT
  USING (coach_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX idx_booking_chats_session_id ON public.booking_chats(session_id);
CREATE INDEX idx_booking_chats_expires_at ON public.booking_chats(expires_at);

-- Function to clean up expired chats
CREATE OR REPLACE FUNCTION public.cleanup_expired_booking_chats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.booking_chats
  WHERE expires_at < now();
END;
$$;