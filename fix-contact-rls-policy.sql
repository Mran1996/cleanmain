-- Fix RLS policies for contact_submissions table
-- Run this in Supabase SQL Editor to ensure proper permissions

-- First, disable RLS temporarily to test if that's the issue
-- ALTER TABLE contact_submissions DISABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow anonymous users to submit contact forms" ON contact_submissions;
DROP POLICY IF EXISTS "Allow authenticated users to view all submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Allow authenticated users to insert submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Allow authenticated users to update submissions" ON contact_submissions;

-- Create a more permissive policy for anonymous contact form submissions
-- This policy allows ANYONE to insert into the contact_submissions table
CREATE POLICY "Allow public contact form submissions" ON contact_submissions
    FOR INSERT 
    WITH CHECK (true);

-- Create policy for authenticated users (admins) to manage submissions
CREATE POLICY "Allow authenticated users to manage submissions" ON contact_submissions
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Alternative: If you want to be more specific about what anonymous users can insert
-- CREATE POLICY "Allow anonymous contact form submissions" ON contact_submissions
--     FOR INSERT 
--     TO anon
--     WITH CHECK (
--         name IS NOT NULL AND 
--         email IS NOT NULL AND 
--         message IS NOT NULL AND
--         length(name) > 0 AND
--         length(email) > 0 AND
--         length(message) > 0
--     );

-- Verify the policies are created
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'contact_submissions';

-- Test the insertion manually (you can run this to verify)
-- INSERT INTO contact_submissions (name, email, reason, message) 
-- VALUES ('Test User', 'test@example.com', 'General Inquiry', 'This is a test message');

-- Check if the row was inserted
-- SELECT * FROM contact_submissions WHERE email = 'test@example.com';

-- Clean up test data
-- DELETE FROM contact_submissions WHERE email = 'test@example.com';

SELECT 'Contact form RLS policies updated successfully!' as status;