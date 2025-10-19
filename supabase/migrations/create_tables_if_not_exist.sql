-- Safe Migration Script: Create subscriptions and transactions tables if not exist
-- This script checks for existing tables and columns before creating them
-- Safe to run multiple times (idempotent)

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================

-- Create subscriptions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
    CREATE TABLE subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      stripe_subscription_id TEXT UNIQUE NOT NULL,
      stripe_customer_id TEXT NOT NULL,
      status TEXT NOT NULL,
      plan_id TEXT,
      current_period_start TIMESTAMPTZ,
      current_period_end TIMESTAMPTZ,
      billing_cycle_anchor BIGINT,
      canceled_at TIMESTAMPTZ,
      cancel_at_period_end BOOLEAN DEFAULT false,
      cancel_at TIMESTAMPTZ,
      trial_start TIMESTAMPTZ,
      trial_end TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    RAISE NOTICE '✅ Created subscriptions table';
  ELSE
    RAISE NOTICE 'ℹ️  Subscriptions table already exists';
  END IF;
END $$;

-- Add missing columns to subscriptions table
DO $$
BEGIN
  -- Add user_id if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'user_id') THEN
    ALTER TABLE subscriptions ADD COLUMN user_id UUID NOT NULL;
    RAISE NOTICE '✅ Added user_id column to subscriptions';
  END IF;

  -- Add stripe_subscription_id if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'stripe_subscription_id') THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id TEXT UNIQUE NOT NULL;
    RAISE NOTICE '✅ Added stripe_subscription_id column to subscriptions';
  END IF;

  -- Add stripe_customer_id if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_customer_id TEXT NOT NULL;
    RAISE NOTICE '✅ Added stripe_customer_id column to subscriptions';
  END IF;

  -- Add status if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'status') THEN
    ALTER TABLE subscriptions ADD COLUMN status TEXT NOT NULL;
    RAISE NOTICE '✅ Added status column to subscriptions';
  END IF;

  -- Add plan_id if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'plan_id') THEN
    ALTER TABLE subscriptions ADD COLUMN plan_id TEXT;
    RAISE NOTICE '✅ Added plan_id column to subscriptions';
  END IF;

  -- Add current_period_start if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'current_period_start') THEN
    ALTER TABLE subscriptions ADD COLUMN current_period_start TIMESTAMPTZ;
    RAISE NOTICE '✅ Added current_period_start column to subscriptions';
  END IF;

  -- Add current_period_end if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'current_period_end') THEN
    ALTER TABLE subscriptions ADD COLUMN current_period_end TIMESTAMPTZ;
    RAISE NOTICE '✅ Added current_period_end column to subscriptions';
  END IF;

  -- Add billing_cycle_anchor if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'billing_cycle_anchor') THEN
    ALTER TABLE subscriptions ADD COLUMN billing_cycle_anchor BIGINT;
    RAISE NOTICE '✅ Added billing_cycle_anchor column to subscriptions';
  END IF;

  -- Add canceled_at if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'canceled_at') THEN
    ALTER TABLE subscriptions ADD COLUMN canceled_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Added canceled_at column to subscriptions';
  END IF;

  -- Add cancel_at_period_end if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'cancel_at_period_end') THEN
    ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Added cancel_at_period_end column to subscriptions';
  END IF;

  -- Add cancel_at if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'cancel_at') THEN
    ALTER TABLE subscriptions ADD COLUMN cancel_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Added cancel_at column to subscriptions';
  END IF;

  -- Add trial_start if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'trial_start') THEN
    ALTER TABLE subscriptions ADD COLUMN trial_start TIMESTAMPTZ;
    RAISE NOTICE '✅ Added trial_start column to subscriptions';
  END IF;

  -- Add trial_end if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'trial_end') THEN
    ALTER TABLE subscriptions ADD COLUMN trial_end TIMESTAMPTZ;
    RAISE NOTICE '✅ Added trial_end column to subscriptions';
  END IF;

  -- Add created_at if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'created_at') THEN
    ALTER TABLE subscriptions ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE '✅ Added created_at column to subscriptions';
  END IF;

  -- Add updated_at if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'updated_at') THEN
    ALTER TABLE subscriptions ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE '✅ Added updated_at column to subscriptions';
  END IF;
END $$;

-- Add constraints to subscriptions table if not exist
DO $$
BEGIN
  -- Add foreign key to auth.users if not exists
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'subscriptions_user_id_fkey') THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added foreign key constraint to subscriptions.user_id';
  END IF;

  -- Add check constraint for status if not exists
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'check_subscription_status') THEN
    ALTER TABLE subscriptions ADD CONSTRAINT check_subscription_status 
      CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 
                        'past_due', 'trialing', 'unpaid'));
    RAISE NOTICE '✅ Added status check constraint to subscriptions';
  END IF;
END $$;

-- Create indexes for subscriptions table if not exist
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(stripe_customer_id);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(user_id, status) 
    WHERE status IN ('active', 'trialing');
  CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_date ON subscriptions(current_period_end) 
    WHERE status = 'active';
  
  RAISE NOTICE '✅ Subscriptions table indexes created/verified';
END $$;

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================

-- Create transactions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    CREATE TABLE transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      stripe_payment_intent_id TEXT,
      stripe_invoice_id TEXT,
      stripe_subscription_id TEXT,
      stripe_customer_id TEXT NOT NULL,
      plan_id TEXT,
      amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'usd',
      transaction_type TEXT NOT NULL DEFAULT 'subscription',
      is_renewal BOOLEAN NOT NULL DEFAULT false,
      status TEXT NOT NULL DEFAULT 'paid',
      payment_method TEXT,
      description TEXT,
      metadata JSONB,
      transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    RAISE NOTICE '✅ Created transactions table';
  ELSE
    RAISE NOTICE 'ℹ️  Transactions table already exists';
  END IF;
END $$;

-- Add missing columns to transactions table
DO $$
BEGIN
  -- Add user_id if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'user_id') THEN
    ALTER TABLE transactions ADD COLUMN user_id UUID NOT NULL;
    RAISE NOTICE '✅ Added user_id column to transactions';
  END IF;

  -- Add stripe_payment_intent_id if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'stripe_payment_intent_id') THEN
    ALTER TABLE transactions ADD COLUMN stripe_payment_intent_id TEXT;
    RAISE NOTICE '✅ Added stripe_payment_intent_id column to transactions';
  END IF;

  -- Add stripe_invoice_id if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'stripe_invoice_id') THEN
    ALTER TABLE transactions ADD COLUMN stripe_invoice_id TEXT;
    RAISE NOTICE '✅ Added stripe_invoice_id column to transactions';
  END IF;

  -- Add stripe_subscription_id if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'stripe_subscription_id') THEN
    ALTER TABLE transactions ADD COLUMN stripe_subscription_id TEXT;
    RAISE NOTICE '✅ Added stripe_subscription_id column to transactions';
  END IF;

  -- Add stripe_customer_id if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE transactions ADD COLUMN stripe_customer_id TEXT NOT NULL;
    RAISE NOTICE '✅ Added stripe_customer_id column to transactions';
  END IF;

  -- Add plan_id if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'plan_id') THEN
    ALTER TABLE transactions ADD COLUMN plan_id TEXT;
    RAISE NOTICE '✅ Added plan_id column to transactions';
  END IF;

  -- Add amount if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'amount') THEN
    ALTER TABLE transactions ADD COLUMN amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
    RAISE NOTICE '✅ Added amount column to transactions';
  END IF;

  -- Add currency if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'currency') THEN
    ALTER TABLE transactions ADD COLUMN currency TEXT NOT NULL DEFAULT 'usd';
    RAISE NOTICE '✅ Added currency column to transactions';
  END IF;

  -- Add transaction_type if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'transaction_type') THEN
    ALTER TABLE transactions ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'subscription';
    RAISE NOTICE '✅ Added transaction_type column to transactions';
  END IF;

  -- Add is_renewal if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'is_renewal') THEN
    ALTER TABLE transactions ADD COLUMN is_renewal BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE '✅ Added is_renewal column to transactions';
  END IF;

  -- Add status if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'status') THEN
    ALTER TABLE transactions ADD COLUMN status TEXT NOT NULL DEFAULT 'paid';
    RAISE NOTICE '✅ Added status column to transactions';
  END IF;

  -- Add payment_method if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'payment_method') THEN
    ALTER TABLE transactions ADD COLUMN payment_method TEXT;
    RAISE NOTICE '✅ Added payment_method column to transactions';
  END IF;

  -- Add description if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'description') THEN
    ALTER TABLE transactions ADD COLUMN description TEXT;
    RAISE NOTICE '✅ Added description column to transactions';
  END IF;

  -- Add metadata if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'metadata') THEN
    ALTER TABLE transactions ADD COLUMN metadata JSONB;
    RAISE NOTICE '✅ Added metadata column to transactions';
  END IF;

  -- Add transaction_date if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'transaction_date') THEN
    ALTER TABLE transactions ADD COLUMN transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE '✅ Added transaction_date column to transactions';
  END IF;

  -- Add created_at if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'created_at') THEN
    ALTER TABLE transactions ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE '✅ Added created_at column to transactions';
  END IF;

  -- Add updated_at if not exists
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'updated_at') THEN
    ALTER TABLE transactions ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE '✅ Added updated_at column to transactions';
  END IF;
END $$;

-- Add constraints to transactions table if not exist
DO $$
BEGIN
  -- Add foreign key to auth.users if not exists
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'transactions_user_id_fkey') THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added foreign key constraint to transactions.user_id';
  END IF;

  -- Add check constraint for transaction_type if not exists
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'check_transaction_type') THEN
    ALTER TABLE transactions ADD CONSTRAINT check_transaction_type 
      CHECK (transaction_type IN ('subscription', 'one_time'));
    RAISE NOTICE '✅ Added transaction_type check constraint to transactions';
  END IF;

  -- Add check constraint for status if not exists
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'check_transaction_status') THEN
    ALTER TABLE transactions ADD CONSTRAINT check_transaction_status 
      CHECK (status IN ('paid', 'failed', 'canceled', 'refunded'));
    RAISE NOTICE '✅ Added status check constraint to transactions';
  END IF;

  -- Add check constraint for positive amount if not exists
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'check_positive_amount') THEN
    ALTER TABLE transactions ADD CONSTRAINT check_positive_amount 
      CHECK (amount >= 0);
    RAISE NOTICE '✅ Added positive amount check constraint to transactions';
  END IF;

  -- Add check constraint: one-time can't be renewal
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'check_onetime_not_renewal') THEN
    ALTER TABLE transactions ADD CONSTRAINT check_onetime_not_renewal 
      CHECK (NOT (transaction_type = 'one_time' AND is_renewal = true));
    RAISE NOTICE '✅ Added one-time not renewal check constraint to transactions';
  END IF;

  -- Add check constraint: renewal requires subscription
  IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'check_renewal_has_subscription') THEN
    ALTER TABLE transactions ADD CONSTRAINT check_renewal_has_subscription 
      CHECK (NOT (is_renewal = true AND stripe_subscription_id IS NULL));
    RAISE NOTICE '✅ Added renewal requires subscription check constraint to transactions';
  END IF;
END $$;

-- Create unique index on stripe_invoice_id if not exists
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS transactions_stripe_invoice_id_key 
    ON transactions(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
  
  RAISE NOTICE '✅ Created unique index on transactions.stripe_invoice_id';
END $$;

-- Create indexes for transactions table if not exist
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_payment_intent ON transactions(stripe_payment_intent_id) 
    WHERE stripe_payment_intent_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_transactions_subscription ON transactions(stripe_subscription_id) 
    WHERE stripe_subscription_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
  CREATE INDEX IF NOT EXISTS idx_transactions_is_renewal ON transactions(is_renewal) 
    WHERE is_renewal = true;
  CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date ON transactions(user_id, transaction_type, transaction_date DESC);
  CREATE INDEX IF NOT EXISTS idx_transactions_user_renewal ON transactions(user_id, is_renewal, transaction_date DESC);
  CREATE INDEX IF NOT EXISTS idx_transactions_subscription_renewal ON transactions(stripe_subscription_id, is_renewal, transaction_date DESC)
    WHERE stripe_subscription_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
  CREATE INDEX IF NOT EXISTS idx_transactions_plan ON transactions(plan_id) WHERE plan_id IS NOT NULL;
  
  RAISE NOTICE '✅ Transactions table indexes created/verified';
END $$;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

DO $$
DECLARE
  subscription_count INTEGER;
  transaction_count INTEGER;
  subscription_cols INTEGER;
  transaction_cols INTEGER;
BEGIN
  -- Count subscriptions
  SELECT COUNT(*) INTO subscription_count FROM subscriptions;
  
  -- Count transactions
  SELECT COUNT(*) INTO transaction_count FROM transactions;
  
  -- Count subscription columns
  SELECT COUNT(*) INTO subscription_cols 
  FROM information_schema.columns 
  WHERE table_name = 'subscriptions';
  
  -- Count transaction columns
  SELECT COUNT(*) INTO transaction_cols 
  FROM information_schema.columns 
  WHERE table_name = 'transactions';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Subscriptions table:';
  RAISE NOTICE '  - Columns: %', subscription_cols;
  RAISE NOTICE '  - Records: %', subscription_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Transactions table:';
  RAISE NOTICE '  - Columns: %', transaction_cols;
  RAISE NOTICE '  - Records: %', transaction_count;
  RAISE NOTICE '========================================';
END $$;
