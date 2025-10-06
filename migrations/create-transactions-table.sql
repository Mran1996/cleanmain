-- Drop existing transactions table and create new model
-- This migration replaces the old transaction table with enhanced Stripe webhook tracking

-- Drop existing table and its dependencies
DROP TABLE IF EXISTS transactions CASCADE;

-- Create new transactions table for payment tracking
-- This table stores all payment transactions from Stripe webhooks
-- Note: Using UUID for user_id to match Supabase auth.users format
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References auth.users.id directly
    
    -- Stripe identifiers
    stripe_payment_intent_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    
    -- Transaction details
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) NOT NULL, -- paid, failed, pending, canceled, refunded
    payment_method VARCHAR(50), -- card, bank_account, etc.
    
    -- Transaction metadata
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    transaction_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent_id ON transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_invoice_id ON transactions(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_subscription_id ON transactions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions(transaction_date);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE transactions IS 'Payment transaction records from Stripe webhooks';
COMMENT ON COLUMN transactions.amount IS 'Transaction amount in cents (e.g., $10.00 = 1000)';
COMMENT ON COLUMN transactions.status IS 'Transaction status: paid, failed, pending, canceled, refunded';
COMMENT ON COLUMN transactions.metadata IS 'Additional transaction metadata from Stripe in JSON format';
