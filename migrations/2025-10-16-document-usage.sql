-- Document usage tracking: monthly subscription and one-time credits
-- Provides per-user counters for API document generation

BEGIN;

CREATE TABLE IF NOT EXISTS document_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Monthly subscription credits
  monthly_limit INTEGER NOT NULL DEFAULT 150,
  monthly_remaining INTEGER NOT NULL DEFAULT 0,
  monthly_period_start TIMESTAMP WITH TIME ZONE,
  monthly_period_end TIMESTAMP WITH TIME ZONE,

  -- One-time purchase credits (accumulates across purchases)
  one_time_limit_per_purchase INTEGER NOT NULL DEFAULT 150,
  one_time_remaining INTEGER NOT NULL DEFAULT 0,

  -- Aggregate tracking for reporting
  api_generated_total INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_document_usage_user_id ON document_usage(user_id);

-- Enable RLS and set policies
ALTER TABLE document_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own document usage" ON document_usage;
DROP POLICY IF EXISTS "Users can insert their own document usage" ON document_usage;
DROP POLICY IF EXISTS "Users can update their own document usage" ON document_usage;

CREATE POLICY "Users can view their own document usage" ON document_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own document usage" ON document_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own document usage" ON document_usage
  FOR UPDATE USING (auth.uid() = user_id);

COMMENT ON TABLE document_usage IS 'Per-user document generation usage: monthly subscription credits and one-time credits with aggregate API-generated count.';

COMMIT;