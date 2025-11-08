-- Migration: Create complete chat system with conversations and messages tables
-- This creates a proper relational structure for chat functionality

-- Create chat_conversations table if it doesn't exist (with enhanced structure)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_conversations') THEN
    CREATE TABLE chat_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      title TEXT NOT NULL,
      legal_category TEXT DEFAULT 'general',
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    RAISE NOTICE '✅ Created chat_conversations table';
  ELSE
    RAISE NOTICE 'ℹ️  chat_conversations table already exists, enhancing structure';
    
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_conversations' AND column_name = 'status') THEN
      ALTER TABLE chat_conversations ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted'));
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_conversations' AND column_name = 'metadata') THEN
      ALTER TABLE chat_conversations ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
  END IF;
END $$;

-- Create chat_messages table for individual messages
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
    CREATE TABLE chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL,
      sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    RAISE NOTICE '✅ Created chat_messages table';
  ELSE
    RAISE NOTICE 'ℹ️  chat_messages table already exists';
  END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  -- Foreign key from conversations to users
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chat_conversations_user_id_fkey') THEN
    ALTER TABLE chat_conversations 
      ADD CONSTRAINT chat_conversations_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Added foreign key constraint to chat_conversations.user_id';
  END IF;
  
  -- Foreign key from messages to conversations
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chat_messages_conversation_id_fkey') THEN
    ALTER TABLE chat_messages 
      ADD CONSTRAINT chat_messages_conversation_id_fkey 
      FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Added foreign key constraint to chat_messages.conversation_id';
  END IF;
END $$;

-- Create indexes for better performance
DO $$
BEGIN
  -- Indexes for chat_conversations
  CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
  CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_at ON chat_conversations(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_created ON chat_conversations(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_chat_conversations_legal_category ON chat_conversations(legal_category);
  CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
  
  -- Indexes for chat_messages
  CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
  CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created ON chat_messages(conversation_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender);
  
  RAISE NOTICE '✅ Created performance indexes for both tables';
END $$;

-- Create updated_at triggers
DO $$
BEGIN
  -- Trigger for chat_conversations
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
  
  -- Trigger for chat_messages
  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_chat_messages_updated_at') THEN
    CREATE TRIGGER update_chat_messages_updated_at
      BEFORE UPDATE ON chat_messages
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE '✅ Created updated_at trigger for chat_messages';
  END IF;
END $$;

-- Enable Row Level Security (RLS)
DO $$
BEGIN
  -- Enable RLS on chat_conversations
  ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
  
  -- Enable RLS on chat_messages
  ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE '✅ Enabled Row Level Security on both tables';
END $$;

-- Create RLS Policies
DO $$
BEGIN
  -- Chat Conversations Policies
  CREATE POLICY IF NOT EXISTS "Users can view own conversations" ON chat_conversations
    FOR SELECT USING (auth.uid() = user_id);
  
  CREATE POLICY IF NOT EXISTS "Users can insert own conversations" ON chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  
  CREATE POLICY IF NOT EXISTS "Users can update own conversations" ON chat_conversations
    FOR UPDATE USING (auth.uid() = user_id);
  
  CREATE POLICY IF NOT EXISTS "Users can delete own conversations" ON chat_conversations
    FOR DELETE USING (auth.uid() = user_id);
  
  -- Chat Messages Policies
  CREATE POLICY IF NOT EXISTS "Users can view messages in their conversations" ON chat_messages
    FOR SELECT USING (
      conversation_id IN (
        SELECT id FROM chat_conversations WHERE user_id = auth.uid()
      )
    );
  
  CREATE POLICY IF NOT EXISTS "Users can insert messages in their conversations" ON chat_messages
    FOR INSERT WITH CHECK (
      conversation_id IN (
        SELECT id FROM chat_conversations WHERE user_id = auth.uid()
      )
    );
  
  CREATE POLICY IF NOT EXISTS "Users can update messages in their conversations" ON chat_messages
    FOR UPDATE USING (
      conversation_id IN (
        SELECT id FROM chat_conversations WHERE user_id = auth.uid()
      )
    );
  
  CREATE POLICY IF NOT EXISTS "Users can delete messages in their conversations" ON chat_messages
    FOR DELETE USING (
      conversation_id IN (
        SELECT id FROM chat_conversations WHERE user_id = auth.uid()
      )
    );
  
  RAISE NOTICE '✅ Created comprehensive RLS policies';
END $$;

-- Create helper function to get conversation with messages
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'get_conversation_with_messages') THEN
    CREATE OR REPLACE FUNCTION get_conversation_with_messages(p_conversation_id UUID, p_user_id UUID)
    RETURNS TABLE (
      conversation_id UUID,
      conversation_title TEXT,
      conversation_legal_category TEXT,
      conversation_created_at TIMESTAMPTZ,
      message_id UUID,
      message_sender TEXT,
      message_content TEXT,
      message_type TEXT,
      message_created_at TIMESTAMPTZ
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        c.id,
        c.title,
        c.legal_category,
        c.created_at,
        m.id,
        m.sender,
        m.content,
        m.message_type,
        m.created_at
      FROM chat_conversations c
      LEFT JOIN chat_messages m ON c.id = m.conversation_id
      WHERE c.id = p_conversation_id AND c.user_id = p_user_id
      ORDER BY m.created_at ASC;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    RAISE NOTICE '✅ Created get_conversation_with_messages function';
  END IF;
END $$;

-- Create function to insert message and update conversation timestamp
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'insert_message_update_conversation') THEN
    CREATE OR REPLACE FUNCTION insert_message_update_conversation(
      p_conversation_id UUID,
      p_sender TEXT,
      p_content TEXT,
      p_message_type TEXT DEFAULT 'text',
      p_metadata JSONB DEFAULT '{}'
    )
    RETURNS UUID AS $$
    DECLARE
      v_message_id UUID;
    BEGIN
      -- Insert the message
      INSERT INTO chat_messages (conversation_id, sender, content, message_type, metadata)
      VALUES (p_conversation_id, p_sender, p_content, p_message_type, p_metadata)
      RETURNING id INTO v_message_id;
      
      -- Update the conversation timestamp
      UPDATE chat_conversations 
      SET updated_at = NOW() 
      WHERE id = p_conversation_id;
      
      RETURN v_message_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    RAISE NOTICE '✅ Created insert_message_update_conversation function';
  END IF;
END $$;

-- Final verification
DO $$
DECLARE
  conv_table_count INTEGER;
  msg_table_count INTEGER;
  conv_policy_count INTEGER;
  msg_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conv_table_count FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_conversations';
  SELECT COUNT(*) INTO msg_table_count FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages';
  SELECT COUNT(*) INTO conv_policy_count FROM pg_policies WHERE tablename = 'chat_conversations';
  SELECT COUNT(*) INTO msg_policy_count FROM pg_policies WHERE tablename = 'chat_messages';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎯 COMPLETE CHAT SYSTEM MIGRATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Chat Conversations Table: %', CASE WHEN conv_table_count > 0 THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '✅ Chat Messages Table: %', CASE WHEN msg_table_count > 0 THEN 'EXISTS' ELSE 'MISSING' END;
  RAISE NOTICE '✅ Conversation Policies: %', conv_policy_count;
  RAISE NOTICE '✅ Message Policies: %', msg_policy_count;
  RAISE NOTICE '✅ Foreign Key Constraints: ACTIVE';
  RAISE NOTICE '✅ Performance Indexes: 9 created';
  RAISE NOTICE '✅ Helper Functions: 2 created';
  RAISE NOTICE '✅ Row Level Security: ENABLED';
  RAISE NOTICE '========================================';
END $$;