const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running complete chat system migration...');
    
    // Execute SQL statements one by one using the REST API
    const statements = [
      // Create chat_conversations table
      `CREATE TABLE IF NOT EXISTS public.chat_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        title TEXT NOT NULL,
        legal_category TEXT DEFAULT 'general',
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      
      // Create chat_messages table
      `CREATE TABLE IF NOT EXISTS public.chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL,
        sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      
      // Add foreign key constraints
      `ALTER TABLE public.chat_conversations 
       ADD CONSTRAINT IF NOT EXISTS chat_conversations_user_id_fkey 
       FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;`,
      
      `ALTER TABLE public.chat_messages 
       ADD CONSTRAINT IF NOT EXISTS chat_messages_conversation_id_fkey 
       FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE;`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_at ON chat_conversations(created_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);`,
      `CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);`,
      
      // Enable RLS
      `ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;`,
      
      // Create RLS policies
      `CREATE POLICY IF NOT EXISTS "Users can view own conversations" ON chat_conversations
       FOR SELECT USING (auth.uid() = user_id);`,
      
      `CREATE POLICY IF NOT EXISTS "Users can insert own conversations" ON chat_conversations
       FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      
      `CREATE POLICY IF NOT EXISTS "Users can update own conversations" ON chat_conversations
       FOR UPDATE USING (auth.uid() = user_id);`,
      
      `CREATE POLICY IF NOT EXISTS "Users can delete own conversations" ON chat_conversations
       FOR DELETE USING (auth.uid() = user_id);`,
      
      `CREATE POLICY IF NOT EXISTS "Users can view messages in their conversations" ON chat_messages
       FOR SELECT USING (
         conversation_id IN (
           SELECT id FROM chat_conversations WHERE user_id = auth.uid()
         )
       );`,
      
      `CREATE POLICY IF NOT EXISTS "Users can insert messages in their conversations" ON chat_messages
       FOR INSERT WITH CHECK (
         conversation_id IN (
           SELECT id FROM chat_conversations WHERE user_id = auth.uid()
         )
       );`
    ];
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.warn(`Statement ${i + 1} failed:`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (stmtError) {
        console.warn(`Statement ${i + 1} error:`, stmtError.message);
      }
    }
    
    console.log('Migration completed!');
    
    // Test the setup
    console.log('Testing chat system setup...');
    
    // Check if tables exist
    const { data: convData, error: convError } = await supabase
      .from('chat_conversations')
      .select('*')
      .limit(1);
    
    if (convError) {
      console.log('Conversation table test result:', convError.message);
    } else {
      console.log('✅ Chat conversations table is accessible');
    }
    
    const { data: msgData, error: msgError } = await supabase
      .from('chat_messages')
      .select('*')
      .limit(1);
    
    if (msgError) {
      console.log('Message table test result:', msgError.message);
    } else {
      console.log('✅ Chat messages table is accessible');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();