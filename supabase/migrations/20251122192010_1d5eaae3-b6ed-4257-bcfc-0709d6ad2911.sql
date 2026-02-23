-- Create storage bucket for coach profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('coach-photos', 'coach-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for coach photos
CREATE POLICY "Anyone can view coach photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'coach-photos');

CREATE POLICY "Coaches can upload their own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'coach-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Coaches can update their own photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'coach-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Coaches can delete their own photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'coach-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );