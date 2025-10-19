import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { getServerUser } from '@/utils/server-auth';
import { verifyAndCorrectUsage, MONTHLY_DOC_LIMIT, ONE_TIME_DOC_LIMIT } from '@/lib/usage';

/**
 * Credit Verification & Auto-Correction API
 * 
 * This endpoint verifies that a user's credits match their subscription and transaction history.
 * It uses intelligent period-based tracking to only count documents generated during the current
 * subscription period for monthly credits.
 * 
 * Automatically corrects:
 * 1. Monthly credits based on active subscription and period usage
 * 2. One-time credits based on paid transactions
 * 3. Period dates from subscription
 * 
 * Usage: GET /api/credits/verify
 * Response: Credit summary with any corrections applied
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const { user, isAuthenticated, error: authError } = await getServerUser();
    if (!isAuthenticated || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated', 
        details: authError 
      }, { status: 401 });
    }

    const supabaseAdmin = await createAdminClient();
    const userId = user.id;

    console.log('🔍 Starting intelligent credit verification for user:', userId);

    // ⭐ USE SMART VERIFICATION: Counts documents only in current period
    const verification = await verifyAndCorrectUsage(supabaseAdmin, userId);
    
    console.log('📊 Verification result:', {
      corrected: verification.corrected,
      changes: verification.changes
    });

    // Fetch final state after corrections
    const { data: finalUsage } = await supabaseAdmin
      .from('document_usage')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get subscription info
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1);

    const hasActiveSubscription = subscriptions && subscriptions.length > 0;
    const subscription = hasActiveSubscription ? subscriptions[0] : null;

    // Get one-time transactions
    const { data: oneTimeTxs } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('transaction_type', 'one_time')
      .eq('status', 'paid')
      .eq('is_renewal', false);

    const oneTimePurchaseCount = oneTimeTxs ? oneTimeTxs.length : 0;

    console.log('💳 Current state:', {
      has_subscription: hasActiveSubscription,
      subscription_status: subscription?.status || 'none',
      monthly_credits: finalUsage?.monthly_remaining || 0,
      one_time_credits: finalUsage?.one_time_remaining || 0,
      one_time_purchases: oneTimePurchaseCount
    });

    const finalMonthly = finalUsage?.monthly_remaining || 0;
    const finalOneTime = finalUsage?.one_time_remaining || 0;
    const totalAvailable = finalMonthly + finalOneTime;

    const response = {
      success: true,
      userId,
      verification: {
        timestamp: new Date().toISOString(),
        corrections_applied: verification.corrected,
        changes: verification.changes,
        method: 'intelligent_period_tracking'
      },
      subscription: {
        has_active: hasActiveSubscription,
        status: subscription?.status || 'none',
        current_period_start: subscription?.current_period_start || null,
        current_period_end: subscription?.current_period_end || null
      },
      one_time_purchases: {
        count: oneTimePurchaseCount,
        transactions: oneTimeTxs?.map(t => ({
          date: t.transaction_date,
          amount: t.amount,
          description: t.description
        })) || []
      },
      credits: {
        monthly: {
          limit: finalUsage?.monthly_limit || 0,
          remaining: finalMonthly,
          period_start: finalUsage?.monthly_period_start || null,
          period_end: finalUsage?.monthly_period_end || null
        },
        one_time: {
          remaining: finalOneTime,
          from_purchases: oneTimePurchaseCount
        },
        total_available: totalAvailable,
        api_generated_total: finalUsage?.api_generated_total || 0
      }
    };

    console.log('✅ Intelligent credit verification complete');

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Credit verification error:', error);
    return NextResponse.json({ 
      error: 'Credit verification failed', 
      details: error.message 
    }, { status: 500 });
  }
}
