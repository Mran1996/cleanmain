import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function GET(req: NextRequest) {
  try {
    // Get user from Supabase auth
  const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    // Try to get Stripe customer ID from user metadata or profile
    let stripeCustomerId = null;
    if (user.user_metadata && user.user_metadata.stripeCustomerId) {
      stripeCustomerId = user.user_metadata.stripeCustomerId;
    }
    if (!stripeCustomerId) {
      // Try to fetch from profiles table if not in metadata
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripeCustomerId')
        .eq('id', user.id)
        .single();
      if (profile && profile.stripeCustomerId) {
        stripeCustomerId = profile.stripeCustomerId;
      }
    }
    if (!stripeCustomerId) {
      return NextResponse.json({ error: "No Stripe customer ID found." }, { status: 401 });
    }

    // Fetch subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      limit: 1,
    });
    const subscription = subscriptions.data[0] || null;

    // Fetch payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
    });

    // Fetch invoices
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 10,
    });

    return NextResponse.json({
      subscription,
      paymentMethods: paymentMethods.data,
      invoices: invoices.data,
    });
  } catch (error) {
    console.error('[STRIPE BILLING API ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch billing data.' }, { status: 500 });
  }
}
