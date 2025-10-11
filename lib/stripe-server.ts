import Stripe from 'stripe';

export const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set.');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil',
  });
}; 

// Add this function to support create-checkout/route.ts
export async function createCheckoutSession(priceId: string, userId: string) {
  const stripe = getStripeClient();
  return await stripe.checkout.sessions.create({
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
} 