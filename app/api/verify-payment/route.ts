import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { PLANS, type PlanName } from '@/lib/stripe-plans';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set.');
}

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get session ID from request
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!checkoutSession) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 400 }
      );
    }

    // Verify payment status
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Get the plan from metadata
    const plan = checkoutSession.metadata?.plan as PlanName | undefined;
    if (!plan || !Object.values(PLANS).includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan information' },
        { status: 400 }
      );
    }

    // Update user's subscription in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        stripe_customer_id: checkoutSession.customer as string,
        active_plan: plan,
        plan_status: 'active',
        plan_updated_at: new Date().toISOString(),
        stripe_session_id: sessionId,
      })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Error updating user plan:', updateError);
      return NextResponse.json(
        { error: 'Failed to activate plan' },
        { status: 500 }
      );
    }

    // Create subscription record
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: session.user.id,
        plan_name: plan,
        status: 'active',
        stripe_session_id: sessionId,
        stripe_customer_id: checkoutSession.customer as string,
        amount_paid: checkoutSession.amount_total,
        currency: checkoutSession.currency,
        payment_status: checkoutSession.payment_status,
        created_at: new Date().toISOString(),
      });

    if (subscriptionError) {
      console.error('Error creating subscription record:', subscriptionError);
      // Don't return error since user's plan is already activated
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
} 