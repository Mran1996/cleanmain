import { useEffect, useState } from "react";

type StripeCard = {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
};

type StripeSubscription = {
  plan?: {
    nickname?: string;
    amount?: number;
  };
  status?: string;
};

type StripeInvoice = {
  id: string;
  created: number;
  amount_paid: number;
  status: string;
};

type BillingData = {
  subscription?: StripeSubscription;
  paymentMethods?: { card: StripeCard }[];
  invoices?: StripeInvoice[];
};

export default function BillingSection() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBilling() {
      try {
        setLoading(true);
        const res = await fetch("/api/billing");
        if (!res.ok) throw new Error("Failed to fetch billing data");
        const data = await res.json();
        setBillingData(data);
      } catch (err) {
  setError(err instanceof Error ? err.message : null);
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Billing & Subscription</h3>
        <p className="text-sm text-gray-500">Manage your billing information and subscription details.</p>
      </div>
      <div className="grid gap-6">
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Current Plan</h4>
          {loading && <p className="text-gray-500">Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {billingData && (
            <>
              <p className="text-gray-700 font-semibold">
                {billingData.subscription?.plan?.nickname || "No active subscription"}
              </p>
              <p className="text-gray-500 text-sm">
                {billingData.subscription?.status ? `Status: ${billingData.subscription.status}` : "No subscription"}
              </p>
              <p className="text-gray-700">
                {billingData.subscription?.plan?.amount ? `$${(billingData.subscription.plan.amount / 100).toFixed(2)}/month` : "--"}
              </p>
            </>
          )}
        </div>
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Payment Method</h4>
          {billingData && billingData.paymentMethods && billingData.paymentMethods.length > 0 ? (
            <>
              <p className="text-gray-700 font-semibold">
                {billingData.paymentMethods[0].card.brand.toUpperCase()} ending in {billingData.paymentMethods[0].card.last4}
              </p>
              <p className="text-gray-500 text-sm">
                Expires {billingData.paymentMethods[0].card.exp_month}/{billingData.paymentMethods[0].card.exp_year}
              </p>
            </>
          ) : (
            <p className="text-gray-500 text-sm">No payment method found</p>
          )}
        </div>
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Billing History</h4>
          {billingData && billingData.invoices && billingData.invoices.length > 0 ? (
            <ul className="text-sm text-gray-700 space-y-2">
              {billingData.invoices.map((invoice: StripeInvoice) => (
                <li key={invoice.id}>
                  {new Date(invoice.created * 1000).toLocaleDateString()} — ${ (invoice.amount_paid / 100).toFixed(2) } — {invoice.status}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No billing history found</p>
          )}
        </div>
      </div>
    </div>
  );
}