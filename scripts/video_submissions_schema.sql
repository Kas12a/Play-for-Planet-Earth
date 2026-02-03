-- Video Submissions Schema for Video Verification Quests
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.video_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  video_path TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_quest_submission UNIQUE (user_id, quest_id)
);

CREATE INDEX IF NOT EXISTS idx_video_submissions_user_id ON public.video_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_submissions_quest_id ON public.video_submissions(quest_id);
CREATE INDEX IF NOT EXISTS idx_video_submissions_status ON public.video_submissions(status);

ALTER TABLE public.video_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video submissions"
  ON public.video_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video submissions"
  ON public.video_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending submissions"
  ON public.video_submissions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

GRANT ALL ON public.video_submissions TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.video_submissions TO authenticated;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_submissions_updated_at
  BEFORE UPDATE ON public.video_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_video_submissions_updated_at();
