
-- Create coach_blockings table
CREATE TABLE public.coach_blockings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  blocked_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_blockings ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own blockings
CREATE POLICY "Coaches can view their own blockings"
ON public.coach_blockings FOR SELECT
USING (coach_id = auth.uid());

CREATE POLICY "Public can view blockings"
ON public.coach_blockings FOR SELECT
USING (true);

CREATE POLICY "Coaches can insert their own blockings"
ON public.coach_blockings FOR INSERT
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own blockings"
ON public.coach_blockings FOR DELETE
USING (coach_id = auth.uid());

-- Index for performance
CREATE INDEX idx_coach_blockings_coach_date ON public.coach_blockings (coach_id, blocked_date);
