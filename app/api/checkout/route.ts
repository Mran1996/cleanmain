import Stripe from 'stripe';

// Always initialize Stripe client if secret key is present
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
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
  const priceId = PRICE_MAP[plan as keyof typeof PRICE_MAP] ||
      process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID ||
      process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID ||
      process.env.STRIPE_COURT_READY_PRICE_ID;

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

    // Check for active subscriptions directly from Stripe (skip for one-time Full Service)
    const isSubscriptionPlan = plan !== PRODUCTS.FULL_SERVICE;
    if (customerId && isSubscriptionPlan) {
      try {
        console.log('🔍 Checking for active subscriptions for customer:', customerId);
        
        // Check for any subscription that should prevent new purchases
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          limit: 10,
        });

        // Categorize subscriptions by status
        const activeSubscriptions = subscriptions.data.filter(sub => 
          ['active', 'trialing'].includes(sub.status)
        );
        const pastDueSubscriptions = subscriptions.data.filter(sub => 
          sub.status === 'past_due'
        );
        const canceledSubscriptions = subscriptions.data.filter(sub => 
          ['canceled', 'incomplete_expired'].includes(sub.status)
        );
        const incompleteSubscriptions = subscriptions.data.filter(sub => 
          sub.status === 'incomplete'
        );

        console.log('📊 Subscription status summary:', {
          active: activeSubscriptions.length,
          pastDue: pastDueSubscriptions.length,
          canceled: canceledSubscriptions.length,
          incomplete: incompleteSubscriptions.length
        });

        // Block only truly active subscriptions (active, trialing)
        if (activeSubscriptions.length > 0) {
          const activeSubscription = activeSubscriptions[0] as any;
          console.log('⚠️ Active subscription found - blocking new checkout:', {
            id: activeSubscription.id,
            status: activeSubscription.status
          });

          let errorMessage = 'You already have an active subscription';
          if (activeSubscription.status === 'trialing') {
            errorMessage = 'You already have a trial subscription';
          }

          // Attempt to sync subscription details into the database for consistency
          try {
            const planId = activeSubscription.items?.data?.[0]?.price?.id || null;
            const subUpdate = {
              user_id: user.id,
              stripe_subscription_id: activeSubscription.id,
              stripe_customer_id: customerId,
              status: activeSubscription.status,
              plan_id: planId,
              current_period_start: activeSubscription.current_period_start
                ? new Date(activeSubscription.current_period_start * 1000).toISOString()
                : null,
              current_period_end: activeSubscription.current_period_end
                ? new Date(activeSubscription.current_period_end * 1000).toISOString()
                : null,
              canceled_at: activeSubscription.canceled_at
                ? new Date(activeSubscription.canceled_at * 1000).toISOString()
                : null,
              cancel_at_period_end: !!activeSubscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            } as any;

            const { error: upsertError } = await supabaseAdmin
              .from('subscriptions')
              .upsert(subUpdate, { onConflict: 'stripe_subscription_id', ignoreDuplicates: false });

            if (upsertError) {
              console.warn('⚠️ Failed to upsert subscription during checkout pre-check:', upsertError);
            } else {
              console.log('✅ Synced active subscription to database via checkout pre-check');
            }
          } catch (syncErr) {
            console.warn('⚠️ Error syncing subscription to database:', syncErr);
          }

          return NextResponse.json({
            error: errorMessage,
            details: {
              subscription_id: activeSubscription.id,
              status: activeSubscription.status,
              current_period_end: activeSubscription.current_period_end 
                ? new Date(activeSubscription.current_period_end * 1000).toISOString()
                : null,
              plan_name: activeSubscription.items?.data?.[0]?.price?.nickname || 'Premium Plan'
            }
          }, { status: 409 }); // 409 Conflict
        }

        // Handle past due subscriptions - allow new subscription (reactivation)
        if (pastDueSubscriptions.length > 0) {
          console.log('💳 Past due subscription found - allowing reactivation via new subscription:', {
            pastDueCount: pastDueSubscriptions.length,
            ids: pastDueSubscriptions.map(sub => sub.id)
          });
          console.log('✅ Proceeding with new subscription to reactivate service');
        }

        // Handle canceled subscriptions - allow re-subscription
        if (canceledSubscriptions.length > 0) {
          console.log('🔄 Canceled subscription found - allowing re-subscription:', {
            canceledCount: canceledSubscriptions.length,
            ids: canceledSubscriptions.map(sub => sub.id)
          });
          console.log('✅ Proceeding with re-subscription for previously canceled customer');
        }

        // Handle incomplete subscriptions - allow new attempt
        if (incompleteSubscriptions.length > 0) {
          console.log('⏳ Incomplete subscription found - allowing new subscription attempt:', {
            incompleteCount: incompleteSubscriptions.length,
            ids: incompleteSubscriptions.map(sub => sub.id)
          });
          console.log('✅ Proceeding with new subscription attempt');
        }

        console.log('✅ No active subscriptions found, proceeding with checkout');
      } catch (error) {
        console.error('❌ Error checking active subscriptions:', error);
        // Continue with checkout - better to allow than block incorrectly
        console.log('⚠️ Continuing with checkout despite subscription check error');
      }
    } else {
      console.log('📝 No customer ID available, skipping subscription check (new customer)');
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