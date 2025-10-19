/**
 * Manual script to sync subscription data from Stripe to Supabase
 * Run this to fix existing subscriptions that are missing period dates
 * 
 * Usage: npx ts-node scripts/sync-subscription-from-stripe.ts
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncSubscriptionFromStripe(userId: string) {
  try {
    console.log('🔍 Finding user:', userId);
    
    // Get user's stripe customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError);
      return;
    }

    if (!user.stripe_customer_id) {
      console.error('❌ User has no Stripe customer ID');
      return;
    }

    console.log('✅ Found user:', user.email, 'Customer ID:', user.stripe_customer_id);

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'all',
      expand: ['data.items.data.price']
    });

    console.log(`📊 Found ${subscriptions.data.length} subscription(s) in Stripe`);

    for (const sub of subscriptions.data) {
      const subscription: any = sub; // Cast to any to access all fields
      const planId = subscription.items?.data?.[0]?.price?.id || null;
      
      console.log('\n📝 Subscription:', subscription.id);
      console.log('   Status:', subscription.status);
      console.log('   Plan ID:', planId);
      console.log('   Period Start:', subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null);
      console.log('   Period End:', subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null);

      const subscriptionUpdate = {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: user.stripe_customer_id,
        status: subscription.status,
        plan_id: planId,
        current_period_start: subscription.current_period_start 
          ? new Date(subscription.current_period_start * 1000).toISOString() 
          : null,
        current_period_end: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString() 
          : null,
        canceled_at: subscription.canceled_at 
          ? new Date(subscription.canceled_at * 1000).toISOString() 
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        created_at: subscription.created 
          ? new Date(subscription.created * 1000).toISOString()
          : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Upsert to database
      const { error: upsertError } = await supabase
        .from('subscriptions')
        .upsert(subscriptionUpdate, {
          onConflict: 'stripe_subscription_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('❌ Failed to update subscription:', upsertError);
      } else {
        console.log('✅ Successfully synced subscription to database');
      }
    }

    console.log('\n🎉 Sync completed!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Get user ID from command line arguments or use default
const userId = process.argv[2] || '2d406279-0cb0-4ec6-8f67-75becb08612e';

console.log('🚀 Starting subscription sync...\n');
syncSubscriptionFromStripe(userId)
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
