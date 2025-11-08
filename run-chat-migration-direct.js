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
    
    // Create tables using the Supabase client
    console.log('Creating chat_conversations table...');
    
    // First, try to create the table using a simple query
    const { data: convResult, error: convError } = await supabase
      .rpc('create_table_chat_conversations');
    
    if (convError) {
      console.log('Direct RPC failed, trying alternative method...');
      
      // Try to execute SQL through the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `
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
          `
        })
      });
      
      if (!response.ok) {
        console.warn('Table creation may have failed:', response.statusText);
      }
    }
    
    console.log('Creating chat_messages table...');
    
    // Try to create messages table
    const response2 = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
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
        `
      })
    });
    
    console.log('Migration attempt completed!');
    
    // Test the setup
    console.log('Testing chat system setup...');
    
    // Check if tables exist by trying to select from them
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
      console.log('Conversation table not ready yet:', e.message);
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
      console.log('Message table not ready yet:', e.message);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();