import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Initialize Stripe client
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
}) : null;

export async function POST(req: Request) {
  try {
    // Check for Stripe client
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe client not available. Please check STRIPE_SECRET_KEY.' },
        { status: 503 }
      );
    }

    const { action } = await req.json();

    if (!action || !['cancel', 'reactivate'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "cancel" or "reactivate"' },
        { status: 400 }
      );
    }

    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`🔄 ${action} subscription for user:`, user.email);

    // Get user's Stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please contact support.' },
        { status: 404 }
      );
    }

    const customerId = userData.stripe_customer_id;
    console.log('🔍 Found customer ID:', customerId);

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });

    console.log('📊 Found subscriptions:', subscriptions.data.length);

    if (action === 'cancel') {
      // Find active subscription to cancel
      const activeSubscription = subscriptions.data.find(sub => 
        ['active', 'trialing'].includes(sub.status) && !sub.cancel_at_period_end
      );

      if (!activeSubscription) {
        return NextResponse.json(
          { error: 'No active subscription found to cancel' },
          { status: 404 }
        );
      }

      console.log('❌ Canceling subscription:', activeSubscription.id);

      // Cancel subscription at period end
      const canceledSubscription = await stripe.subscriptions.update(activeSubscription.id, {
        cancel_at_period_end: true,
        metadata: {
          canceled_by: user.id,
          canceled_at: new Date().toISOString(),
          canceled_reason: 'user_requested'
        }
      });

      console.log('✅ Subscription canceled at period end:', canceledSubscription.id);

      return NextResponse.json({
        success: true,
        message: 'Subscription will be canceled at the end of your current billing period',
        subscription: {
          id: canceledSubscription.id,
          status: canceledSubscription.status,
          cancel_at_period_end: canceledSubscription.cancel_at_period_end,
          current_period_end: (canceledSubscription as any).current_period_end,
          canceled_at: (canceledSubscription as any).canceled_at
        }
      });

    } else if (action === 'reactivate') {
      // Find subscription that's set to cancel at period end or recently canceled
      const reactivatableSubscription = subscriptions.data.find(sub => {
        // Can reactivate if it's active but set to cancel at period end
        if (sub.status === 'active' && sub.cancel_at_period_end) {
          return true;
        }
        
        // Can reactivate if it was canceled within the last 30 days
        if (sub.status === 'canceled' && sub.canceled_at) {
          const canceledDate = new Date(sub.canceled_at * 1000);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return canceledDate > thirtyDaysAgo;
        }
        
        return false;
      });

      if (!reactivatableSubscription) {
        // Check if there are any canceled subscriptions that are too old
        const oldCanceledSubs = subscriptions.data.filter(sub => 
          sub.status === 'canceled' && sub.canceled_at
        );

        if (oldCanceledSubs.length > 0) {
          return NextResponse.json(
            { 
              error: 'Your subscription was canceled more than 30 days ago. Please create a new subscription.',
              action_required: 'new_subscription',
              redirect_url: '/pricing'
            },
            { status: 409 }
          );
        }

        return NextResponse.json(
          { error: 'No subscription found that can be reactivated' },
          { status: 404 }
        );
      }

      console.log('🔄 Reactivating subscription:', reactivatableSubscription.id);

      if (reactivatableSubscription.status === 'active' && reactivatableSubscription.cancel_at_period_end) {
        // Remove the cancel_at_period_end flag
        const reactivatedSubscription = await stripe.subscriptions.update(reactivatableSubscription.id, {
          cancel_at_period_end: false,
          metadata: {
            reactivated_by: user.id,
            reactivated_at: new Date().toISOString()
          }
        });

        console.log('✅ Subscription reactivated (removed cancel flag):', reactivatedSubscription.id);

        return NextResponse.json({
          success: true,
          message: 'Your subscription has been reactivated and will continue automatically',
          subscription: {
            id: reactivatedSubscription.id,
            status: reactivatedSubscription.status,
            cancel_at_period_end: reactivatedSubscription.cancel_at_period_end,
            current_period_end: (reactivatedSubscription as any).current_period_end
          }
        });

      } else if (reactivatableSubscription.status === 'canceled') {
        // For truly canceled subscriptions, we need to create a new one
        // Get the price from the canceled subscription
        const priceId = reactivatableSubscription.items.data[0]?.price?.id;
        
        if (!priceId) {
          return NextResponse.json(
            { error: 'Unable to determine subscription price. Please create a new subscription.' },
            { status: 400 }
          );
        }

        console.log('🆕 Creating new subscription with price:', priceId);

        // Create new subscription
        const newSubscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          metadata: {
            reactivated_from: reactivatableSubscription.id,
            reactivated_by: user.id,
            reactivated_at: new Date().toISOString()
          }
        });

        console.log('✅ New subscription created:', newSubscription.id);

        return NextResponse.json({
          success: true,
          message: 'Your subscription has been reactivated with a new billing cycle',
          subscription: {
            id: newSubscription.id,
            status: newSubscription.status,
            cancel_at_period_end: newSubscription.cancel_at_period_end,
            current_period_end: (newSubscription as any).current_period_end,
            current_period_start: (newSubscription as any).current_period_start
          }
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in subscription management:', error);
    
    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error managing subscription. Please try again.' },
      { status: 500 }
    );
  }
}
