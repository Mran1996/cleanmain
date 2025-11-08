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
    console.log('Trying to create tables using alternative methods...');
    
    // Method 1: Try to create tables using the built-in supabase_admin schema
    console.log('Method 1: Trying supabase_admin schema...');
    
    const createTablesSQL = `
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
      
      ALTER TABLE public.chat_messages 
      ADD CONSTRAINT IF NOT EXISTS fk_chat_messages_conversation 
      FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;
    `;
    
    // Try to execute using a different RPC function
    const { data: result1, error: error1 } = await supabase
      .rpc('supabase_admin.exec_sql', { sql: createTablesSQL });
    
    if (!error1) {
      console.log('✅ Tables created using supabase_admin schema');
    } else {
      console.log('Method 1 failed:', error1.message);
    }
    
    // Method 2: Try to create a simple table first
    console.log('Method 2: Trying to create simple table...');
    const { data: result2, error: error2 } = await supabase
      .rpc('create_simple_table');
    
    if (!error2) {
      console.log('✅ Simple table function executed');
    } else {
      console.log('Method 2 failed:', error2.message);
    }
    
    // Method 3: Use the auth schema
    console.log('Method 3: Trying auth schema...');
    const { data: result3, error: error3 } = await supabase
      .rpc('auth.exec_sql', { sql: createTablesSQL });
    
    if (!error3) {
      console.log('✅ Tables created using auth schema');
    } else {
      console.log('Method 3 failed:', error3.message);
    }
    
    // Method 4: Try to use the built-in migration system
    console.log('Method 4: Trying to use migration system...');
    
    // Check if we can access the migration table
    const { data: migrations, error: migrationError } = await supabase
      .from('supabase_migrations')
      .select('*')
      .limit(1);
    
    if (!migrationError) {
      console.log('✅ Can access migration system');
    } else {
      console.log('Migration system access failed:', migrationError.message);
    }
    
    // Method 5: Try to create tables using a different approach - create one at a time
    console.log('Method 5: Creating tables one at a time...');
    
    const conversationTableSQL = `
      CREATE TABLE IF NOT EXISTS public.chat_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        title TEXT NOT NULL,
        legal_category TEXT DEFAULT 'general',
        status TEXT DEFAULT 'active',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    
    // Try using the graphql schema
    const { data: graphqlResult, error: graphqlError } = await supabase
      .rpc('graphql.exec_sql', { sql: conversationTableSQL });
    
    if (!graphqlError) {
      console.log('✅ Chat conversations table created using graphql schema');
    } else {
      console.log('GraphQL schema method failed:', graphqlError.message);
    }
    
    // Final test
    console.log('Testing final state...');
    
    try {
      const { data: convData, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .limit(1);
      
      if (convError) {
        console.log('Conversation table status:', convError.message);
      } else {
        console.log('✅ Chat conversations table is accessible');
      }
    } catch (e) {
      console.log('Conversation table issue:', e.message);
    }
    
    try {
      const { data: msgData, error: msgError } = await supabase
        .from('chat_messages')
        .select('*')
        .limit(1);
      
      if (msgError) {
        console.log('Message table status:', msgError.message);
      } else {
        console.log('✅ Chat messages table is accessible');
      }
    } catch (e) {
      console.log('Message table issue:', e.message);
    }
    
    console.log('Migration attempt completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();