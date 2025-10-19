/**
 * Credit Backfill Script
 * 
 * This script verifies and backfills credits for ALL users based on their transaction history.
 * 
 * Usage:
 *   npx ts-node scripts/backfill-all-user-credits.ts
 * 
 * What it does:
 * 1. Fetches all users from the database
 * 2. For each user:
 *    - Checks subscription status
 *    - Counts paid one-time transactions
 *    - Calculates expected credits
 *    - Compares with current credit balance
 *    - Backfills any missing credits
 * 3. Logs all changes made
 * 
 * Safe to run multiple times - only updates users with missing credits
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONTHLY_DOC_LIMIT = 150;
const ONE_TIME_DOC_LIMIT = 150;

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreditCorrection {
  userId: string;
  email: string;
  monthly: {
    before: number;
    after: number;
    needed: boolean;
  };
  oneTime: {
    before: number;
    after: number;
    needed: boolean;
  };
}

async function backfillUserCredits(userId: string, email: string): Promise<CreditCorrection | null> {
  try {
    console.log(`\n🔍 Checking user: ${email} (${userId})`);

    // Ensure usage record exists
    const { data: existingUsage } = await supabaseAdmin
      .from('document_usage')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!existingUsage) {
      console.log('  📝 Creating new document_usage record');
      await supabaseAdmin
        .from('document_usage')
        .insert({
          user_id: userId,
          monthly_limit: MONTHLY_DOC_LIMIT,
          monthly_remaining: 0,
          one_time_limit_per_purchase: ONE_TIME_DOC_LIMIT,
          one_time_remaining: 0,
          api_generated_total: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }

    // Get current credit state
    const { data: currentUsage } = await supabaseAdmin
      .from('document_usage')
      .select('*')
      .eq('user_id', userId)
      .single();

    const currentMonthly = currentUsage?.monthly_remaining || 0;
    const currentOneTime = currentUsage?.one_time_remaining || 0;

    console.log(`  📊 Current: monthly=${currentMonthly}, one-time=${currentOneTime}`);

    // Check for active subscription
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1);

    const hasActiveSubscription = subscriptions && subscriptions.length > 0;
    const subscription = hasActiveSubscription ? subscriptions[0] : null;

    console.log(`  💳 Subscription: ${subscription?.status || 'none'}`);

    // Count paid one-time transactions
    const { data: oneTimeTxs } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('transaction_type', 'one_time')
      .eq('status', 'paid')
      .eq('is_renewal', false);

    const oneTimePurchaseCount = oneTimeTxs?.length || 0;
    const expectedOneTimeCredits = oneTimePurchaseCount * ONE_TIME_DOC_LIMIT;

    console.log(`  🛒 One-time purchases: ${oneTimePurchaseCount} (expected credits: ${expectedOneTimeCredits})`);

    // Determine corrections needed
    const correction: CreditCorrection = {
      userId,
      email,
      monthly: {
        before: currentMonthly,
        after: currentMonthly,
        needed: false
      },
      oneTime: {
        before: currentOneTime,
        after: currentOneTime,
        needed: false
      }
    };

    // Monthly credits correction
    if (hasActiveSubscription && currentMonthly === 0) {
      correction.monthly.needed = true;
      correction.monthly.after = MONTHLY_DOC_LIMIT;
      console.log(`  ⚠️ Monthly credits need correction: 0 → ${MONTHLY_DOC_LIMIT}`);
    }

    // One-time credits correction
    if (oneTimePurchaseCount > 0 && currentOneTime === 0) {
      correction.oneTime.needed = true;
      correction.oneTime.after = expectedOneTimeCredits;
      console.log(`  ⚠️ One-time credits need correction: 0 → ${expectedOneTimeCredits}`);
    }

    // Apply corrections if needed
    if (correction.monthly.needed || correction.oneTime.needed) {
      const updates: any = {
        updated_at: new Date().toISOString()
      };

      if (correction.monthly.needed) {
        updates.monthly_remaining = correction.monthly.after;
        updates.monthly_limit = MONTHLY_DOC_LIMIT;
        
        if (subscription?.current_period_start) {
          updates.monthly_period_start = subscription.current_period_start;
        }
        if (subscription?.current_period_end) {
          updates.monthly_period_end = subscription.current_period_end;
        }
      }

      if (correction.oneTime.needed) {
        updates.one_time_remaining = correction.oneTime.after;
      }

      console.log(`  💾 Applying corrections:`, updates);

      const { error: updateError } = await supabaseAdmin
        .from('document_usage')
        .update(updates)
        .eq('user_id', userId);

      if (updateError) {
        console.error(`  ❌ Error applying corrections:`, updateError);
        return null;
      }

      console.log(`  ✅ Credits corrected successfully`);
      return correction;
    } else {
      console.log(`  ✅ Credits are correct, no changes needed`);
      return null;
    }

  } catch (error) {
    console.error(`  ❌ Error processing user ${email}:`, error);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting credit backfill for all users...\n');
  console.log('================================================\n');

  // Fetch all users
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error fetching users:', authError);
    process.exit(1);
  }

  if (!authUsers || authUsers.users.length === 0) {
    console.log('ℹ️ No users found');
    process.exit(0);
  }

  console.log(`📋 Found ${authUsers.users.length} users to check\n`);

  const corrections: CreditCorrection[] = [];
  let processed = 0;
  let corrected = 0;
  let errors = 0;

  for (const authUser of authUsers.users) {
    const result = await backfillUserCredits(authUser.id, authUser.email || 'no-email');
    processed++;

    if (result) {
      corrections.push(result);
      corrected++;
    }

    // Add a small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n================================================');
  console.log('📊 BACKFILL SUMMARY');
  console.log('================================================\n');
  console.log(`Total users processed: ${processed}`);
  console.log(`Users with corrections: ${corrected}`);
  console.log(`Errors: ${errors}\n`);

  if (corrections.length > 0) {
    console.log('📝 CORRECTIONS APPLIED:\n');
    corrections.forEach((c, i) => {
      console.log(`${i + 1}. ${c.email}`);
      if (c.monthly.needed) {
        console.log(`   Monthly: ${c.monthly.before} → ${c.monthly.after}`);
      }
      if (c.oneTime.needed) {
        console.log(`   One-time: ${c.oneTime.before} → ${c.oneTime.after}`);
      }
      console.log('');
    });
  }

  console.log('✅ Backfill complete!\n');
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
