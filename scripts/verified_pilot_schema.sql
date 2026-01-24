-- PfPE Verified Pilot Mode V1.2 Schema
-- Adds activity sources, verified events, and points ledger
-- Run this AFTER the main supabase_schema.sql

-- ============================================
-- ACTIVITY SOURCES (OAuth connections)
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('strava', 'fitbit', 'google_fit')),
  provider_user_id TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT,
  athlete_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- ============================================
-- ACTIVITY EVENTS (verified activities)
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  name TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_sec INTEGER,
  distance_m NUMERIC(12,2),
  elevation_m NUMERIC(8,2),
  calories INTEGER,
  moving_time_sec INTEGER,
  raw_json JSONB,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, provider_event_id)
);

-- ============================================
-- POINTS LEDGER (append-only, server-controlled)
-- ============================================
CREATE TABLE IF NOT EXISTS public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('verified_strava', 'verified_fitbit', 'verified_google_fit', 'self_declared', 'quest_completion', 'lesson_completion', 'bonus', 'penalty')),
  event_id UUID REFERENCES public.activity_events(id) ON DELETE SET NULL,
  action_log_id UUID REFERENCES public.action_logs(id) ON DELETE SET NULL,
  metadata JSONB,
  client_request_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, source, event_id)
);

-- ============================================
-- SELF-DECLARED CAPS TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS public.self_declare_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_points_used INTEGER DEFAULT 0,
  daily_actions_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- ============================================
-- QUEST RULES (for verified activity requirements)
-- ============================================
CREATE TABLE IF NOT EXISTS public.quest_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('min_duration_weekly', 'min_activities', 'activity_types', 'min_distance')),
  rule_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quest_id, rule_type)
);

-- ============================================
-- Enable RLS
-- ============================================
ALTER TABLE public.activity_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_declare_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_rules ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- ACTIVITY_SOURCES: Users can only read their own (tokens are sensitive)
CREATE POLICY "Users can view own activity sources" ON public.activity_sources
  FOR SELECT USING (auth.uid() = user_id);

-- Users CANNOT insert/update directly - server only via service role
-- No INSERT/UPDATE policies for activity_sources (server-only)

-- ACTIVITY_EVENTS: Users can read their own
CREATE POLICY "Users can view own activity events" ON public.activity_events
  FOR SELECT USING (auth.uid() = user_id);

-- POINTS_LEDGER: Users can only READ their own (server-only writes)
CREATE POLICY "Users can view own points ledger" ON public.points_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- No INSERT policy for points_ledger - server only via service role

-- SELF_DECLARE_LIMITS: Users can read their own
CREATE POLICY "Users can view own self-declare limits" ON public.self_declare_limits
  FOR SELECT USING (auth.uid() = user_id);

-- QUEST_RULES: Anyone can read (public)
CREATE POLICY "Anyone can view quest rules" ON public.quest_rules
  FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update user points from points_ledger
CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET points = points + NEW.points,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for points_ledger
DROP TRIGGER IF EXISTS on_points_ledger_insert ON public.points_ledger;
CREATE TRIGGER on_points_ledger_insert
  AFTER INSERT ON public.points_ledger
  FOR EACH ROW EXECUTE FUNCTION public.update_user_points();

-- Function to check self-declare daily limit
CREATE OR REPLACE FUNCTION public.check_self_declare_limit(p_user_id UUID)
RETURNS TABLE(
  daily_points_remaining INTEGER,
  daily_actions_remaining INTEGER,
  can_self_declare BOOLEAN
) AS $$
DECLARE
  v_daily_points_used INTEGER;
  v_daily_actions_count INTEGER;
  v_max_daily_points INTEGER := 10;
  v_max_daily_actions INTEGER := 5;
BEGIN
  SELECT COALESCE(daily_points_used, 0), COALESCE(daily_actions_count, 0)
  INTO v_daily_points_used, v_daily_actions_count
  FROM public.self_declare_limits
  WHERE user_id = p_user_id AND date = CURRENT_DATE;

  IF NOT FOUND THEN
    v_daily_points_used := 0;
    v_daily_actions_count := 0;
  END IF;

  RETURN QUERY SELECT 
    v_max_daily_points - v_daily_points_used,
    v_max_daily_actions - v_daily_actions_count,
    (v_daily_points_used < v_max_daily_points AND v_daily_actions_count < v_max_daily_actions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_activity_sources_user_id ON public.activity_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON public.activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_start_time ON public.activity_events(start_time);
CREATE INDEX IF NOT EXISTS idx_activity_events_provider ON public.activity_events(provider);
CREATE INDEX IF NOT EXISTS idx_points_ledger_user_id ON public.points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_created_at ON public.points_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_points_ledger_source ON public.points_ledger(source);
CREATE INDEX IF NOT EXISTS idx_self_declare_limits_user_date ON public.self_declare_limits(user_id, date);

-- ============================================
-- Add columns to existing tables if needed
-- ============================================

-- Add source column to action_logs to distinguish verified vs self-declared
ALTER TABLE public.action_logs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'self_declared' CHECK (source IN ('self_declared', 'verified'));

-- Add verified flag to quests
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS requires_verified_activity BOOLEAN DEFAULT false;
