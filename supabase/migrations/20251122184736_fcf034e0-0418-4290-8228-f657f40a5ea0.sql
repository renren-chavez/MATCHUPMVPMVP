-- Create enum types
CREATE TYPE user_type AS ENUM ('coach', 'athlete');
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE payment_method AS ENUM ('gcash', 'maya', 'cash');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type user_type NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coach profiles table
CREATE TABLE public.coach_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT,
  bio TEXT,
  years_of_experience INTEGER,
  certifications TEXT[],
  sports_offered TEXT[] NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  locations TEXT[] NOT NULL,
  cancellation_policy TEXT,
  deposit_required BOOLEAN DEFAULT true,
  deposit_percentage INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Athlete profiles table
CREATE TABLE public.athlete_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  location TEXT NOT NULL,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  duration_hours DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  total_amount DECIMAL(10,2) NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  reference_number TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  is_deposit BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Coach profiles RLS Policies
CREATE POLICY "Coach profiles viewable by everyone"
  ON public.coach_profiles FOR SELECT
  USING (true);

CREATE POLICY "Coaches can update own profile"
  ON public.coach_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Coaches can insert own profile"
  ON public.coach_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Athlete profiles RLS Policies
CREATE POLICY "Athletes can view own profile"
  ON public.athlete_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Athletes can update own profile"
  ON public.athlete_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Athletes can insert own profile"
  ON public.athlete_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Bookings RLS Policies
CREATE POLICY "Coaches can view their bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_profiles
      WHERE coach_profiles.id = bookings.coach_id
      AND coach_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Athletes can view their bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.athlete_profiles
      WHERE athlete_profiles.id = bookings.athlete_id
      AND athlete_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Athletes can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.athlete_profiles
      WHERE athlete_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update their bookings"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_profiles
      WHERE coach_profiles.id = bookings.coach_id
      AND coach_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Athletes can update their bookings"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.athlete_profiles
      WHERE athlete_profiles.id = bookings.athlete_id
      AND athlete_profiles.id = auth.uid()
    )
  );

-- Payments RLS Policies
CREATE POLICY "Users can view payments for their bookings"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payments.booking_id
      AND (
        bookings.coach_id = auth.uid()
        OR bookings.athlete_id = auth.uid()
      )
    )
  );

CREATE POLICY "Coaches can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update payments"
  ON public.payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.coach_id = auth.uid()
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_profiles_updated_at
  BEFORE UPDATE ON public.coach_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athlete_profiles_updated_at
  BEFORE UPDATE ON public.athlete_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_bookings_coach_id ON public.bookings(coach_id);
CREATE INDEX idx_bookings_athlete_id ON public.bookings(athlete_id);
CREATE INDEX idx_bookings_session_date ON public.bookings(session_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX idx_payments_status ON public.payments(payment_status);