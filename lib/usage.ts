import { createClient } from '@/utils/supabase/server';

export const MONTHLY_DOC_LIMIT = 150;
export const ONE_TIME_DOC_LIMIT = 150;

type SupabaseClientLike = any;

async function getClient(): Promise<SupabaseClientLike> {
  return await createClient();
}

export async function ensureUsageRecord(client: SupabaseClientLike, userId: string) {
  const { data: existing } = await client
    .from('document_usage')
    .select('*')
    .eq('user_id', userId)
    .limit(1);

  if (existing && existing.length > 0) return existing[0];

  const { data, error } = await client
    .from('document_usage')
    .insert({
      user_id: userId,
      monthly_limit: MONTHLY_DOC_LIMIT,
      monthly_remaining: 0,
      one_time_limit_per_purchase: ONE_TIME_DOC_LIMIT,
      one_time_remaining: 0,
      api_generated_total: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .limit(1);

  if (error) throw new Error(`Failed to create usage record: ${error.message}`);
  return data?.[0];
}

export async function creditOneTime(client: SupabaseClientLike, userId: string, units = ONE_TIME_DOC_LIMIT) {
  await ensureUsageRecord(client, userId);
  const { data, error: selErr } = await client
    .from('document_usage')
    .select('one_time_remaining')
    .eq('user_id', userId)
    .single();
  if (selErr) throw new Error(`Failed to read one-time units: ${selErr.message}`);
  const current = data?.one_time_remaining || 0;
  const { error: updErr } = await client
    .from('document_usage')
    .update({ one_time_remaining: current + units, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (updErr) throw new Error(`Failed to credit one-time units: ${updErr.message}`);
}

export async function resetMonthly(client: SupabaseClientLike, userId: string, limit = MONTHLY_DOC_LIMIT, periodStart?: Date, periodEnd?: Date) {
  await ensureUsageRecord(client, userId);
  const update: any = {
    monthly_limit: limit,
    monthly_remaining: limit,
    updated_at: new Date().toISOString(),
  };
  if (periodStart) update.monthly_period_start = periodStart.toISOString();
  if (periodEnd) update.monthly_period_end = periodEnd.toISOString();

  const { error } = await client
    .from('document_usage')
    .update(update)
    .eq('user_id', userId);
  if (error) throw new Error(`Failed to reset monthly credits: ${error.message}`);
}

export async function consumeCredit(client: SupabaseClientLike, userId: string): Promise<{ ok: boolean; source?: 'subscription' | 'one_time'; remaining?: number }> {
  await ensureUsageRecord(client, userId);

  // Try subscription credits first
  const { data: subActive } = await client
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1);

  const isSubActive = Array.isArray(subActive) && subActive[0] && ['active', 'trialing'].includes(subActive[0].status);

  if (isSubActive) {
    const { data } = await client
      .from('document_usage')
      .select('monthly_remaining')
      .eq('user_id', userId)
      .single();

    const remaining = data?.monthly_remaining || 0;
    if (remaining > 0) {
      const { error } = await client
        .from('document_usage')
        .update({ monthly_remaining: remaining - 1, api_generated_total: (data?.api_generated_total || 0) + 1, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      if (!error) return { ok: true, source: 'subscription', remaining: remaining - 1 };
    }
  }

  // Fallback to one-time credits
  const { data: one } = await client
    .from('document_usage')
    .select('one_time_remaining, api_generated_total')
    .eq('user_id', userId)
    .single();
  const oneRemain = one?.one_time_remaining || 0;
  if (oneRemain > 0) {
    const { error } = await client
      .from('document_usage')
      .update({ one_time_remaining: oneRemain - 1, api_generated_total: (one?.api_generated_total || 0) + 1, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (!error) return { ok: true, source: 'one_time', remaining: oneRemain - 1 };
  }

  return { ok: false };
}

export async function getUsageForUser(userId: string, client?: SupabaseClientLike) {
  const supabase = client ?? (await getClient());
  await ensureUsageRecord(supabase, userId);
  const { data, error } = await supabase
    .from('document_usage')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}