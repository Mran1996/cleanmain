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

export async function consumeCredit(client: SupabaseClientLike, userId: string, creditSource: string, creditsToUse: any): Promise<{ ok: boolean; source?: 'subscription' | 'one_time'; remaining?: number; message?: string }> {
  await ensureUsageRecord(client, userId);

  console.log(`💳 [CONSUME CREDIT] Starting credit consumption for user: ${userId}`);

  // ⭐ STEP 1: Try subscription credits first (monthly)
  const { data: subActive } = await client
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1);

  const isSubActive = Array.isArray(subActive) && subActive[0] && ['active', 'trialing'].includes(subActive[0].status);
  console.log(`📊 [CONSUME CREDIT] Subscription active: ${isSubActive}`);

  if (isSubActive) {
    const { data } = await client
      .from('document_usage')
      .select('monthly_remaining, api_generated_total')
      .eq('user_id', userId)
      .single();

    const remaining = data?.monthly_remaining || 0;
    console.log(`📊 [CONSUME CREDIT] Monthly credits available: ${remaining}`);
    
    if (remaining > 0) {
      // ⭐ ATOMIC UPDATE: Use WHERE clause to prevent race conditions
      const { data: updateResult, error } = await client
        .from('document_usage')
        .update({ 
          monthly_remaining: remaining - 1, 
          api_generated_total: (data?.api_generated_total || 0) + 1, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('monthly_remaining', remaining) // ⭐ CRITICAL: Only update if still has the same balance
        .select();
      
      if (!error && updateResult && updateResult.length > 0) {
        console.log(`✅ [CONSUME CREDIT] Consumed 1 monthly credit. Remaining: ${remaining - 1}`);
        return { 
          ok: true, 
          source: 'subscription', 
          remaining: remaining - 1,
          message: `Document generated using monthly subscription credits. ${remaining - 1} credits remaining.`
        };
      } else if (error) {
        console.error(`❌ [CONSUME CREDIT] Failed to update monthly credits:`, error);
      } else {
        console.warn(`⚠️ [CONSUME CREDIT] Race condition detected - monthly credits already consumed`);
      }
    }
    console.log('⚠️ [CONSUME CREDIT] Monthly subscription credits exhausted (0 remaining). Trying one-time credits...');
  }

  // ⭐ STEP 2: Fallback to one-time credits
  const { data: one } = await client
    .from('document_usage')
    .select('one_time_remaining, api_generated_total')
    .eq('user_id', userId)
    .single();
    
  const oneRemain = one?.one_time_remaining || 0;
  console.log(`📊 [CONSUME CREDIT] One-time credits available: ${oneRemain}`);
  
  if (oneRemain > 0) {
    // ⭐ ATOMIC UPDATE: Use WHERE clause to prevent race conditions
    const { data: updateResult, error } = await client
      .from('document_usage')
      .update({ 
        one_time_remaining: oneRemain - 1, 
        api_generated_total: (one?.api_generated_total || 0) + 1, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('one_time_remaining', oneRemain) // ⭐ CRITICAL: Only update if still has the same balance
      .select();
    
    if (!error && updateResult && updateResult.length > 0) {
      console.log(`✅ [CONSUME CREDIT] Consumed 1 one-time credit. Remaining: ${oneRemain - 1}`);
      return { 
        ok: true, 
        source: 'one_time', 
        remaining: oneRemain - 1,
        message: `Document generated using one-time credits. ${oneRemain - 1} credits remaining.`
      };
    } else if (error) {
      console.error(`❌ [CONSUME CREDIT] Failed to update one-time credits:`, error);
    } else {
      console.warn(`⚠️ [CONSUME CREDIT] Race condition detected - one-time credits already consumed`);
    }
  }

  // ⭐ STEP 3: No credits available - return error
  console.error('❌ [CONSUME CREDIT] No credits available. Monthly: 0, One-time: 0');
  return { 
    ok: false,
    message: 'Insufficient credits. You have 0 monthly credits and 0 one-time credits. Please purchase a document pack or subscribe to continue.'
  };
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

/**
 * Verify and auto-correct usage credits based on actual subscription and transaction data
 * This ensures the credits are always in sync with payment records
 */
export async function verifyAndCorrectUsage(client: SupabaseClientLike, userId: string): Promise<{
  corrected: boolean;
  changes: string[];
}> {
  const changes: string[] = [];
  
  try {
    // Ensure usage record exists
    await ensureUsageRecord(client, userId);
    
    // Get current usage state
    const { data: currentUsage } = await client
      .from('document_usage')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!currentUsage) {
      throw new Error('Failed to get current usage');
    }
    
    // Check for active subscription
    const { data: activeSubs } = await client
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1);
    
    const hasActiveSubscription = activeSubs && activeSubs.length > 0;
    
    // Prepare corrections
    const updates: any = {};
    
    // Check monthly credits
    if (hasActiveSubscription) {
      const sub = activeSubs[0];
      const now = new Date();
      const subPeriodStart = sub.current_period_start ? new Date(sub.current_period_start) : null;
      const subPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
      const usagePeriodStart = currentUsage.monthly_period_start ? new Date(currentUsage.monthly_period_start) : null;
      const usagePeriodEnd = currentUsage.monthly_period_end ? new Date(currentUsage.monthly_period_end) : null;
      
      // Check if we're in a NEW billing period
      // This happens when subscription period has advanced but usage hasn't been reset
      const needsPeriodReset = (
        subPeriodEnd && usagePeriodEnd && 
        subPeriodEnd.getTime() > usagePeriodEnd.getTime()
      );
      
      // Check if we need to INITIALIZE credits (no period set yet)
      const needsInitialization = !usagePeriodStart || !usagePeriodEnd;
      
      // ⭐ SMART CORRECTION: Count documents generated ONLY in the current subscription period
      if (needsPeriodReset || needsInitialization) {
        // Calculate how many documents were generated in THIS period
        let documentsThisPeriod = 0;
        if (subPeriodStart && subPeriodEnd) {
          const { count } = await client
            .from('documents')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .gte('created_at', subPeriodStart.toISOString())
            .lte('created_at', subPeriodEnd.toISOString());
          
          documentsThisPeriod = count || 0;
        }
        
        const correctMonthlyRemaining = Math.max(0, MONTHLY_DOC_LIMIT - documentsThisPeriod);
        
        updates.monthly_limit = MONTHLY_DOC_LIMIT;
        updates.monthly_remaining = correctMonthlyRemaining;
        updates.monthly_period_start = subPeriodStart?.toISOString();
        updates.monthly_period_end = subPeriodEnd?.toISOString();
        
        if (needsPeriodReset) {
          changes.push(`Monthly credits reset for new period: ${currentUsage.monthly_remaining} → ${correctMonthlyRemaining} (${documentsThisPeriod} docs used)`);
        } else {
          changes.push(`Monthly credits initialized: ${correctMonthlyRemaining} remaining (${documentsThisPeriod} docs used this period)`);
        }
      } else if (currentUsage.monthly_limit !== MONTHLY_DOC_LIMIT) {
        // Limit is wrong but we're in the same period - fix limit only
        updates.monthly_limit = MONTHLY_DOC_LIMIT;
        changes.push(`Monthly limit corrected: ${currentUsage.monthly_limit} → ${MONTHLY_DOC_LIMIT}`);
      }
    } else if (!hasActiveSubscription && (currentUsage.monthly_remaining > 0 || currentUsage.monthly_limit > 0)) {
      // No active subscription but has monthly credits - reset to 0
      updates.monthly_remaining = 0;
      updates.monthly_limit = 0;
      changes.push(`Monthly credits reset to 0 (no active subscription)`);
    }
    
    // Check one-time credits
    const { data: oneTimeTxs } = await client
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('transaction_type', 'one_time')
      .eq('status', 'paid')
      .eq('is_renewal', false);
    
    const oneTimePurchaseCount = oneTimeTxs?.length || 0;
    const expectedOneTimeTotal = oneTimePurchaseCount * ONE_TIME_DOC_LIMIT;
    
    // Calculate documents used from one-time (all docs outside subscription period)
    let documentsUsedFromOneTime = currentUsage.api_generated_total || 0;
    if (hasActiveSubscription && activeSubs[0].current_period_start) {
      // Subtract documents generated in current subscription period
      const { count: docsInPeriod } = await client
        .from('documents')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', activeSubs[0].current_period_start);
      
      documentsUsedFromOneTime = Math.max(0, documentsUsedFromOneTime - (docsInPeriod || 0));
    }
    
    const expectedOneTimeRemaining = Math.max(0, expectedOneTimeTotal - documentsUsedFromOneTime);
    const currentOneTime = currentUsage.one_time_remaining || 0;
    
    if (currentOneTime !== expectedOneTimeRemaining) {
      updates.one_time_remaining = expectedOneTimeRemaining;
      changes.push(`One-time credits corrected: ${currentOneTime} → ${expectedOneTimeRemaining}`);
    }
    
    // Apply corrections if needed
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      
      const { error: updateError } = await client
        .from('document_usage')
        .update(updates)
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('❌ Failed to apply usage corrections:', updateError);
        throw updateError;
      }
      
      console.log('✅ Usage corrections applied:', changes);
      return { corrected: true, changes };
    }
    
    return { corrected: false, changes: [] };
  } catch (error) {
    console.error('❌ Error in verifyAndCorrectUsage:', error);
    return { corrected: false, changes: [`Error: ${error instanceof Error ? error.message : String(error)}`] };
  }
}