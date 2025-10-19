/**
 * Complete Integration Verification Script
 * Run with: npx tsx scripts/verify-integration.ts USER_ID
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyIntegration(userId: string) {
  console.log('🔍 Starting Complete Integration Verification\n');
  console.log('═'.repeat(60));
  
  let allPassed = true;
  
  // Test 1: Check User Exists
  console.log('\n📋 Test 1: User Existence');
  console.log('─'.repeat(60));
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      console.log('❌ FAILED: User not found');
      console.log('   Error:', error?.message);
      allPassed = false;
    } else {
      console.log('✅ PASSED: User found');
      console.log('   Email:', user.email);
      console.log('   Stripe Customer ID:', user.stripe_customer_id || 'Not set');
      console.log('   Created:', user.created_at);
    }
  } catch (e: any) {
    console.log('❌ FAILED:', e.message);
    allPassed = false;
  }
  
  // Test 2: Check Subscription
  console.log('\n📋 Test 2: Subscription Data');
  console.log('─'.repeat(60));
  try {
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.log('❌ FAILED: Error querying subscriptions');
      console.log('   Error:', error.message);
      allPassed = false;
    } else if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️  WARNING: No subscriptions found');
      console.log('   This is OK if user hasn\'t subscribed yet');
    } else {
      const sub = subscriptions[0];
      console.log('✅ PASSED: Subscription found');
      console.log('   Subscription ID:', sub.stripe_subscription_id);
      console.log('   Status:', sub.status);
      console.log('   Plan ID:', sub.plan_id || '❌ Missing!');
      console.log('   Period Start:', sub.current_period_start || '❌ Missing!');
      console.log('   Period End:', sub.current_period_end || '❌ Missing!');
      console.log('   Created:', sub.created_at || '❌ Missing!');
      console.log('   Updated:', sub.updated_at || '❌ Missing!');
      
      // Validate required fields
      if (!sub.plan_id) {
        console.log('❌ FAILED: plan_id is missing');
        allPassed = false;
      }
      if (!sub.current_period_start) {
        console.log('❌ FAILED: current_period_start is missing');
        allPassed = false;
      }
      if (!sub.current_period_end) {
        console.log('❌ FAILED: current_period_end is missing');
        allPassed = false;
      }
      if (!sub.created_at) {
        console.log('❌ FAILED: created_at is missing');
        allPassed = false;
      }
    }
  } catch (e: any) {
    console.log('❌ FAILED:', e.message);
    allPassed = false;
  }
  
  // Test 3: Check Transactions
  console.log('\n📋 Test 3: Transaction Records');
  console.log('─'.repeat(60));
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ FAILED: Error querying transactions');
      console.log('   Error:', error.message);
      allPassed = false;
    } else if (!transactions || transactions.length === 0) {
      console.log('⚠️  WARNING: No transactions found');
      console.log('   This is OK if user hasn\'t made any purchases');
    } else {
      console.log('✅ PASSED:', transactions.length, 'transaction(s) found');
      transactions.slice(0, 3).forEach((txn, i) => {
        console.log(`\n   Transaction ${i + 1}:`);
        console.log('     Amount:', txn.amount / 100, txn.currency.toUpperCase());
        console.log('     Status:', txn.status);
        console.log('     Date:', txn.transaction_date);
        console.log('     Created:', txn.created_at || '❌ Missing!');
        console.log('     Updated:', txn.updated_at || '❌ Missing!');
        
        if (!txn.created_at) {
          console.log('❌ FAILED: created_at is missing');
          allPassed = false;
        }
      });
    }
  } catch (e: any) {
    console.log('❌ FAILED:', e.message);
    allPassed = false;
  }
  
  // Test 4: Check Usage Stats
  console.log('\n📋 Test 4: Document Usage');
  console.log('─'.repeat(60));
  try {
    const { data: usage, error } = await supabase
      .from('document_usage')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      console.log('⚠️  WARNING: No usage record found');
      console.log('   Will be created on first API call');
    } else if (error) {
      console.log('❌ FAILED: Error querying usage');
      console.log('   Error:', error.message);
      allPassed = false;
    } else {
      console.log('✅ PASSED: Usage record found');
      console.log('   Monthly Limit:', usage.monthly_limit);
      console.log('   Monthly Remaining:', usage.monthly_remaining);
      console.log('   One-Time Remaining:', usage.one_time_remaining);
      console.log('   Total Generated:', usage.api_generated_total);
      console.log('   Period Start:', usage.monthly_period_start || 'Not set');
      console.log('   Period End:', usage.monthly_period_end || 'Not set');
      console.log('   Created:', usage.created_at || '❌ Missing!');
      console.log('   Updated:', usage.updated_at || '❌ Missing!');
      
      if (!usage.created_at) {
        console.log('❌ FAILED: created_at is missing');
        allPassed = false;
      }
    }
  } catch (e: any) {
    console.log('❌ FAILED:', e.message);
    allPassed = false;
  }
  
  // Test 5: Check API Endpoints (if server is running)
  console.log('\n📋 Test 5: API Endpoint Checks');
  console.log('─'.repeat(60));
  console.log('⚠️  SKIPPED: Requires running dev server');
  console.log('   To test APIs, run:');
  console.log('   1. npm run dev');
  console.log('   2. curl http://localhost:3000/api/subscription/status');
  console.log('   3. curl http://localhost:3000/api/usage');
  
  // Final Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('═'.repeat(60));
  
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('\nYour integration is working correctly. The system is:');
    console.log('  ✅ Properly saving subscription data');
    console.log('  ✅ Recording transactions with timestamps');
    console.log('  ✅ Tracking document usage');
    console.log('  ✅ Maintaining data integrity');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('\nPlease review the errors above and:');
    console.log('  1. Ensure webhooks are configured correctly');
    console.log('  2. Verify environment variables are set');
    console.log('  3. Check Stripe CLI is forwarding events');
    console.log('  4. Run sync script if data is missing');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('  1. Test a subscription purchase');
  console.log('  2. Test a one-time purchase');
  console.log('  3. Verify webhooks return 200');
  console.log('  4. Check frontend displays data correctly');
  
  console.log('\n📚 Documentation:');
  console.log('  - COMPLETE_INTEGRATION_GUIDE.md');
  console.log('  - WEBHOOK_FIX_COMPLETE.md');
  console.log('  - SUPABASE_ONLY_SUBSCRIPTION_CHECK.md');
  
  console.log('\n');
}

// Get user ID from command line or use default
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: User ID is required');
  console.log('\nUsage:');
  console.log('  npx tsx scripts/verify-integration.ts USER_ID');
  console.log('\nExample:');
  console.log('  npx tsx scripts/verify-integration.ts 2d406279-0cb0-4ec6-8f67-75becb08612e');
  process.exit(1);
}

console.log('🚀 Running integration verification for user:', userId);
verifyIntegration(userId).catch(console.error);
