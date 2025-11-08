-- DIAGNOSTIC: Check current table structure
-- Run this first to see what tables and columns exist

-- Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('chat_conversations', 'chat_messages');

-- Check columns in chat_conversations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chat_conversations'
ORDER BY ordinal_position;

-- Check columns in chat_messages
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chat_messages'
ORDER BY ordinal_position;

-- Check existing constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name IN ('chat_conversations', 'chat_messages');