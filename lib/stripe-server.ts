import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
}); 

// Add this function to support create-checkout/route.ts
export async function createCheckoutSession(priceId: string, userId: string) {
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