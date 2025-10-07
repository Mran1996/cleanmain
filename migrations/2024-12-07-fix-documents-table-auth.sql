-- Fix documents table to use auth.users instead of profiles
-- This migration updates the foreign key reference for Supabase auth compatibility

-- Drop the existing foreign key constraint
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_user_id_fkey;

-- Add the correct foreign key constraint referencing auth.users
ALTER TABLE documents ADD CONSTRAINT documents_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update the comment to reflect the change
COMMENT ON TABLE documents IS 'User documents (uploaded and AI-generated) linked to Supabase Auth users';
