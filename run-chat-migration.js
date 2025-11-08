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
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'supabase/migrations/create_complete_chat_system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the entire SQL at once
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: sql 
    });
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
    
    // Test the setup
    console.log('Testing chat system setup...');
    
    // Test creating a conversation (this will fail without valid user, but tests the structure)
    const { data: testConv, error: convError } = await supabase
      .from('chat_conversations')
      .select('*')
      .limit(1);
    
    if (convError) {
      console.log('Conversation test result:', convError.message);
    } else {
      console.log('✅ Chat system structure is ready');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();