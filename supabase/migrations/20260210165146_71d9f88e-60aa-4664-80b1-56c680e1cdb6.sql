
-- Create a private bucket for payment receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload receipts (public booking flow, no auth)
CREATE POLICY "Anyone can upload payment receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-receipts');

-- Only authenticated coaches can view receipts for their bookings
CREATE POLICY "Coaches can view their payment receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-receipts' AND
  auth.uid() IS NOT NULL
);
