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
    console.log('Creating PostgreSQL function to create chat tables...');
    
    // Create a PostgreSQL function that will create the tables
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.create_chat_tables()
      RETURNS BOOLEAN AS $$
      BEGIN
        -- Create chat_conversations table
        CREATE TABLE IF NOT EXISTS public.chat_conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          title TEXT NOT NULL,
          legal_category TEXT DEFAULT 'general',
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Create chat_messages table
        CREATE TABLE IF NOT EXISTS public.chat_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL,
          sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
          content TEXT NOT NULL,
          message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Add foreign key constraint
        ALTER TABLE public.chat_messages 
        ADD CONSTRAINT IF NOT EXISTS fk_chat_messages_conversation 
        FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON public.chat_conversations(status);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
        
        -- Create updated_at triggers
        CREATE OR REPLACE FUNCTION public.update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER IF NOT EXISTS update_chat_conversations_updated_at 
          BEFORE UPDATE ON public.chat_conversations 
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
          
        CREATE TRIGGER IF NOT EXISTS update_chat_messages_updated_at 
          BEFORE UPDATE ON public.chat_messages 
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
        
        RETURN TRUE;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Execute the function creation
    const { data: funcResult, error: funcError } = await supabase
      .rpc('exec_sql', { sql: createFunctionSQL });
    
    if (funcError) {
      console.log('Function creation failed, trying direct RPC...');
      
      // Try to create the function using a simpler method
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/create_chat_tables`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        console.log('Function creation failed, will try to call existing function...');
      }
    } else {
      console.log('✅ Function created successfully');
    }
    
    // Now call the function to create the tables
    console.log('Calling function to create tables...');
    const { data: result, error } = await supabase
      .rpc('create_chat_tables');
    
    if (error) {
      console.log('Direct function call failed, trying alternative...');
      
      // Try alternative method - execute SQL directly through REST API
      const sqlStatements = [
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
        
        `ALTER TABLE public.chat_messages 
        ADD CONSTRAINT IF NOT EXISTS fk_chat_messages_conversation 
        FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;`
      ];
      
      for (let i = 0; i < sqlStatements.length; i++) {
        console.log(`Executing statement ${i + 1}/${sqlStatements.length}...`);
        try {
          const { data, error: stmtError } = await supabase
            .rpc('exec_sql', { sql: sqlStatements[i] });
          
          if (stmtError) {
            console.log(`Statement ${i + 1} failed:`, stmtError.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed`);
          }
        } catch (e) {
          console.log(`Statement ${i + 1} error:`, e.message);
        }
      }
    } else {
      console.log('✅ Tables created successfully');
    }
    
    // Test the setup
    console.log('Testing chat system setup...');
    
    try {
      const { data: convData, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .limit(1);
      
      if (convError) {
        console.log('Conversation table test result:', convError.message);
      } else {
        console.log('✅ Chat conversations table is accessible');
      }
    } catch (e) {
      console.log('Conversation table test result:', e.message);
    }
    
    try {
      const { data: msgData, error: msgError } = await supabase
        .from('chat_messages')
        .select('*')
        .limit(1);
      
      if (msgError) {
        console.log('Message table test result:', msgError.message);
      } else {
        console.log('✅ Chat messages table is accessible');
      }
    } catch (e) {
      console.log('Message table test result:', e.message);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();