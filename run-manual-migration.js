const fs = require('fs');
const path = require('path');

// Read the fixed migration file
const migrationPath = path.join(__dirname, 'supabase', 'migrations', 'create_complete_chat_system_fixed.sql');
const sqlContent = fs.readFileSync(migrationPath, 'utf8');

console.log('🚀 COMPLETE CHAT SYSTEM MIGRATION');
console.log('=====================================\n');

console.log('Since we encountered connection issues, please run the following SQL manually:');
console.log('\n📋 INSTRUCTIONS:');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to: SQL Editor');
console.log('3. Copy and paste the SQL below');
console.log('4. Click "Run" to execute the migration');
console.log('\n🔧 SQL MIGRATION SCRIPT:');
console.log('=====================================\n');

// Split the SQL into manageable chunks
const statements = sqlContent.split(/;\s*$/m).filter(stmt => stmt.trim().length > 0);

console.log('-- COMPLETE CHAT SYSTEM MIGRATION');
console.log('-- This migration creates:');
console.log('-- 1. chat_conversations table');
console.log('-- 2. chat_messages table');
console.log('-- 3. Foreign key constraints');
console.log('-- 4. Performance indexes');
console.log('-- 5. Updated_at triggers');
console.log('-- 6. Row Level Security (RLS) policies');
console.log('-- 7. Helper functions');
console.log('\n' + sqlContent);

console.log('\n\n✅ MIGRATION SUMMARY');
console.log('=====================================');
console.log('This migration will create a complete chat system with:');
console.log('• chat_conversations table with user_id, title, legal_category, status, metadata');
console.log('• chat_messages table with conversation_id, sender, content, message_type');
console.log('• Foreign key constraints for data integrity');
console.log('• Performance indexes for fast queries');
console.log('• Updated_at triggers for automatic timestamp updates');
console.log('• RLS policies for user data isolation');
console.log('• Helper functions for common operations');

// Also create a simple test script
const testScript = `
-- TEST THE CHAT SYSTEM AFTER MIGRATION
-- Run these commands to verify the migration worked:

-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('chat_conversations', 'chat_messages');

-- Check if indexes exist
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('chat_conversations', 'chat_messages');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('chat_conversations', 'chat_messages');

-- Check if policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('chat_conversations', 'chat_messages');

-- Test inserting a conversation (you'll need to be logged in)
-- INSERT INTO chat_conversations (user_id, title, legal_category)
-- VALUES (auth.uid(), 'Test Conversation', 'general')
-- RETURNING *;
`;

console.log('\n\n🔍 VERIFICATION SCRIPT:');
console.log('=====================================');
console.log(testScript);

// Save the complete migration to a file for easy copying
const outputPath = path.join(__dirname, 'complete-chat-migration.sql');
fs.writeFileSync(outputPath, sqlContent);
console.log(`\n\n💾 Migration SQL saved to: ${outputPath}`);
console.log('You can also copy the SQL from this file and paste it into Supabase SQL Editor.');