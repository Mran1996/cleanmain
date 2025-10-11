import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set.');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil',
  });
};

export async function POST(req: Request) {
  try {
    const stripe = getStripeClient();
    const { priceId, userId } = await req.json();

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Price ID and User ID are required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: { userId },
      success_url: process.env.STRIPE_SUCCESS_URL || 'https://askailegal.com/payment/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.STRIPE_CANCEL_URL || 'https://askailegal.com/payment/cancelled?session_id={CHECKOUT_SESSION_ID}',
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error in create-checkout:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
} 