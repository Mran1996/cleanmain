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

async function executeSQL(sql) {
  try {
    // Extract the project reference from the URL
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
    
    // Use the Supabase API to execute SQL
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'X-Client-Info': 'supabase-js/2.0.0'
      },
      body: JSON.stringify({
        query: sql,
        format: 'json'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return { data: result, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

async function runMigration() {
  try {
    console.log('Running complete chat system migration via API...');
    
    // SQL statements to create the complete chat system
    const sqlStatements = [
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
      
      // Add foreign key constraint
      `ALTER TABLE public.chat_messages 
      ADD CONSTRAINT IF NOT EXISTS fk_chat_messages_conversation 
      FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON public.chat_conversations(status);`,
      `CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);`,
      `CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);`,
      
      // Create updated_at trigger function
      `CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;`,
      
      // Create triggers
      `CREATE TRIGGER IF NOT EXISTS update_chat_conversations_updated_at 
        BEFORE UPDATE ON public.chat_conversations 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();`,
        
      `CREATE TRIGGER IF NOT EXISTS update_chat_messages_updated_at 
        BEFORE UPDATE ON public.chat_messages 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();`,
      
      // Enable RLS
      `ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;`,
      
      // RLS policies for chat_conversations
      `CREATE POLICY "Users can view their own conversations" ON public.chat_conversations
        FOR SELECT USING (auth.uid() = user_id);`,
        
      `CREATE POLICY "Users can insert their own conversations" ON public.chat_conversations
        FOR INSERT WITH CHECK (auth.uid() = user_id);`,
        
      `CREATE POLICY "Users can update their own conversations" ON public.chat_conversations
        FOR UPDATE USING (auth.uid() = user_id);`,
        
      `CREATE POLICY "Users can delete their own conversations" ON public.chat_conversations
        FOR DELETE USING (auth.uid() = user_id);`,
      
      // RLS policies for chat_messages
      `CREATE POLICY "Users can view messages from their conversations" ON public.chat_messages
        FOR SELECT USING (
          conversation_id IN (
            SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
          )
        );`,
        
      `CREATE POLICY "Users can insert messages to their conversations" ON public.chat_messages
        FOR INSERT WITH CHECK (
          conversation_id IN (
            SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
          )
        );`,
        
      `CREATE POLICY "Users can update messages in their conversations" ON public.chat_messages
        FOR UPDATE USING (
          conversation_id IN (
            SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
          )
        );`,
        
      `CREATE POLICY "Users can delete messages from their conversations" ON public.chat_messages
        FOR DELETE USING (
          conversation_id IN (
            SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
          )
        );`
    ];
    
    // Execute each SQL statement
    for (let i = 0; i < sqlStatements.length; i++) {
      console.log(`Executing statement ${i + 1}/${sqlStatements.length}...`);
      const { data, error } = await executeSQL(sqlStatements[i]);
      
      if (error) {
        console.log(`Statement ${i + 1} failed:`, error.message);
      } else {
        console.log(`✅ Statement ${i + 1} executed`);
      }
    }
    
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();