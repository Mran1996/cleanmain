import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { getServerUser } from '@/utils/server-auth';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' })
  : null;

export async function GET(req: NextRequest) {
  try {
    const { user, isAuthenticated, error: authError } = await getServerUser();
    if (!isAuthenticated || !user) {
      return NextResponse.json({ error: 'Not authenticated', details: authError }, { status: 401 });
    }

    const supabaseAdmin = await createAdminClient();
    const { data: subRows, error } = await supabaseAdmin
      .from('subscriptions')
      .select('status, plan_id, current_period_end, current_period_start, cancel_at_period_end, canceled_at, stripe_subscription_id, stripe_customer_id')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (error) throw error;

    let sub = Array.isArray(subRows) ? subRows[0] : null;
    
    // If subscription exists but missing period dates, try to fetch from Stripe
    if (sub && stripe && sub.stripe_subscription_id && (!sub.current_period_start || !sub.current_period_end)) {
      console.log('⚠️ Missing period dates in DB, fetching from Stripe for subscription:', sub.stripe_subscription_id);
      try {
        const stripeSubscription: any = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
        
        // Update database with the fetched data
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };
        
        if (!sub.current_period_start && stripeSubscription.current_period_start) {
          updateData.current_period_start = new Date(stripeSubscription.current_period_start * 1000).toISOString();
          sub.current_period_start = updateData.current_period_start;
        }
        
        if (!sub.current_period_end && stripeSubscription.current_period_end) {
          updateData.current_period_end = new Date(stripeSubscription.current_period_end * 1000).toISOString();
          sub.current_period_end = updateData.current_period_end;
        }
        
        if (!sub.plan_id && stripeSubscription.items?.data?.[0]?.price?.id) {
          updateData.plan_id = stripeSubscription.items.data[0].price.id;
          sub.plan_id = updateData.plan_id;
        }
        
        // Update database with fetched data
        if (Object.keys(updateData).length > 1) { // More than just updated_at
          await supabaseAdmin
            .from('subscriptions')
            .update(updateData)
            .eq('stripe_subscription_id', sub.stripe_subscription_id);
          
          console.log('✅ Updated subscription with Stripe data:', updateData);
        }
      } catch (stripeError) {
        console.error('❌ Failed to fetch subscription from Stripe:', stripeError);
      }
    }
    
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