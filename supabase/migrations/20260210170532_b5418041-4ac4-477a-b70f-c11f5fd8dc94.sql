
-- Fix payment-receipts storage: restrict SELECT to coach who owns the booking
-- The upload path uses the booking ID as folder name
DROP POLICY IF EXISTS "Coaches can view their payment receipts" ON storage.objects;

CREATE POLICY "Coaches can view receipts for their bookings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-receipts' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.coach_id = auth.uid()
    AND name LIKE '%' || b.id::text || '%'
  )
);

-- Fix SECURITY DEFINER: revoke public execute on cleanup function
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_booking_chats() FROM public;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_booking_chats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_booking_chats() FROM authenticated;
