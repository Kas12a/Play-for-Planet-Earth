-- Pilot Quest Pack Schema
-- Run this in Supabase SQL Editor

-- Proof Submissions table (for video/photo/screenshot proofs)
CREATE TABLE IF NOT EXISTS public.proof_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  proof_path TEXT NOT NULL,
  proof_type TEXT NOT NULL CHECK (proof_type IN ('proof_video', 'proof_photo', 'screenshot_health')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proof_submissions_user_id ON public.proof_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_quest_id ON public.proof_submissions(quest_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_status ON public.proof_submissions(status);

ALTER TABLE public.proof_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own proof submissions"
  ON public.proof_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proof submissions"
  ON public.proof_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.proof_submissions TO service_role;
GRANT SELECT, INSERT ON public.proof_submissions TO authenticated;

-- GPS Sessions table
CREATE TABLE IF NOT EXISTS public.gps_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  duration_sec INTEGER NOT NULL,
  distance_m INTEGER DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'flagged')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gps_sessions_user_id ON public.gps_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_gps_sessions_quest_id ON public.gps_sessions(quest_id);

ALTER TABLE public.gps_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gps sessions"
  ON public.gps_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gps sessions"
  ON public.gps_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.gps_sessions TO service_role;
GRANT SELECT, INSERT ON public.gps_sessions TO authenticated;

-- Quiz Completions table
CREATE TABLE IF NOT EXISTS public.quiz_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_completions_user_id ON public.quiz_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_completions_quest_id ON public.quiz_completions(quest_id);

ALTER TABLE public.quiz_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz completions"
  ON public.quiz_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz completions"
  ON public.quiz_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.quiz_completions TO service_role;
GRANT SELECT, INSERT ON public.quiz_completions TO authenticated;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_proof_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER proof_submissions_updated_at
  BEFORE UPDATE ON public.proof_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_proof_submissions_updated_at();
