-- PfPE Workout Planner Schema
-- Run this AFTER the main supabase_schema.sql and verified_pilot_schema.sql

-- Update points_ledger source constraint to include 'workout'
ALTER TABLE public.points_ledger DROP CONSTRAINT IF EXISTS points_ledger_source_check;
ALTER TABLE public.points_ledger ADD CONSTRAINT points_ledger_source_check 
  CHECK (source IN ('verified_strava', 'verified_fitbit', 'verified_google_fit', 'self_declared', 'quest_completion', 'lesson_completion', 'bonus', 'penalty', 'workout'));

-- ============================================
-- WORKOUT PLANS
-- ============================================
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  target_days_per_week INTEGER DEFAULT 3 CHECK (target_days_per_week >= 1 AND target_days_per_week <= 7),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WORKOUT EXERCISES (exercises in a plan)
-- ============================================
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('cardio', 'strength', 'flexibility', 'balance', 'hiit')),
  sets INTEGER DEFAULT 3 CHECK (sets >= 1),
  reps INTEGER CHECK (reps >= 1),
  duration_minutes INTEGER CHECK (duration_minutes >= 1),
  rest_seconds INTEGER DEFAULT 60 CHECK (rest_seconds >= 0),
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WORKOUT SESSIONS (completed workouts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 1),
  calories_burned INTEGER,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EXERCISE LOGS (individual exercises in a session)
-- ============================================
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets_completed INTEGER,
  reps_completed INTEGER,
  weight_kg NUMERIC(5,2),
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- WORKOUT_PLANS: Users can manage their own plans
CREATE POLICY "Users can view own workout plans" ON public.workout_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout plans" ON public.workout_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans" ON public.workout_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plans" ON public.workout_plans
  FOR DELETE USING (auth.uid() = user_id);

-- WORKOUT_EXERCISES: Users can manage exercises in their own plans
CREATE POLICY "Users can view exercises in own plans" ON public.workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans 
      WHERE workout_plans.id = workout_exercises.plan_id 
      AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert exercises in own plans" ON public.workout_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_plans 
      WHERE workout_plans.id = workout_exercises.plan_id 
      AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercises in own plans" ON public.workout_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans 
      WHERE workout_plans.id = workout_exercises.plan_id 
      AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercises in own plans" ON public.workout_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans 
      WHERE workout_plans.id = workout_exercises.plan_id 
      AND workout_plans.user_id = auth.uid()
    )
  );

-- WORKOUT_SESSIONS: Users can manage their own sessions
CREATE POLICY "Users can view own workout sessions" ON public.workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions" ON public.workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions" ON public.workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions" ON public.workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- EXERCISE_LOGS: Users can manage logs in their own sessions
CREATE POLICY "Users can view logs in own sessions" ON public.exercise_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions 
      WHERE workout_sessions.id = exercise_logs.session_id 
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert logs in own sessions" ON public.exercise_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions 
      WHERE workout_sessions.id = exercise_logs.session_id 
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete logs in own sessions" ON public.exercise_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions 
      WHERE workout_sessions.id = exercise_logs.session_id 
      AND workout_sessions.user_id = auth.uid()
    )
  );

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON public.workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_plan_id ON public.workout_exercises(plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_completed_at ON public.workout_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_session_id ON public.exercise_logs(session_id);
