import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { getServerUser } from '@/utils/server-auth';
import { getUsageForUser, ONE_TIME_DOC_LIMIT } from '@/lib/usage';

export async function GET(req: NextRequest) {
  try {
    const { user, isAuthenticated, error: authError } = await getServerUser();
    if (!isAuthenticated || !user) {
      return NextResponse.json({ error: 'Not authenticated', details: authError }, { status: 401 });
    }

    const supabaseAdmin = await createAdminClient();
    const usage = await getUsageForUser(user.id, supabaseAdmin);

    return NextResponse.json({
      userId: user.id,
      usage: {
        one_time_limit_per_purchase: usage.one_time_limit_per_purchase ?? ONE_TIME_DOC_LIMIT,
        one_time_remaining: usage.one_time_remaining ?? 0,
        api_generated_total: usage.api_generated_total ?? 0,
        updated_at: usage.updated_at,
      }
    });
  } catch (error: any) {
    console.error('One-time usage error:', error);
    return NextResponse.json({ error: 'Failed to retrieve one-time usage', details: error.message }, { status: 500 });
  }
}