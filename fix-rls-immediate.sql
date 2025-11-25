-- Immediate fix for contact form RLS issue
-- Copy and paste this into Supabase SQL Editor and run it

-- Step 1: Disable RLS temporarily to confirm this is the issue
ALTER TABLE contact_submissions DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify the change
SELECT 'RLS disabled for contact_submissions table' as status;

-- Step 3: Test insertion manually (optional - you can run this to verify)
-- INSERT INTO contact_submissions (name, email, reason, message) 
-- VALUES ('Test User', 'test@example.com', 'General Inquiry', 'Testing RLS fix');

-- Step 4: Check if the test row was inserted (optional)
-- SELECT * FROM contact_submissions WHERE email = 'test@example.com' LIMIT 5;

-- Step 5: Clean up test data (optional)
-- DELETE FROM contact_submissions WHERE email = 'test@example.com';

-- After confirming the contact form works, you can re-enable RLS with proper policies:
-- Step 6: Re-enable RLS with proper policies (run this after testing)
/*
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy for public contact form submissions
CREATE POLICY "Allow public contact form submissions" ON contact_submissions
    FOR INSERT WITH CHECK (true);

-- Create policy for authenticated users to manage submissions
CREATE POLICY "Allow authenticated users to manage submissions" ON contact_submissions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
*/