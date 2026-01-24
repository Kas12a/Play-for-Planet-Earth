-- Profile Auto-Creation Trigger for Supabase
-- Run this in Supabase SQL Editor to automatically create a profile row when a new user signs up

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, display_name, role, level, points, credits, streak, onboarding_completed, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NULL,
    'user',
    1,
    0,
    50,  -- Starting credits for new users
    0,
    false,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate creation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger was created
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- RLS policies for profiles table (if not already set)
-- These ensure users can read/update their own profile

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (backup for client-side upsert if trigger fails)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Leaderboard policy: Allow reading display_name and points for rankings
DROP POLICY IF EXISTS "Public leaderboard read" ON public.profiles;
CREATE POLICY "Public leaderboard read"
  ON public.profiles FOR SELECT
  USING (true);  -- Anyone can read for leaderboard (we'll filter columns in queries)

-- Verify policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
