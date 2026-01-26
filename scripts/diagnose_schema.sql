-- PfPE Schema Diagnostic Script
-- Run this in Supabase SQL Editor to check onboarding columns

-- ============================================
-- CHECK 1: List all columns in profiles table
-- ============================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- CHECK 2: Specifically check for onboarding columns
-- ============================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
    'onboarding_step',
    'onboarding_complete',
    'onboarding_completed',
    'avatar_key',
    'age_range',
    'start_mode',
    'interests',
    'allow_location',
    'enable_notifications',
    'email_verify_dismissed_at'
  );

-- ============================================
-- CHECK 3: Verify trigger exists for new users
-- ============================================
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- ============================================
-- CHECK 4: Schema cache refresh (run this after adding columns)
-- ============================================
-- NOTIFY pgrst, 'reload schema';
