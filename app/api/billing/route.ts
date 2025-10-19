import { NextRequest, NextResponse } from 'next/server';
import { BillingData, StripeSubscription, StripeInvoice } from '@/types/billing';
import { getServerUser } from '@/utils/server-auth';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
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
    
    console.log('🎯 Fetching billing data from Supabase only for user:', user.email);

    // Initialize billing data with safe defaults
    const billingData: BillingData = {
      subscription: undefined,
      paymentMethods: [],
      invoices: []
    };

    try {
      // 🎯 STEP 1: Fetch subscription from Supabase
      console.log('🔍 Fetching subscription from Supabase for user:', user.id);
      const { data: supabaseSubscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (subError) {
        console.error('❌ Error fetching subscription from Supabase:', subError);
      } else if (supabaseSubscriptions && supabaseSubscriptions.length > 0) {
        const sub = supabaseSubscriptions[0];
        console.log('✅ Found subscription in Supabase:', {
          id: sub.stripe_subscription_id,
          status: sub.status,
          plan_id: sub.plan_id,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end
        });

        const safeStatus = (status: string): StripeSubscription['status'] => {
          const validStatuses: StripeSubscription['status'][] = [
            'active', 'canceled', 'incomplete', 'incomplete_expired', 
            'past_due', 'trialing', 'unpaid'
          ];
          return validStatuses.includes(status as any) ? 
            status as StripeSubscription['status'] : undefined;
        };

        // Convert timestamps to Unix format (seconds)
        const toUnix = (dateStr: string | null): number | undefined => {
          if (!dateStr) return undefined;
          return Math.floor(new Date(dateStr).getTime() / 1000);
        };

        billingData.subscription = {
          id: sub.stripe_subscription_id,
          status: safeStatus(sub.status),
          current_period_start: toUnix(sub.current_period_start),
          current_period_end: toUnix(sub.current_period_end),
          cancel_at_period_end: sub.cancel_at_period_end || false,
          created: toUnix(sub.created_at),
          canceled_at: toUnix(sub.canceled_at),
          items: sub.plan_id ? {
            data: [{
              id: sub.plan_id,
              plan: {
                id: sub.plan_id
              }
            }]
          } : undefined
        };

        console.log('✅ Subscription data from Supabase prepared');
      } else {
        console.log('ℹ️ No subscription found in Supabase, user has not subscribed');
      }

      // 🎯 STEP 2: Fetch ONLY the latest transaction from Supabase (limit 1)
      console.log('🔍 Fetching ONLY latest transaction from Supabase for user:', user.id);
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(1); // ⭐ ONLY fetch the latest transaction

      if (txError) {
        console.error('❌ Error fetching transactions from Supabase:', txError);
      } else if (transactions && transactions.length > 0) {
        console.log(`✅ Found latest transaction in Supabase`);
        
        billingData.invoices = transactions.map(tx => {
          const toUnix = (dateStr: string | null): number => {
            if (!dateStr) return Math.floor(Date.now() / 1000);
            return Math.floor(new Date(dateStr).getTime() / 1000);
          };

          const safeInvoice: StripeInvoice = {
            id: tx.stripe_invoice_id || tx.id,
            created: toUnix(tx.transaction_date),
            amount_paid: tx.amount || 0,
            status: tx.status === 'paid' ? 'paid' : tx.status === 'failed' ? 'open' : 'draft',
            currency: tx.currency || 'usd',
            number: tx.stripe_invoice_id ? `INV-${tx.stripe_invoice_id.substring(0, 8)}` : undefined
          };
          
          return safeInvoice;
        });
      } else {
        console.log('ℹ️ No transactions found in Supabase');
      }

      // ✅ REMOVED: No more Stripe API calls for payment methods
      console.log('✅ Billing data fetch complete (Supabase only)');
    } catch (error) {
      console.error('[BILLING DATA ERROR]', error);
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
