-- Tree-Nation Partner Quest Schema
-- Run this in Supabase SQL Editor to add tree gifts table

-- ============================================
-- TREE GIFTS (Tree-Nation API gift tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tree_gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_key TEXT NOT NULL DEFAULT 'tree_nation_partner_quest_v1',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'opened', 'failed')),
  tree_nation_gift_url TEXT,
  tree_nation_payload JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_quest UNIQUE (user_id, quest_key)
);

CREATE INDEX IF NOT EXISTS idx_tree_gifts_user_id ON public.tree_gifts(user_id);
CREATE INDEX IF NOT EXISTS idx_tree_gifts_quest_key ON public.tree_gifts(quest_key);

ALTER TABLE public.tree_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tree gifts"
  ON public.tree_gifts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Server can insert tree gifts"
  ON public.tree_gifts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Server can update tree gifts"
  ON public.tree_gifts FOR UPDATE
  USING (true);

-- Grant access for service role
GRANT ALL ON public.tree_gifts TO service_role;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tree_gifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tree_gifts_updated_at
  BEFORE UPDATE ON public.tree_gifts
  FOR EACH ROW
  EXECUTE FUNCTION update_tree_gifts_updated_at();
