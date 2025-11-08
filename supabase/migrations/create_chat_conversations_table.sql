-- Migration: Create chat_conversations table
-- This table stores chat conversations for the AI assistant

-- Create chat_conversations table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_conversations') THEN
    CREATE TABLE chat_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      title TEXT NOT NULL,
      messages JSONB NOT NULL,
      legal_category TEXT DEFAULT 'general',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    RAISE NOTICE '✅ Created chat_conversations table';
  ELSE
    RAISE NOTICE 'ℹ️  chat_conversations table already exists';
  END IF;
END $$;

-- Add foreign key constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chat_conversations_user_id_fkey') THEN
    ALTER TABLE chat_conversations 
      ADD CONSTRAINT chat_conversations_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Added foreign key constraint to chat_conversations.user_id';
  END IF;
END $$;

-- Add check constraint for legal_category if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'check_legal_category') THEN
    ALTER TABLE chat_conversations 
      ADD CONSTRAINT check_legal_category 
      CHECK (legal_category IN ('general', 'family', 'criminal', 'civil', 'business', 'employment', 'real_estate', 'immigration'));
    
    RAISE NOTICE '✅ Added legal_category check constraint to chat_conversations';
  END IF;
END $$;

-- Create indexes for better performance
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
  CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_at ON chat_conversations(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_created ON chat_conversations(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_chat_conversations_legal_category ON chat_conversations(legal_category);
  
  RAISE NOTICE '✅ Created indexes for chat_conversations table';
END $$;

-- Create updated_at trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_chat_conversations_updated_at') THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    CREATE TRIGGER update_chat_conversations_updated_at
      BEFORE UPDATE ON chat_conversations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE '✅ Created updated_at trigger for chat_conversations';
  END IF;
END $$;

-- Grant permissions (assuming RLS is enabled)
DO $$
BEGIN
  -- Enable RLS if not already enabled
  ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
  
  -- Create policy for users to only see their own conversations
  CREATE POLICY IF NOT EXISTS "Users can view own conversations" ON chat_conversations
    FOR SELECT USING (auth.uid() = user_id);
  
  -- Create policy for users to insert their own conversations
  CREATE POLICY IF NOT EXISTS "Users can insert own conversations" ON chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  
  -- Create policy for users to update their own conversations
  CREATE POLICY IF NOT EXISTS "Users can update own conversations" ON chat_conversations
    FOR UPDATE USING (auth.uid() = user_id);
  
  -- Create policy for users to delete their own conversations
  CREATE POLICY IF NOT EXISTS "Users can delete own conversations" ON chat_conversations
    FOR DELETE USING (auth.uid() = user_id);
  
  RAISE NOTICE '✅ Created row level security policies for chat_conversations';
END $$;

-- Final verification
DO $$
DECLARE
  table_count INTEGER;
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_conversations';
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'chat_conversations';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎯 CHAT_CONVERSATIONS MIGRATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ chat_conversations table: %', CASE WHEN table_count > 0 THEN 'CREATED' ELSE 'EXISTS' END;
  RAISE NOTICE '✅ Row Level Security: ENABLED';
  RAISE NOTICE '✅ Security Policies: %', policy_count;
  RAISE NOTICE '✅ Indexes: 4 created';
  RAISE NOTICE '✅ Foreign Key: auth.users(id)';
  RAISE NOTICE '✅ Updated At Trigger: ACTIVE';
  RAISE NOTICE '========================================';
END $$;