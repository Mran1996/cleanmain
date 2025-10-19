-- Migration: Add transaction_type and is_renewal columns to transactions table
-- Purpose: Track transaction types (subscription vs one-time) and renewal status
-- Date: 2025-01-19

-- Step 1: Add transaction_type column (defaults to 'subscription' for backward compatibility)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'subscription';

-- Add comment to explain the column
COMMENT ON COLUMN transactions.transaction_type IS 'Type of transaction: subscription or one_time';

-- Step 2: Add is_renewal column (defaults to false)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS is_renewal BOOLEAN DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN transactions.is_renewal IS 'Indicates if this transaction is a subscription renewal (billing_reason = subscription_cycle)';

-- Step 3: Update existing transactions to set correct transaction_type
-- Set to 'one_time' for transactions without a subscription
UPDATE transactions
SET transaction_type = 'one_time'
WHERE stripe_subscription_id IS NULL;

-- Set to 'subscription' for transactions with a subscription (already default)
UPDATE transactions
SET transaction_type = 'subscription'
WHERE stripe_subscription_id IS NOT NULL;

-- Step 4: Update existing transactions to set is_renewal based on billing_reason in metadata
UPDATE transactions
SET is_renewal = true
WHERE 
  transaction_type = 'subscription' 
  AND metadata->>'billing_reason' = 'subscription_cycle';

-- Step 5: Create indexes for faster queries

-- Index on transaction_type for filtering
CREATE INDEX IF NOT EXISTS idx_transactions_type 
ON transactions(transaction_type);

-- Index on is_renewal (partial index for renewals only)
CREATE INDEX IF NOT EXISTS idx_transactions_is_renewal 
ON transactions(is_renewal) 
WHERE is_renewal = true;

-- Composite index for user + transaction type + date
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date 
ON transactions(user_id, transaction_type, transaction_date DESC);

-- Composite index for user + renewal status + date
CREATE INDEX IF NOT EXISTS idx_transactions_user_renewal 
ON transactions(user_id, is_renewal, transaction_date DESC);

-- Composite index for subscription renewals
CREATE INDEX IF NOT EXISTS idx_transactions_subscription_renewal 
ON transactions(stripe_subscription_id, is_renewal, transaction_date DESC)
WHERE stripe_subscription_id IS NOT NULL;

-- Step 6: Add constraint to ensure valid transaction types
ALTER TABLE transactions
ADD CONSTRAINT check_transaction_type 
CHECK (transaction_type IN ('subscription', 'one_time'));

-- Step 7: Verify the migration
DO $$
DECLARE
    total_transactions INTEGER;
    subscription_count INTEGER;
    one_time_count INTEGER;
    renewal_count INTEGER;
BEGIN
    -- Count total transactions
    SELECT COUNT(*) INTO total_transactions FROM transactions;
    
    -- Count subscription transactions
    SELECT COUNT(*) INTO subscription_count
    FROM transactions
    WHERE transaction_type = 'subscription';
    
    -- Count one-time transactions
    SELECT COUNT(*) INTO one_time_count
    FROM transactions
    WHERE transaction_type = 'one_time';
    
    -- Count renewal transactions
    SELECT COUNT(*) INTO renewal_count
    FROM transactions
    WHERE is_renewal = true;
    
    -- Log results
    RAISE NOTICE '=== Migration Completed Successfully ===';
    RAISE NOTICE 'Total transactions: %', total_transactions;
    RAISE NOTICE 'Subscription transactions: %', subscription_count;
    RAISE NOTICE 'One-time transactions: %', one_time_count;
    RAISE NOTICE 'Renewal transactions: %', renewal_count;
    RAISE NOTICE 'Initial subscriptions: %', subscription_count - renewal_count;
    RAISE NOTICE '========================================';
END $$;
