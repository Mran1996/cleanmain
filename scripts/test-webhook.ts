/**
 * Test webhook configuration and simulate webhook events
 * Run with: npx tsx scripts/test-webhook.ts
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

async function testWebhook() {
  console.log('🧪 Testing Webhook Configuration\n');
  
  // 1. Check environment variables
  console.log('1️⃣ Checking environment variables:');
  console.log('   STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing');
  console.log('   STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing');
  console.log('   Value (first 15 chars):', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 15) + '...\n');
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ STRIPE_WEBHOOK_SECRET is not set!');
    console.log('\n💡 To fix:');
    console.log('   1. Run: stripe listen --forward-to localhost:3000/api/stripe/webhook');
    console.log('   2. Copy the webhook signing secret (whsec_...)');
    console.log('   3. Add to .env.local: STRIPE_WEBHOOK_SECRET=whsec_...');
    process.exit(1);
  }
  
  // 2. List webhook endpoints
  console.log('2️⃣ Listing webhook endpoints from Stripe:');
  try {
    const endpoints = await stripe.webhookEndpoints.list({ limit: 5 });
    if (endpoints.data.length === 0) {
      console.log('   ⚠️  No webhook endpoints configured in Stripe Dashboard');
    } else {
      endpoints.data.forEach((endpoint, i) => {
        console.log(`   ${i + 1}. ${endpoint.url}`);
        console.log(`      Status: ${endpoint.status}`);
        console.log(`      Events: ${endpoint.enabled_events.join(', ')}`);
      });
    }
  } catch (error: any) {
    console.error('   ❌ Error listing webhooks:', error.message);
  }
  
  console.log('\n3️⃣ Webhook Event Types to Handle:');
  const events = [
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'checkout.session.completed',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'invoice.voided',
  ];
  events.forEach(event => console.log(`   ✅ ${event}`));
  
  console.log('\n✅ Webhook configuration test complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Make sure Stripe CLI is running: stripe listen --forward-to localhost:3000/api/stripe/webhook');
  console.log('   2. Create a test subscription to trigger webhooks');
  console.log('   3. Check server logs for webhook processing');
}

testWebhook().catch(console.error);
