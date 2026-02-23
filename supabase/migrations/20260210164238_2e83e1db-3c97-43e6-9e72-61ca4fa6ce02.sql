
-- Drop overly permissive public policies
DROP POLICY IF EXISTS "Anyone can create booking chats" ON public.booking_chats;
DROP POLICY IF EXISTS "Anyone can update booking chats by session_id" ON public.booking_chats;
DROP POLICY IF EXISTS "Anyone can view booking chats by session_id" ON public.booking_chats;

-- Keep existing "Coaches can view their booking chats" policy (coach_id = auth.uid())

-- Add policy for coaches to manage their own chats
CREATE POLICY "Coaches can insert their booking chats"
ON public.booking_chats
FOR INSERT
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their booking chats"
ON public.booking_chats
FOR UPDATE
USING (coach_id = auth.uid());
