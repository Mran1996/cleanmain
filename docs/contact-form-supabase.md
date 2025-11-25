# Contact Form Supabase Integration

## Overview
The contact form now saves submissions to Supabase database in addition to sending emails via Brevo/SMTP.

## Database Schema
The `contact_submissions` table includes:
- `id`: UUID primary key
- `name`: Submitter's name
- `email`: Submitter's email
- `reason`: Contact reason (defaults to 'General Inquiry')
- `message`: The message content
- `has_attachment`: Boolean indicating if file was attached
- `attachment_name`: Name of attached file (if any)
- `attachment_size`: Size of attached file in bytes
- `submission_ip`: IP address of submitter
- `user_agent`: Browser user agent
- `status`: Submission status ('received', 'read', 'responded', 'archived')
- `created_at`: Timestamp of submission
- `updated_at`: Last update timestamp

## API Response
The contact form API now returns an additional `databaseId` field:
```json
{
  "success": true,
  "messageId": "smtp-message-id",
  "databaseId": "uuid-from-supabase"
}
```

## Error Handling
- Database insertion errors are logged but don't prevent email sending
- The form submission continues to work even if database save fails
- All errors are logged to console for debugging

## Security
- Row Level Security (RLS) is enabled
- Anonymous users can only insert new submissions
- Authenticated users can view, insert, and update submissions
- IP addresses and user agents are recorded for security monitoring

## Migration
Run the migration file to create the table:
```bash
# Apply the migration to your Supabase database
```