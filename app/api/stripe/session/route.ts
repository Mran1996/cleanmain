import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent', 'subscription']
    });

    // Format the response data
    const sessionData = {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email,
      customer_name: session.customer_details?.name,
      payment_intent: session.payment_intent,
      subscription: session.subscription,
      created: session.created,
      expires_at: session.expires_at,
      line_items: session.line_items?.data?.map(item => ({
        description: item.description,
        amount_total: item.amount_total,
        currency: item.currency,
        quantity: item.quantity,
        price: {
          id: item.price?.id,
          nickname: item.price?.nickname,
          unit_amount: item.price?.unit_amount,
          recurring: item.price?.recurring
        }
      }))
    };

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error('Error retrieving session:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve session details' },
      { status: 500 }
    );
  }
}
