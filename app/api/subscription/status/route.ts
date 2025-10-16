import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { getServerUser } from '@/utils/server-auth';

export async function GET(req: NextRequest) {
  try {
    const { user, isAuthenticated, error: authError } = await getServerUser();
    if (!isAuthenticated || !user) {
      return NextResponse.json({ error: 'Not authenticated', details: authError }, { status: 401 });
    }

    const supabaseAdmin = await createAdminClient();
    const { data: subRows, error } = await supabaseAdmin
      .from('subscriptions')
      .select('status, plan_id, current_period_end, current_period_start, cancel_at_period_end, canceled_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (error) throw error;

    const sub = Array.isArray(subRows) ? subRows[0] : null;
    const status = sub?.status || 'inactive';

    return NextResponse.json({
      userId: user.id,
      subscription: sub ? {
        status,
        plan_id: sub.plan_id || null,
        current_period_start: sub.current_period_start || null,
        current_period_end: sub.current_period_end || null,
        cancel_at_period_end: sub.cancel_at_period_end ?? null,
        canceled_at: sub.canceled_at || null,
      } : null
    });
  } catch (error: any) {
    console.error('Subscription status error:', error);
    return NextResponse.json({ error: 'Failed to retrieve subscription status', details: error.message }, { status: 500 });
  }
}