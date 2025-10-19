import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { getServerUser } from '@/utils/server-auth';
import { getUsageForUser, verifyAndCorrectUsage, MONTHLY_DOC_LIMIT, ONE_TIME_DOC_LIMIT } from '@/lib/usage';

export async function GET(req: NextRequest) {
  try {
    const { user, isAuthenticated, error: authError } = await getServerUser();
    if (!isAuthenticated || !user) {
      return NextResponse.json({ error: 'Not authenticated', details: authError }, { status: 401 });
    }

    const supabaseAdmin = await createAdminClient();
    
    // ⭐ AUTO-VERIFY AND CORRECT: Check if credits match actual payments
    const verification = await verifyAndCorrectUsage(supabaseAdmin, user.id);
    if (verification.corrected) {
      console.log('🔧 Auto-corrected usage for user:', user.id);
      console.log('🔧 Changes applied:', verification.changes);
    }
    
    // ⭐ Get usage record from Supabase (now corrected if needed)
    const usage = await getUsageForUser(user.id, supabaseAdmin);

    // ⭐ Get ACTIVE subscription from Supabase (synced by webhooks)
    const { data: subRows } = await supabaseAdmin
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing']) // ⭐ Only get active/trialing subscriptions
      .order('updated_at', { ascending: false })
      .limit(1);
    const activeSub = Array.isArray(subRows) && subRows.length > 0 ? subRows[0] : null;

    // ⭐ Count paid one-time transactions from Supabase (synced by webhooks)
    const { data: oneTimeTxs } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('transaction_type', 'one_time')
      .eq('status', 'paid')
      .eq('is_renewal', false);
    
    const oneTimePurchaseCount = oneTimeTxs?.length || 0;
    const oneTimeTotalGranted = oneTimePurchaseCount * ONE_TIME_DOC_LIMIT; // Total credits ever granted
    const oneTimeRemaining = usage.one_time_remaining ?? 0;
    const oneTimeUsed = Math.max(0, oneTimeTotalGranted - oneTimeRemaining); // Calculate used

    // ✨ IMPORTANT LOGIC:
    // - If NO active subscription → monthly_remaining should be 0
    // - If active subscription exists → use value from document_usage (synced by webhook)
    const hasActiveSubscription = activeSub !== null;
    const monthlyLimit = hasActiveSubscription ? (usage.monthly_limit ?? MONTHLY_DOC_LIMIT) : 0;
    const monthlyRemaining = hasActiveSubscription ? (usage.monthly_remaining ?? 0) : 0;
    const monthlyUsed = hasActiveSubscription ? Math.max(0, monthlyLimit - monthlyRemaining) : 0;

    console.log('📊 Usage API Response:', {
      user_id: user.id,
      has_active_sub: hasActiveSubscription,
      sub_status: activeSub?.status || 'none',
      monthly_remaining: monthlyRemaining,
      one_time_remaining: oneTimeRemaining,
      one_time_purchase_count: oneTimePurchaseCount
    });

    return NextResponse.json({
      userId: user.id,
      subscription: {
        status: activeSub?.status || 'inactive',
        current_period_end: activeSub?.current_period_end || null,
      },
      usage: {
        // ⭐ Monthly credits (only if active subscription)
        monthly_limit: monthlyLimit,
        monthly_remaining: monthlyRemaining,
        monthly_used: monthlyUsed,
        monthly_period_start: hasActiveSubscription ? (usage.monthly_period_start || null) : null,
        monthly_period_end: hasActiveSubscription ? (usage.monthly_period_end || null) : null,
        
        // ⭐ One-time credits (from transactions table)
        one_time_limit_per_purchase: ONE_TIME_DOC_LIMIT,
        one_time_remaining: oneTimeRemaining,
        one_time_total_granted: oneTimeTotalGranted,
        one_time_used: oneTimeUsed,
        one_time_purchase_count: oneTimePurchaseCount,
        
        // ⭐ Total stats
        api_generated_total: usage.api_generated_total ?? 0,
        updated_at: usage.updated_at,
      }
    });
  } catch (error: any) {
    console.error('❌ Usage stats error:', error);
    return NextResponse.json({ error: 'Failed to retrieve usage stats', details: error.message }, { status: 500 });
  }
}