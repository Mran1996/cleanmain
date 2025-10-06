-- Add stripe_customer_id column to users table
-- This migration adds the missing stripe_customer_id column to the users table

-- Add stripe_customer_id column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Add comment for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment processing';
