-- Contact Form Submissions Table Schema
-- Copy and paste this into Supabase SQL Editor

-- Create the contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    reason TEXT DEFAULT 'General Inquiry',
    message TEXT NOT NULL,
    has_attachment BOOLEAN DEFAULT FALSE,
    attachment_name TEXT,
    attachment_size INTEGER,
    submission_ip TEXT DEFAULT 'unknown',
    user_agent TEXT DEFAULT 'unknown',
    status TEXT DEFAULT 'received' CHECK (status IN ('received', 'read', 'responded', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admins)
CREATE POLICY "Allow authenticated users to view all submissions" ON contact_submissions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert submissions" ON contact_submissions
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update submissions" ON contact_submissions
    FOR UPDATE TO authenticated
    USING (true);

-- Create policy for anonymous users to insert (for contact form)
CREATE POLICY "Allow anonymous users to submit contact forms" ON contact_submissions
    FOR INSERT TO anon
    WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_contact_submissions_updated_at
    BEFORE UPDATE ON contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for recent submissions
CREATE OR REPLACE VIEW recent_contact_submissions AS
SELECT 
    id,
    name,
    email,
    reason,
    message,
    has_attachment,
    attachment_name,
    status,
    created_at,
    submission_ip
FROM contact_submissions
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Success message
SELECT 'Contact submissions table created successfully!' as status;