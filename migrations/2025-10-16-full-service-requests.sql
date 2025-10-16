-- Create full_service_requests table for post-purchase intake
-- This stores intake submissions linked to Supabase Auth users

-- Ensure pgcrypto/gen_random_uuid is available (usually enabled in Supabase)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS full_service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    stripe_session_id VARCHAR(255) NOT NULL,

    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    state VARCHAR(10) NOT NULL,
    county VARCHAR(255) NOT NULL,
    case_number VARCHAR(100) NOT NULL,
    opposing_party VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    file_url TEXT,
    file_type VARCHAR(50),
    file_size BIGINT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_full_service_requests_user_id ON full_service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_full_service_requests_created_at ON full_service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_full_service_requests_stripe_session_id ON full_service_requests(stripe_session_id);

-- Enable RLS and define policies
ALTER TABLE full_service_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own full_service_requests" ON full_service_requests;
DROP POLICY IF EXISTS "Users can insert their own full_service_requests" ON full_service_requests;
DROP POLICY IF EXISTS "Users can update their own full_service_requests" ON full_service_requests;
DROP POLICY IF EXISTS "Users can delete their own full_service_requests" ON full_service_requests;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view their own full_service_requests" ON full_service_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own full_service_requests" ON full_service_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own full_service_requests" ON full_service_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own full_service_requests" ON full_service_requests
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp on changes (function should already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_full_service_requests_updated_at'
  ) THEN
    CREATE TRIGGER update_full_service_requests_updated_at
      BEFORE UPDATE ON full_service_requests
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- Table comment
COMMENT ON TABLE full_service_requests IS 'Post-purchase intake submissions linked to paid users';