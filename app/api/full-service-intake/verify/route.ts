import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { PRODUCTS } from '@/lib/stripe-config';
import { getServerUser } from '@/utils/server-auth';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Verify authenticated user
    const { user, isAuthenticated, error: authError } = await getServerUser();
    if (!isAuthenticated || !user) {
      return NextResponse.json({ error: 'Not authenticated', details: authError }, { status: 401 });
    }

    // Retrieve Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json({ allowed: false, reason: 'Payment not completed' }, { status: 402 });
    }

    // Basic gating: must be payment mode and FULL_SERVICE product
    const plan = (session.metadata?.plan || '').toString();
    const paidUserId = (session.metadata?.user_id || '').toString();

    if (session.mode !== 'payment') {
      return NextResponse.json({ allowed: false, reason: 'Invalid checkout mode' }, { status: 400 });
    }

    if (plan !== PRODUCTS.FULL_SERVICE) {
      return NextResponse.json({ allowed: false, reason: 'Plan not eligible for intake' }, { status: 403 });
    }

    if (!paidUserId || paidUserId !== user.id) {
      return NextResponse.json({ allowed: false, reason: 'Session user mismatch' }, { status: 403 });
    }

    return NextResponse.json({
      allowed: true,
      session_id: sessionId,
      amount_total: session.amount_total,
      currency: session.currency,
      customer: session.customer,
      plan,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Verification failed', message: error.message }, { status: 500 });
  }
}