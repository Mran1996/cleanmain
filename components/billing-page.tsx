"use client"

import { useState, useEffect } from "react"

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
  number?: string;
  invoice_pdf?: string;
};

type BillingData = {
  subscription?: StripeSubscription;
  paymentMethods?: { card: StripeCard }[];
  invoices?: StripeInvoice[];
};
import {
  BadgeCheck,
  CreditCard,
  CalendarCheck,
  DollarSign,
  Download,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function BillingPage() {
  const [isPaymentExpanded, setIsPaymentExpanded] = useState(false)
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBilling() {
      try {
        setLoading(true)
        const res = await fetch("/api/billing")
        if (!res.ok) throw new Error("Failed to fetch billing data")
        const data = await res.json()
        setBillingData(data)
      } catch (err) {
  setError(err instanceof Error ? err.message : null)
      } finally {
        setLoading(false)
      }
    }
    fetchBilling()
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-center mb-4">Choose Your Plan</h2>
      <p className="text-center text-gray-600 mb-12">
        Get professional legal documents — no law firm required.
      </p>

      {/* Removed hardcoded plan placeholders. Only real Stripe data will be shown below. */}

      <Tabs defaultValue="overview" className="w-full mt-8">
        {loading && <div className="text-center py-8">Loading billing data...</div>}
        {error && <div className="text-center text-red-600 py-8">{error}</div>}
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="history">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {billingData && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium flex items-center">
                  <BadgeCheck className="text-teal-600 w-5 h-5 mr-2" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-xl text-gray-900">
                      {billingData.subscription?.plan?.nickname || 'No active subscription'}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {billingData.subscription?.status ? `Status: ${billingData.subscription.status}` : 'No subscription'}
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {billingData.subscription?.plan?.amount ? `$${(billingData.subscription.plan.amount / 100).toFixed(2)}` : '--'}
                    <span className="text-sm font-normal text-gray-500">/month</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between border-t pt-6">
                <Button variant="outline">Change Plan</Button>
                <Button variant="destructive" className="bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700">
                  Cancel Subscription
                </Button>
              </CardFooter>
            </Card>
          )}
          {billingData && billingData.paymentMethods && billingData.paymentMethods.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium flex items-center">
                  <CreditCard className="text-teal-600 w-5 h-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center">
                    <div className="w-12 h-8 bg-blue-600 rounded mr-4 flex items-center justify-center text-white font-bold">
                      {billingData.paymentMethods[0].card.brand.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">
                        {billingData.paymentMethods[0].card.brand} ending in {billingData.paymentMethods[0].card.last4}
                      </p>
                      <p className="text-sm text-gray-500">
                        Expires {billingData.paymentMethods[0].card.exp_month}/{billingData.paymentMethods[0].card.exp_year}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Update</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payment-methods">
          {billingData && billingData.paymentMethods && billingData.paymentMethods.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Payment Methods</CardTitle>
                <CardDescription>Manage your saved payment methods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {billingData.paymentMethods.map((pm: { card: StripeCard }, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                      <div className="flex items-center">
                        <div className="w-12 h-8 bg-blue-600 rounded mr-4 flex items-center justify-center text-white font-bold">
                          {pm.card.brand.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{pm.card.brand} ending in {pm.card.last4}</p>
                          <p className="text-sm text-gray-500">Expires {pm.card.exp_month}/{pm.card.exp_year}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Payment Methods</CardTitle>
                <CardDescription>No payment methods found.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          {billingData && billingData.invoices && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billing History</CardTitle>
                <CardDescription>View and download your past invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {billingData.invoices.length === 0 && <div>No invoices found.</div>}
                  {billingData.invoices.map((invoice: StripeInvoice, i: number) => (
                    <div
                      key={invoice.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-3"
                    >
                      <div className="flex items-center gap-4">
                        <CalendarCheck className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{new Date(invoice.created * 1000).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">{invoice.number || invoice.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center ml-9 sm:ml-0">
                        <div className="flex items-center mr-6">
                          <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                          <span className="font-medium">${(invoice.amount_paid / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs mr-4">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          {invoice.status}
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-8 border-t pt-6">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsPaymentExpanded(!isPaymentExpanded)}
        >
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="font-medium">Billing FAQs</h3>
          </div>
          {isPaymentExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>

        {isPaymentExpanded && (
          <div className="mt-4 space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">When will I be charged?</h4>
              <p>
                Your subscription renews automatically on the 15th of each month. You'll receive an email receipt after
                each payment.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">How do I cancel my subscription?</h4>
              <p>
                You can cancel your subscription at any time from the billing page. Your access will continue until the
                end of your current billing period.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Can I get a refund?</h4>
              <p>
                We offer a 7-day money-back guarantee for new subscriptions. Please contact our support team for
                assistance with refunds.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
