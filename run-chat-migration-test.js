const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

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

// Extract project reference from Supabase URL
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

// Try different connection string formats
const connectionConfigs = [
  {
    name: 'Direct connection',
    connectionString: `postgresql://postgres:${env.SUPABASE_SERVICE_ROLE_KEY}@db.${projectRef}.supabase.co:5432/postgres`
  },
  {
    name: 'Pooler session mode',
    connectionString: `postgresql://postgres.${projectRef}:${env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
  },
  {
    name: 'Pooler transaction mode',
    connectionString: `postgresql://postgres:${env.SUPABASE_SERVICE_ROLE_KEY}@db.${projectRef}.supabase.co:6543/postgres`
  }
];

async function testConnection(config) {
  const client = new Client({
    connectionString: config.connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log(`Testing ${config.name}...`);
    await client.connect();
    console.log(`✅ ${config.name} - Connected successfully`);
    
    // Test a simple query
    const result = await client.query('SELECT current_database() as db, current_user as user');
    console.log(`✅ ${config.name} - Query successful:`, result.rows[0]);
    
    await client.end();
    return true;
  } catch (error) {
    console.log(`❌ ${config.name} - Failed:`, error.message);
    return false;
  }
}

async function runMigration() {
  // Test different connection methods
  let successfulConfig = null;
  
  for (const config of connectionConfigs) {
    const success = await testConnection(config);
    if (success) {
      successfulConfig = config;
      break;
    }
  }
  
  if (!successfulConfig) {
    console.error('❌ All connection attempts failed');
    process.exit(1);
  }
  
  console.log(`\nUsing ${successfulConfig.name} for migration...`);
  
  const client = new Client({
    connectionString: successfulConfig.connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database for migration');

    console.log('Running complete chat system migration...');

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
      `CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);`
    ];

    // Execute each SQL statement
    for (let i = 0; i < sqlStatements.length; i++) {
      console.log(`Executing statement ${i + 1}/${sqlStatements.length}...`);
      try {
        await client.query(sqlStatements[i]);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.log(`❌ Statement ${i + 1} failed:`, error.message);
        // Continue with other statements even if one fails
      }
    }

    console.log('Migration completed!');

    // Test the setup
    console.log('Testing chat system setup...');
    
    try {
      const convResult = await client.query('SELECT COUNT(*) as count FROM public.chat_conversations');
      console.log(`✅ Chat conversations table is accessible (${convResult.rows[0].count} rows)`);
    } catch (error) {
      console.log('❌ Chat conversations table test failed:', error.message);
    }
    
    try {
      const msgResult = await client.query('SELECT COUNT(*) as count FROM public.chat_messages');
      console.log(`✅ Chat messages table is accessible (${msgResult.rows[0].count} rows)`);
    } catch (error) {
      console.log('❌ Chat messages table test failed:', error.message);
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

runMigration();