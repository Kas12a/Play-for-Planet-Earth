-- PfPE Onboarding Flow Migration
-- Run this in Supabase SQL Editor
-- This adds onboarding fields and secures points/credits

-- ============================================
-- ADD NEW ONBOARDING COLUMNS TO PROFILES
-- ============================================

-- Avatar key for preset avatars
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_key TEXT;

-- Age range with new options
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_age_band_check;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age_range TEXT;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_age_range_check 
  CHECK (age_range IS NULL OR age_range IN ('12 - 15', '16 - 20', '21 - 28', '29 - 35', '36 or older'));

-- Start mode (individual or group)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS start_mode TEXT;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_start_mode_check 
  CHECK (start_mode IS NULL OR start_mode IN ('individual', 'group'));

-- Interests array (up to 6 options)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests TEXT[];

-- Permission toggles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_location BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS enable_notifications BOOLEAN DEFAULT false;

-- Onboarding step tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'welcome';

-- Rename onboarding_completed to onboarding_complete for consistency (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN onboarding_completed TO onboarding_complete;
  ELSE
    -- Add the column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'onboarding_complete'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN onboarding_complete BOOLEAN DEFAULT false;
    END IF;
  END IF;
END $$;

-- Email verification dismissal tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verify_dismissed_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- UPDATE TRIGGER: New users start with 0 credits/points
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    display_name, 
    role, 
    level, 
    points, 
    credits, 
    streak, 
    onboarding_step,
    onboarding_complete, 
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NULL,
    'user',
    1,
    0,      -- Start with ZERO points
    0,      -- Start with ZERO credits
    0,
    'welcome',
    false,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SECURE RLS: Prevent client from updating points/credits
-- ============================================

-- Drop existing update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create restricted update policy (excludes points and credits)
CREATE POLICY "Users can update own profile (restricted)"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Ensure points and credits are not being changed by comparing old vs new
    -- This is enforced via column-level security below
    true
  );

-- ============================================
-- COLUMN-LEVEL SECURITY: Server-only points/credits
-- ============================================

-- Revoke UPDATE on specific columns from anon/authenticated roles
-- Points and credits can only be updated by service role (server-side)
REVOKE UPDATE (points, credits) ON public.profiles FROM anon, authenticated;

-- Grant UPDATE on safe columns to authenticated users
GRANT UPDATE (
  display_name, 
  name,
  avatar_key, 
  age_range, 
  start_mode, 
  interests, 
  allow_location, 
  enable_notifications, 
  onboarding_step, 
  onboarding_complete,
  email_verify_dismissed_at,
  focus,
  updated_at
) ON public.profiles TO authenticated;

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Check trigger exists
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Check column privileges
SELECT column_name, privilege_type, grantee
FROM information_schema.column_privileges
WHERE table_name = 'profiles' AND column_name IN ('points', 'credits');
