import { NextResponse } from "next/server";
import Stripe from "stripe";

// Test Stripe configuration
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
}) : null;

export async function GET() {
  try {
    if (!stripe) {
      return NextResponse.json({ 
        error: 'Stripe not configured',
        secretKey: process.env.STRIPE_SECRET_KEY ? 'Present' : 'Missing',
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Present' : 'Missing'
      });
    }

    // Test Stripe connection
    const account = await stripe.accounts.retrieve();
    
    return NextResponse.json({
      success: true,
      mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'LIVE' : 'TEST',
      accountId: account.id,
      country: account.country,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      secretKey: process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...',
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 8) + '...',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Stripe connection failed',
      message: error.message,
      secretKey: process.env.STRIPE_SECRET_KEY ? 'Present' : 'Missing',
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Present' : 'Missing'
    });
  }
}
