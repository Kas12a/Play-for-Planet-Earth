-- PfPE Pilot Mode Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  age_band TEXT CHECK (age_band IN ('Under 16', '16-18', '19-30', '31+')),
  cohort_id TEXT,
  level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  credits INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  focus TEXT,
  parent_email TEXT,
  consent_verified BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ACTION TYPES (eco-actions users can log)
-- ============================================
CREATE TABLE IF NOT EXISTS public.action_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Transport', 'Energy', 'Food', 'Waste', 'Community')),
  base_reward_credits INTEGER NOT NULL DEFAULT 10,
  impact_co2 NUMERIC(10,3) DEFAULT 0,
  impact_waste NUMERIC(10,3) DEFAULT 0,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ACTION LOGS (user-submitted actions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.action_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type_id UUID NOT NULL REFERENCES public.action_types(id) ON DELETE CASCADE,
  note TEXT,
  photo_url TEXT,
  confidence NUMERIC(3,2) DEFAULT 0.85 CHECK (confidence >= 0 AND confidence <= 1),
  credits_earned INTEGER NOT NULL,
  client_request_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREDIT TRANSACTIONS (ledger)
-- ============================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('EARN', 'REDEEM', 'DONATE', 'SPONSOR_TOPUP', 'PENALTY', 'REVERSAL')),
  amount INTEGER NOT NULL,
  source_type TEXT NOT NULL,
  confidence NUMERIC(3,2),
  metadata JSONB,
  client_request_id TEXT NOT NULL,
  proof_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- QUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  credits_reward INTEGER NOT NULL DEFAULT 100,
  xp_reward INTEGER NOT NULL DEFAULT 200,
  category TEXT NOT NULL CHECK (category IN ('Global', 'Cohort')),
  duration TEXT,
  image_url TEXT,
  evidence_required BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- QUEST PARTICIPANTS (user joins)
-- ============================================
CREATE TABLE IF NOT EXISTS public.quest_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, quest_id)
);

-- ============================================
-- BADGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  criteria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER BADGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ============================================
-- LESSONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  duration TEXT,
  content TEXT,
  credits_reward INTEGER DEFAULT 25,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER LESSONS (completions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- ============================================
-- FEEDBACK (pilot user feedback)
-- ============================================
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  screen TEXT,
  type TEXT CHECK (type IN ('bug', 'idea', 'confusing', 'other')),
  message TEXT NOT NULL,
  user_agent TEXT,
  app_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read their own profile, update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow reading display names for leaderboard (anonymized)
CREATE POLICY "Anyone can view display names for leaderboard" ON public.profiles
  FOR SELECT USING (true);

-- ACTION_TYPES: Anyone can read (public catalog)
CREATE POLICY "Anyone can view action types" ON public.action_types
  FOR SELECT USING (is_active = true);

-- ACTION_LOGS: Users can read/insert their own
CREATE POLICY "Users can view own action logs" ON public.action_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own action logs" ON public.action_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CREDIT_TRANSACTIONS: Users can read their own
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- QUESTS: Anyone can read active quests
CREATE POLICY "Anyone can view active quests" ON public.quests
  FOR SELECT USING (is_active = true);

-- QUEST_PARTICIPANTS: Users can read/insert/update their own
CREATE POLICY "Users can view own quest participation" ON public.quest_participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join quests" ON public.quest_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quest progress" ON public.quest_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- BADGES: Anyone can read
CREATE POLICY "Anyone can view badges" ON public.badges
  FOR SELECT USING (true);

-- USER_BADGES: Users can read their own
CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- LESSONS: Anyone can read active lessons
CREATE POLICY "Anyone can view active lessons" ON public.lessons
  FOR SELECT USING (is_active = true);

-- USER_LESSONS: Users can read/insert their own
CREATE POLICY "Users can view own lesson completions" ON public.user_lessons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can complete lessons" ON public.user_lessons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- FEEDBACK: Users can insert, only admins can read
CREATE POLICY "Users can submit feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    50  -- Welcome bonus
  );
  
  -- Add welcome bonus transaction
  INSERT INTO public.credit_transactions (user_id, type, amount, source_type, client_request_id)
  VALUES (
    NEW.id,
    'SPONSOR_TOPUP',
    50,
    'welcome_bonus',
    'welcome_' || NEW.id::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user credits
CREATE OR REPLACE FUNCTION public.update_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET credits = credits + NEW.amount,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update credits on transaction
DROP TRIGGER IF EXISTS on_credit_transaction ON public.credit_transactions;
CREATE TRIGGER on_credit_transaction
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_user_credits();

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_action_logs_user_id ON public.action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_created_at ON public.action_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_quest_participants_user_id ON public.quest_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_participants_quest_id ON public.quest_participants(quest_id);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON public.profiles(points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_credits ON public.profiles(credits DESC);
