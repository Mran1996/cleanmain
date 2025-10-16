import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { getServerUser } from '@/utils/server-auth';
import { getUsageForUser, MONTHLY_DOC_LIMIT, ONE_TIME_DOC_LIMIT } from '@/lib/usage';

export async function GET(req: NextRequest) {
  try {
    const { user, isAuthenticated, error: authError } = await getServerUser();
    if (!isAuthenticated || !user) {
      return NextResponse.json({ error: 'Not authenticated', details: authError }, { status: 401 });
    }

    const supabaseAdmin = await createAdminClient();
    const usage = await getUsageForUser(user.id, supabaseAdmin);

    // Get subscription status
    const { data: subRows } = await supabaseAdmin
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);
    const sub = Array.isArray(subRows) ? subRows[0] : null;

    return NextResponse.json({
      userId: user.id,
      subscription: {
        status: sub?.status || 'inactive',
        current_period_end: sub?.current_period_end || null,
      },
      usage: {
        monthly_limit: usage.monthly_limit ?? MONTHLY_DOC_LIMIT,
        monthly_remaining: usage.monthly_remaining ?? 0,
        one_time_limit_per_purchase: usage.one_time_limit_per_purchase ?? ONE_TIME_DOC_LIMIT,
        one_time_remaining: usage.one_time_remaining ?? 0,
        api_generated_total: usage.api_generated_total ?? 0,
        monthly_period_start: usage.monthly_period_start || null,
        monthly_period_end: usage.monthly_period_end || null,
        updated_at: usage.updated_at,
      }
    });
  } catch (error: any) {
    console.error('Usage stats error:', error);
    return NextResponse.json({ error: 'Failed to retrieve usage stats', details: error.message }, { status: 500 });
  }
}