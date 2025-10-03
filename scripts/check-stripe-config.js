#!/usr/bin/env node

/**
 * Stripe Configuration Diagnostic Script
 * Run this to check your Stripe configuration across environments
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Stripe Configuration Diagnostic\n');

// Check environment
console.log('📋 Environment Information:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`VERCEL: ${process.env.VERCEL}`);
console.log(`VERCEL_ENV: ${process.env.VERCEL_ENV}`);
console.log(`VERCEL_URL: ${process.env.VERCEL_URL}`);

console.log('\n🔑 Stripe Keys:');
console.log(`STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 8) + '...' : 'NOT SET'}`);
console.log(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 8) + '...' : 'NOT SET'}`);

// Determine Stripe mode
const secretKey = process.env.STRIPE_SECRET_KEY;
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

console.log('\n🎯 Stripe Mode Detection:');
if (secretKey) {
  if (secretKey.startsWith('sk_live_')) {
    console.log('✅ LIVE MODE detected (Secret key starts with sk_live_)');
  } else if (secretKey.startsWith('sk_test_')) {
    console.log('🧪 TEST MODE detected (Secret key starts with sk_test_)');
  } else {
    console.log('❓ UNKNOWN MODE (Secret key format not recognized)');
  }
} else {
  console.log('❌ NO SECRET KEY found');
}

if (publishableKey) {
  if (publishableKey.startsWith('pk_live_')) {
    console.log('✅ LIVE MODE detected (Publishable key starts with pk_live_)');
  } else if (publishableKey.startsWith('pk_test_')) {
    console.log('🧪 TEST MODE detected (Publishable key starts with pk_test_)');
  } else {
    console.log('❓ UNKNOWN MODE (Publishable key format not recognized)');
  }
} else {
  console.log('❌ NO PUBLISHABLE KEY found');
}

// Check for mismatches
console.log('\n⚠️  Configuration Issues:');
if (secretKey && publishableKey) {
  const secretIsLive = secretKey.startsWith('sk_live_');
  const publishableIsLive = publishableKey.startsWith('pk_live_');
  
  if (secretIsLive !== publishableIsLive) {
    console.log('🚨 MISMATCH: Secret key and publishable key are in different modes!');
    console.log(`   Secret: ${secretIsLive ? 'LIVE' : 'TEST'}`);
    console.log(`   Publishable: ${publishableIsLive ? 'LIVE' : 'TEST'}`);
  } else {
    console.log('✅ Keys are in matching modes');
  }
}

// Environment-specific recommendations
console.log('\n💡 Recommendations:');
if (process.env.VERCEL) {
  console.log('🌐 Running on Vercel:');
  console.log('   1. Check Vercel Dashboard → Settings → Environment Variables');
  console.log('   2. Ensure STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY are set');
  console.log('   3. Make sure they match the mode you want (live vs test)');
} else {
  console.log('🏠 Running locally:');
  console.log('   1. Check your .env.local file');
  console.log('   2. Ensure keys are properly formatted');
}

console.log('\n✨ Diagnostic complete!');
