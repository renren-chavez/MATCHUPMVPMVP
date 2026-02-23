
-- Add coaching_hours column to coach_profiles
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS coaching_hours jsonb DEFAULT NULL;

-- Create coach_recurring_blockings table
CREATE TABLE IF NOT EXISTS public.coach_recurring_blockings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.coach_recurring_blockings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their recurring blockings"
  ON public.coach_recurring_blockings FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Public can view recurring blockings"
  ON public.coach_recurring_blockings FOR SELECT
  USING (true);

CREATE POLICY "Coaches can insert their recurring blockings"
  ON public.coach_recurring_blockings FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their recurring blockings"
  ON public.coach_recurring_blockings FOR DELETE
  USING (coach_id = auth.uid());
