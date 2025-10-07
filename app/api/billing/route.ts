import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { BillingData, StripeSubscription, StripePlan, StripePaymentMethod, StripeInvoice } from '@/types/billing';
import { getServerUser } from '@/utils/server-auth';
import { createClient } from '@/utils/supabase/server';

// Initialize Stripe client with error handling
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
}) : null;

export async function GET(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    // Get user from server-side auth
    const { user, error: authError, isAuthenticated } = await getServerUser();
    
    if (!isAuthenticated || !user) {
      return NextResponse.json({ 
        error: "Not authenticated",
        details: authError 
      }, { status: 401 });
    }

    // Create Supabase client for database operations
    const supabase = await createClient();
    
    // Look for existing Stripe customer by email or from Supabase user record
    let customerId: string | undefined;
    let customerData: Stripe.Customer | undefined;

    // First, check if user already has a stripe_customer_id in Supabase
    const { data: userData, error: userError } = await supabase
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
          await supabase
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
          await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email,
              stripe_customer_id: customerId,
              updated_at: new Date().toISOString()
            });
          console.log('💾 Updated Supabase with found customer ID');
        } else {
          console.log('📝 No existing customer found');
        }
      } catch (error) {
        console.error('❌ Error searching for existing customer:', error);
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: "No Stripe customer ID found." }, { status: 401 });
    }

    const stripeCustomerId = customerId;

    // Initialize billing data with safe defaults
    const billingData: BillingData = {
      subscription: undefined,
      paymentMethods: [],
      invoices: []
    };

    try {
      // First, get the subscription list to find the subscription ID
      const subscriptionsList = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'all',
        limit: 1
      });
      
      let subscriptions = subscriptionsList;
      
      // If we found a subscription, retrieve it individually for complete data
      if (subscriptionsList.data.length > 0) {
        const subId = subscriptionsList.data[0].id;
        console.log('🔍 Retrieving full subscription data for:', subId);
        
        try {
          const fullSubscription = await stripe.subscriptions.retrieve(subId, {
            expand: ['default_payment_method', 'latest_invoice', 'items.data.price']
          });
          
          // Replace the list data with the full subscription data
          subscriptions = {
            ...subscriptionsList,
            data: [fullSubscription]
          };
          
          console.log('✅ Retrieved full subscription data');
        } catch (retrieveError) {
          console.error('❌ Error retrieving full subscription:', retrieveError);
          // Fall back to the list data
        }
      }
      
      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0];
        const safeStatus = (status: string): StripeSubscription['status'] => {
          const validStatuses: StripeSubscription['status'][] = [
            'active', 'canceled', 'incomplete', 'incomplete_expired', 
            'past_due', 'trialing', 'unpaid'
          ];
          return validStatuses.includes(status as any) ? 
            status as StripeSubscription['status'] : undefined;
        };

        // Log raw subscription data from Stripe
        console.log('🔍 Raw Stripe subscription data:', {
          id: sub.id,
          status: sub.status,
          current_period_start: (sub as any).current_period_start,
          current_period_end: (sub as any).current_period_end,
          created: (sub as any).created,
          canceled_at: (sub as any).canceled_at,
          cancel_at_period_end: sub.cancel_at_period_end,
          billing_cycle_anchor: (sub as any).billing_cycle_anchor,
          start_date: (sub as any).start_date,
          trial_end: (sub as any).trial_end,
          trial_start: (sub as any).trial_start
        });
        
        // Log the entire subscription object to see all available properties
        console.log('🔍 Full Stripe subscription object keys:', Object.keys(sub));
        console.log('🔍 Full Stripe subscription object:', JSON.stringify(sub, null, 2));

        // Safe subscription mapping - directly access properties with fallbacks
        let currentPeriodStart = (sub as any).current_period_start;
        let currentPeriodEnd = (sub as any).current_period_end;
        
        // If current_period_end is missing, try to calculate it from other fields
        if (!currentPeriodEnd && (sub as any).created) {
          const createdDate = (sub as any).created;
          const now = Math.floor(Date.now() / 1000);
          
          // Get billing interval from the subscription items
          const interval = sub.items?.data?.[0]?.price?.recurring?.interval || 'month';
          const intervalCount = sub.items?.data?.[0]?.price?.recurring?.interval_count || 1;
          
          console.log('🔧 Calculating period dates from created date:', {
            created: createdDate,
            interval,
            intervalCount,
            now
          });
          
          // Calculate periods since creation
          let periodLength: number;
          switch (interval) {
            case 'day':
              periodLength = 24 * 60 * 60 * intervalCount;
              break;
            case 'week':
              periodLength = 7 * 24 * 60 * 60 * intervalCount;
              break;
            case 'month':
              periodLength = 30 * 24 * 60 * 60 * intervalCount; // Approximate
              break;
            case 'year':
              periodLength = 365 * 24 * 60 * 60 * intervalCount; // Approximate
              break;
            default:
              periodLength = 30 * 24 * 60 * 60; // Default to monthly
          }
          
          // Calculate current period
          const periodsSinceCreation = Math.floor((now - createdDate) / periodLength);
          currentPeriodStart = createdDate + (periodsSinceCreation * periodLength);
          currentPeriodEnd = createdDate + ((periodsSinceCreation + 1) * periodLength);
          
          console.log('🔧 Calculated period dates:', {
            currentPeriodStart,
            currentPeriodEnd,
            periodsSinceCreation
          });
        }

        const safeSubscription: StripeSubscription = {
          id: sub.id,
          status: safeStatus(sub.status),
          current_period_start: currentPeriodStart || undefined,
          current_period_end: currentPeriodEnd || undefined,
          cancel_at_period_end: sub.cancel_at_period_end || false,
          created: (sub as any).created || undefined,
          canceled_at: (sub as any).canceled_at || undefined
        };
        
        console.log('📊 Processed subscription data being sent:', {
          id: safeSubscription.id,
          status: safeSubscription.status,
          current_period_start: safeSubscription.current_period_start,
          current_period_end: safeSubscription.current_period_end,
          created: safeSubscription.created,
          canceled_at: safeSubscription.canceled_at,
          cancel_at_period_end: safeSubscription.cancel_at_period_end
        });

        // Only add items if they exist
        if (sub.items && sub.items.data && sub.items.data.length > 0) {
          safeSubscription.items = {
            data: sub.items.data.map(item => {
              // Safe plan mapping
              const plan: StripePlan = {};
              if (item.plan) {
                if (item.plan.id) plan.id = item.plan.id;
                if (item.plan.nickname) plan.nickname = item.plan.nickname;
                if (item.plan.amount) plan.amount = item.plan.amount;
                if (item.plan.interval) plan.interval = item.plan.interval as StripePlan['interval'];
                if (item.plan.currency) plan.currency = item.plan.currency;
              }
              
              return {
                id: item.id,
                plan
              };
            })
          };
        }
        
        billingData.subscription = safeSubscription;
      }

      // Fetch payment methods with safe mapping
      const paymentMethodsResponse = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card',
      });

      billingData.paymentMethods = paymentMethodsResponse.data.map(pm => {
        const safePaymentMethod: StripePaymentMethod = {
          id: pm.id,
          card: {
            brand: pm.card?.brand || 'unknown',
            last4: pm.card?.last4 || '****',
            exp_month: pm.card?.exp_month || 0,
            exp_year: pm.card?.exp_year || 0
          }
        };
        return safePaymentMethod;
      });

      // Fetch invoices with safe mapping
      const invoicesResponse = await stripe.invoices.list({
        customer: stripeCustomerId,
        limit: 10,
      });

      billingData.invoices = invoicesResponse.data.map(inv => {
        const safeInvoice: StripeInvoice = {
          id: inv.id || `invoice-${Date.now()}`, // Ensure id is never undefined
          created: inv.created || 0,
          amount_paid: inv.amount_paid || 0,
          status: inv.status || 'unknown'
        };
        
        // Add optional fields only if they exist
        if (inv.number) safeInvoice.number = inv.number;
        if (inv.invoice_pdf) safeInvoice.invoice_pdf = inv.invoice_pdf;
        if (inv.hosted_invoice_url) safeInvoice.hosted_invoice_url = inv.hosted_invoice_url;
        if (inv.currency) safeInvoice.currency = inv.currency;
        if (inv.customer_email) safeInvoice.customer_email = inv.customer_email;
        
        return safeInvoice;
      });
    } catch (stripeError) {
      console.error('[STRIPE API ERROR]', stripeError);
      // Continue with empty billing data rather than failing the request
    }

    // Cache the response for 5 minutes (300 seconds)
    return NextResponse.json(billingData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error: any) {
    console.error('[STRIPE BILLING API ERROR]', error);
    
    // Handle specific cookie parsing errors
    if (error?.message?.includes('Failed to parse cookie string')) {
      return NextResponse.json({ 
        error: 'Authentication data corrupted. Please log out and log in again.',
        code: 'COOKIE_PARSE_ERROR'
      }, { status: 401 });
    }
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to fetch billing data';
    
    return NextResponse.json({ 
      error: errorMessage,
      timestamp: new Date().toISOString(),
      path: '/api/billing'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  }
}
