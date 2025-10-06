-- Add canceled_at column to subscriptions table
-- This migration adds the canceled_at timestamp field to track when subscriptions were canceled

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.canceled_at IS 'Timestamp when the subscription was canceled (from Stripe webhook)';

-- Create index for better performance on canceled subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_canceled_at ON subscriptions(canceled_at);
