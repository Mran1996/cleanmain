-- Add billing_cycle_anchor column to subscriptions table
-- This tracks when the subscription renews each billing period (monthly/yearly)
-- Stored as Unix timestamp (BIGINT) matching Stripe's format

-- Check if column exists before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' 
    AND column_name = 'billing_cycle_anchor'
  ) THEN
    ALTER TABLE subscriptions 
    ADD COLUMN billing_cycle_anchor BIGINT;
    
    RAISE NOTICE '✅ Added billing_cycle_anchor column to subscriptions table';
  ELSE
    RAISE NOTICE 'ℹ️ billing_cycle_anchor column already exists in subscriptions table';
  END IF;
END $$;

-- Add index for billing_cycle_anchor for efficient queries
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_cycle_anchor 
    ON subscriptions(billing_cycle_anchor) 
    WHERE billing_cycle_anchor IS NOT NULL;
  
  RAISE NOTICE '✅ Created index on billing_cycle_anchor';
END $$;

-- Add comment
COMMENT ON COLUMN subscriptions.billing_cycle_anchor IS 'Unix timestamp when the subscription renews each billing period (from Stripe)';

-- Backfill existing subscriptions with billing_cycle_anchor from created_at if null
DO $$
BEGIN
  UPDATE subscriptions 
  SET billing_cycle_anchor = EXTRACT(EPOCH FROM created_at)::BIGINT
  WHERE billing_cycle_anchor IS NULL 
    AND created_at IS NOT NULL;
  
  RAISE NOTICE '✅ Backfilled billing_cycle_anchor for existing subscriptions';
END $$;
