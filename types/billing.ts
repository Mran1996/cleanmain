/**
 * Billing Types
 * Contains TypeScript types for billing, subscription, and payment data
 */

/**
 * Represents a credit card stored in Stripe
 */
export type StripeCard = {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
};

/**
 * Represents a payment method with a card in Stripe
 */
export type StripePaymentMethod = {
  id: string;
  card: StripeCard;
};

/**
 * Represents a subscription plan in Stripe
 */
export type StripePlan = {
  id?: string;
  nickname?: string;
  amount?: number;
  interval?: 'month' | 'year' | 'week' | 'day';
  currency?: string;
};

/**
 * Represents a subscription in Stripe
 */
export type StripeSubscription = {
  id?: string;
  status?: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  plan?: StripePlan;
  items?: {
    data: Array<{
      id: string;
      plan: StripePlan;
    }>;
  };
};

/**
 * Represents an invoice in Stripe
 */
export type StripeInvoice = {
  id: string;
  created: number; // timestamp
  amount_paid: number; // in cents
  status: string;
  number?: string;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
  currency?: string;
  customer_email?: string;
};

/**
 * Complete billing data returned from the API
 */
export type BillingData = {
  subscription?: StripeSubscription;
  paymentMethods?: StripePaymentMethod[];
  invoices?: StripeInvoice[];
};

/**
 * Status of a user's subscription
 */
export type BillingStatus = "loading" | "active" | "inactive" | "error";

/**
 * Represents a purchase record from the database
 */
export type Purchase = {
  id: string;
  document_name: string;
  price: number;
  created_at: string;
  user_id?: string;
};