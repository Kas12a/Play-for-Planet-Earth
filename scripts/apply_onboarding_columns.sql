-- SIMPLIFIED ONBOARDING MIGRATION
-- Copy and paste this entire script into Supabase SQL Editor
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor → New Query

-- Step 1: Add all onboarding columns (safe - won't error if they exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_key TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age_range TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS start_mode TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_location BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS enable_notifications BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'welcome';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verify_dismissed_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Step 2: Grant update permissions on new columns to authenticated users
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
  updated_at
) ON public.profiles TO authenticated;

-- Step 3: Refresh schema cache so PostgREST picks up changes
NOTIFY pgrst, 'reload schema';

-- Done! You should see "Success. No rows returned" message.
