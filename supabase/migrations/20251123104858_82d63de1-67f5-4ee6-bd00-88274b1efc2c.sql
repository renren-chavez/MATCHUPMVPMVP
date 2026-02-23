-- Add payment receipt and dispute fields to payments table
ALTER TABLE payments 
ADD COLUMN payment_receipt_url text,
ADD COLUMN dispute_initiated_at timestamp with time zone,
ADD COLUMN dispute_reason text;

-- Add payment method to bookings table for easier access
ALTER TABLE bookings
ADD COLUMN payment_method text CHECK (payment_method IN ('gcash', 'maya', 'cash'));