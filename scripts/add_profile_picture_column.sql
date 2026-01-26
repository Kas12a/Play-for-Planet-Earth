-- Add profile picture URL column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.profile_picture_url IS 'URL/path to user uploaded profile picture';
