-- Harden transactions/subscriptions for webhook idempotency and integrity
-- Adds FKs, unique indexes, and explicit RLS policies

BEGIN;

-- Ensure FK from transactions.user_id to users.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_user_id_fkey'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Unique index to prevent duplicate invoices on retries
CREATE UNIQUE INDEX IF NOT EXISTS uniq_transactions_stripe_invoice_id
  ON transactions(stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

-- Unique index to prevent duplicate payment intents on retries
CREATE UNIQUE INDEX IF NOT EXISTS uniq_transactions_stripe_payment_intent_id
  ON transactions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- Index for customer lookups
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_customer_id
  ON transactions(stripe_customer_id);

COMMENT ON INDEX uniq_transactions_stripe_invoice_id IS 'Prevents duplicate invoices from webhook retries';
COMMENT ON INDEX uniq_transactions_stripe_payment_intent_id IS 'Prevents duplicate payment intents from webhook retries';

-- Ensure unique index on subscription ID (safety if UNIQUE not present)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_subscriptions_stripe_subscription_id
  ON subscriptions(stripe_subscription_id);

-- Ensure FK on subscriptions.user_id -> users.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'subscriptions_user_id_fkey'
  ) THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Explicit RLS policies for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;

CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Explicit RLS policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;

CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

COMMIT;