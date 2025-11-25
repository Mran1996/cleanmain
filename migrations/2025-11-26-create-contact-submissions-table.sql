-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON public.contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admins)
CREATE POLICY "Allow authenticated users to view all submissions" ON public.contact_submissions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert submissions" ON public.contact_submissions
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update submissions" ON public.contact_submissions
    FOR UPDATE TO authenticated
    USING (true);

-- Create policy for anonymous users to insert (for contact form)
CREATE POLICY "Allow anonymous users to submit contact forms" ON public.contact_submissions
    FOR INSERT TO anon
    WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contact_submissions_updated_at
    BEFORE UPDATE ON public.contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();