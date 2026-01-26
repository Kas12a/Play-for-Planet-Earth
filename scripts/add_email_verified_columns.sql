-- Add email verification columns to profiles table
-- Run this in Supabase SQL Editor

-- Add email_verified column (our own tracking, separate from Supabase auth)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Add email_verified_at timestamp
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Grant update permissions on new columns
GRANT UPDATE (email_verified, email_verified_at) ON public.profiles TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Done!
