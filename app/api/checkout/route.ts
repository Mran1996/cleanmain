import Stripe from 'stripe';

// Always initialize Stripe client if secret key is present
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
}) : null;
import { NextResponse } from 'next/server';
import { PRICE_MAP, PRODUCTS } from '@/lib/stripe-config';
import { createClient, createAdminClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    // Check for Stripe client
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe client not available. Please check STRIPE_SECRET_KEY.' },
        { status: 503 }
      );
    }

    const { plan } = await req.json();

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400 }
      );
    }

    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('💳 Creating checkout for user:', user.email);

    // Admin client for DB sync operations (bypass RLS)
    const supabaseAdmin = await createAdminClient();

    // Resolve price ID from the PRICE_MAP using the provided plan, then fall back to
    // any known single-price env vars (your env uses STRIPE_PREMIUM_MONTHLY_PRICE_ID).
    // This avoids checkout failing when the exact env name expected by older code
    // isn't present.
  const priceId = PRICE_MAP[plan as keyof typeof PRICE_MAP];
    console.log('💳 Resolved price ID:', priceId)
    // Stripe debug log for runtime diagnosis
    console.log('[STRIPE DEBUG]', {
      stripeKey: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.slice(0,8) + '...' : 'undefined',
      priceId,
      env: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
    });

    // Debug log: print Stripe key and price ID (redacted)
    console.log('[STRIPE DEBUG]', {
      stripeKey: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.slice(0,8) + '...' : 'undefined',
      priceId,
      env: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
    });

    // Validate priceId format
    if (!priceId || !/^price_/.test(priceId)) {
      return NextResponse.json(
        { error: 'Stripe price ID is missing or invalid. Please use a valid price ID (starts with price_...).' },
        { status: 400 }
      );
    }

    // Look for existing Stripe customer by email or from Supabase user record
    let customerId: string | undefined;
    let customerData: Stripe.Customer | undefined;

    // First, check if user already has a stripe_customer_id in Supabase
    const supabaseForCustomer = await createClient();
    const { data: userData, error: userError } = await supabaseForCustomer
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userData?.stripe_customer_id) {
      try {
        console.log('🔍 Found Stripe customer ID in Supabase:', userData.stripe_customer_id);
        customerData = await stripe.customers.retrieve(userData.stripe_customer_id) as Stripe.Customer;
        customerId = customerData.id;
        console.log('✅ Verified existing Stripe customer:', customerId);
      } catch (error) {
        console.error('❌ Error retrieving customer from Stripe:', error);
        
        // Check if it's a test/live mode mismatch or invalid customer
        if (error instanceof Error && error.message.includes('similar object exists in test mode')) {
          console.log('🔄 Test/Live mode mismatch detected, clearing invalid customer ID');
        } else if (error instanceof Error && error.message.includes('No such customer')) {
          console.log('🔄 Invalid customer ID detected, clearing from database');
        }
        
        // Clear the invalid customer ID from Supabase
        try {
          await supabaseForCustomer
            .from('users')
            .update({ 
              stripe_customer_id: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          console.log('🧹 Cleared invalid customer ID from Supabase');
        } catch (updateError) {
          console.error('❌ Error clearing invalid customer ID:', updateError);
        }
        
        // Customer ID in Supabase is invalid, we'll search by email below
      }
    }

    // If no valid customer found, search by email
    if (!customerId) {
      try {
        console.log('🔍 Searching for existing Stripe customer with email:', user.email);
        
        const existingCustomers = await stripe.customers.list({
          email: user.email,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          customerData = existingCustomers.data[0];
          customerId = customerData.id;
          console.log('✅ Found existing Stripe customer by email:', customerId);
          
          // Update Supabase with the found customer ID
          await supabaseForCustomer
            .from('users')
            .upsert({
              id: user.id,
              email: user.email,
              stripe_customer_id: customerId,
              updated_at: new Date().toISOString()
            });
          console.log('💾 Updated Supabase with found customer ID');
        } else {
          console.log('📝 No existing customer found, will create new one');
        }
      } catch (error) {
        console.error('❌ Error searching for existing customer:', error);
        // Continue without existing customer - we'll create a new one
      }
    }

    // If still no customer found, create a new one
    if (!customerId) {
      try {
        console.log('🆕 Creating new Stripe customer for:', user.email);
        customerData = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id,
            created_from: 'checkout_api'
          }
        });
        customerId = customerData.id;
        console.log('✅ Created new Stripe customer:', customerId);

        // Save the new customer ID to Supabase
        await supabaseForCustomer
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            stripe_customer_id: customerId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        console.log('💾 Saved new customer ID to Supabase');
      } catch (error) {
        console.error('❌ Error creating new Stripe customer:', error);
        // Continue without customer - Stripe checkout will create one
      }
    }

    // Check for active subscriptions from Supabase (skip for one-time Full Service)
    const isSubscriptionPlan = plan !== PRODUCTS.FULL_SERVICE;
    if (isSubscriptionPlan) {
      try {
        console.log('🔍 Checking for active subscriptions in Supabase for user:', user.id);
        
        // Check for active subscription in Supabase database
        const { data: activeSubscriptions, error: subError } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .order('updated_at', { ascending: false });

        if (subError) {
          console.error('❌ Error checking subscriptions in Supabase:', subError);
          // Continue with checkout - don't block on database error
        } else if (activeSubscriptions && activeSubscriptions.length > 0) {
          const activeSubscription = activeSubscriptions[0];
          console.log('⚠️ Active subscription found in Supabase - blocking new checkout:', {
            id: activeSubscription.stripe_subscription_id,
            status: activeSubscription.status,
            plan_id: activeSubscription.plan_id,
            current_period_end: activeSubscription.current_period_end
          });

          let errorMessage = 'You already have an active subscription';
          if (activeSubscription.status === 'trialing') {
            errorMessage = 'You already have a trial subscription';
          }

          return NextResponse.json({
            error: errorMessage,
            details: {
              subscription_id: activeSubscription.stripe_subscription_id,
              status: activeSubscription.status,
              current_period_end: activeSubscription.current_period_end,
              plan_id: activeSubscription.plan_id,
              created_at: activeSubscription.created_at,
              updated_at: activeSubscription.updated_at
            }
          }, { status: 409 }); // 409 Conflict
        }

        console.log('✅ No active subscriptions found in Supabase, proceeding with checkout');
      } catch (error) {
        console.error('❌ Error checking active subscriptions:', error);
        // Continue with checkout - better to allow than block incorrectly
        console.log('⚠️ Continuing with checkout despite subscription check error');
      }
    } else {
      console.log('📄 One-time purchase detected (Full Service), skipping subscription check');
    }

    // Prepare checkout session configuration
    // Compute success/cancel URLs based on env or request origin
    const reqUrl = new URL(req.url);
    const origin = reqUrl.origin;
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
      || process.env.STRIPE_APP_URL?.replace(/\/$/, '') 
      || origin);
    const defaultSuccess = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancel = `${baseUrl}/payment/cancelled?session_id={CHECKOUT_SESSION_ID}`;
    const fullServiceSuccess = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: isSubscriptionPlan ? 'subscription' : 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: { 
        plan,
        user_id: user.id || '',
        user_email: user.email || ''
      },
      // Redirect logic: use intake success for one-time Full Service, generic success for subscriptions
      success_url: isSubscriptionPlan ? defaultSuccess : fullServiceSuccess,
      cancel_url: process.env.STRIPE_CANCEL_URL || defaultCancel,
    };

    // Use customer ID if we have one, otherwise pre-fill email
    if (customerId) {
      sessionConfig.customer = customerId;
      console.log('🎯 Using customer ID for checkout:', {
        customerId,
        email: customerData?.email || user.email,
        name: customerData?.name,
        phone: customerData?.phone,
      });
    } else {
      // Pre-fill customer email for new customers (Stripe will create customer during checkout)
      sessionConfig.customer_email = user.email;
      console.log('📧 Pre-filling email for new customer (Stripe will create):', user.email);
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
   
    console.error('Error in create-checkout:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}