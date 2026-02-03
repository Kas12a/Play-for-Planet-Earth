-- Add health_data_source column to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS health_data_source TEXT 
CHECK (health_data_source IN ('apple', 'google', 'samsung', 'none'));

COMMENT ON COLUMN public.profiles.health_data_source IS 'User selected health data source for quest verification (apple, google, samsung, or none)';
