import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from "next/headers";
import { BillingData, StripeSubscription, StripePlan, StripePaymentMethod, StripeInvoice } from '@/types/billing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function GET(req: NextRequest) {
  try {
    // Get user from Supabase auth - using route handler client
    const supabase = createRouteHandlerClient({ cookies });

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

    // Initialize billing data with safe defaults
    const billingData: BillingData = {
      subscription: undefined,
      paymentMethods: [],
      invoices: []
    };

    try {
      // Fetch subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'all',
        limit: 1,
      });
      
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

        // Safe subscription mapping - handling Stripe type differences
        const safeSubscription: StripeSubscription = {
          id: sub.id,
          status: safeStatus(sub.status)
        };
        
        // Handle Stripe type differences by checking if properties exist
        if ('current_period_start' in sub) {
          safeSubscription.current_period_start = (sub as any).current_period_start;
        }
        
        if ('current_period_end' in sub) {
          safeSubscription.current_period_end = (sub as any).current_period_end;
        }
        
        if ('cancel_at_period_end' in sub) {
          safeSubscription.cancel_at_period_end = sub.cancel_at_period_end;
        }

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
  } catch (error) {
    console.error('[STRIPE BILLING API ERROR]', error);
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
