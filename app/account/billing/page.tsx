"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ViewPurchaseHistory from "@/components/ViewPurchaseHistory"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { Briefcase, CheckCircle2, Download, History, ArrowLeft } from "lucide-react"
import { BillingService } from "@/services/billing"
import { getPlanFeatures } from "@/lib/plan-features"
import { BillingData, BillingStatus } from "@/types/billing"

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClientComponentClient();
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [status, setStatus] = useState<BillingStatus>("loading");
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    async function fetchBilling() {
      try {
        setLoading(true);
        console.log('🔄 Fetching billing data...');
        
        // Use the billing service with retry logic
        const data = await BillingService.retryWithBackoff(
          () => BillingService.getBillingData(),
          3, // max retries
          1000 // initial delay
        );
        
        console.log('✅ Billing data received:', data);
        setBillingData(data);
        setStatus(data.subscription?.status === "active" ? "active" : "inactive");
      } catch (err) {
        console.error("❌ Billing data fetch error:", err);
        // Set empty billing data instead of null to prevent infinite loading
        setBillingData({
          subscription: undefined,
          paymentMethods: [],
          invoices: []
        });
        setStatus("inactive");
      } finally {
        setLoading(false);
      }
    }
    
    // Only fetch if user exists
    if (user) {
      fetchBilling();
    } else {
      // If no user, stop loading immediately
      setLoading(false);
      setBillingData({
        subscription: undefined,
        paymentMethods: [],
        invoices: []
      });
    }
  }, [user]);

  const handleDownloadReceipt = async () => {
    try {
      const invoicePdf = billingData?.invoices?.[0]?.invoice_pdf;
      BillingService.downloadReceipt(invoicePdf);
    } catch (error) {
      alert("No receipt available");
    }
  }

  // Add timeout for loading state
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⏰ Billing data loading timeout, setting fallback data');
        setLoading(false);
        setBillingData({
          subscription: undefined,
          paymentMethods: [],
          invoices: []
        });
        setStatus("inactive");
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Billing & Payments</h1>
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading billing information...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Billing & Payments</h1>
        <div className="text-center py-10">
          <p className="text-gray-600 mb-4">Please log in to view your billing information.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6fefa]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with back button */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/account')}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Account
            </Button>
            <h1 className="text-3xl font-bold">Billing & Payments</h1>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            {!showPurchaseHistory ? (
              <>
                {/* Plan status box - using real Stripe data */}
                <div className="rounded-xl border border-gray-200 bg-green-50 p-5 flex items-center gap-4 mb-6">
                  <Briefcase className="w-8 h-8 text-gray-700" />
                  <div>
                    <div className="text-lg">
                      {billingData?.subscription ? (
                        <>
                          You&apos;re on the <span className="font-bold">{billingData.subscription.items?.data?.[0]?.plan?.nickname || "Premium"}</span> Plan
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            billingData.subscription.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {billingData.subscription.status?.toUpperCase()}
                          </span>
                        </>
                      ) : (
                        "You don't have an active subscription"
                      )}
                    </div>
                    {billingData?.subscription?.current_period_end && (
                      <div className="text-base mt-1">
                        Next billing: <span className="font-semibold">
                          {new Date(billingData.subscription.current_period_end * 1000).toLocaleDateString()}
                        </span>
                        {billingData.subscription.cancel_at_period_end && (
                          <span className="ml-2 text-red-600">(Cancels at period end)</span>
                        )}
                      </div>
                    )}
                    {billingData?.subscription?.items?.data?.[0]?.plan?.amount && (
                      <div className="text-sm mt-1 text-gray-600">
                        ${(billingData.subscription.items.data[0].plan.amount / 100).toFixed(2)} / {billingData.subscription.items.data[0].plan.interval}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Methods */}
                {billingData?.paymentMethods && billingData.paymentMethods.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      💳 Payment Methods
                    </h3>
                    <div className="space-y-2">
                      {billingData.paymentMethods.map((pm, index) => (
                        <div key={pm.id} className="flex items-center justify-between bg-white p-3 rounded border">
                          <div className="flex items-center gap-3">
                            <span className="capitalize font-medium">{pm.card?.brand}</span>
                            <span>•••• {pm.card?.last4}</span>
                            <span className="text-gray-500 text-sm">
                              {pm.card?.exp_month}/{pm.card?.exp_year}
                            </span>
                          </div>
                          {index === 0 && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded font-medium">Default</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Invoices */}
                {billingData?.invoices && billingData.invoices.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      📄 Recent Invoices
                    </h3>
                    <div className="space-y-2">
                      {billingData.invoices.slice(0, 5).map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between bg-white p-3 rounded border">
                          <div>
                            <div className="font-medium">
                              {invoice.number || `Invoice ${invoice.id.slice(-8)}`}
                            </div>
                            <div className="text-gray-500 text-sm">
                              {new Date(invoice.created * 1000).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              ${(invoice.amount_paid / 100).toFixed(2)}
                            </div>
                            <div className={`text-sm ${
                              invoice.status === 'paid' 
                                ? 'text-green-600' 
                                : 'text-yellow-600'
                            }`}>
                              {invoice.status?.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Features list - dynamic based on plan using shared utility */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Plan Features</h3>
                  <ul className="space-y-3">
                    {getPlanFeatures(billingData?.subscription?.items?.data?.[0]?.plan?.nickname).map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-base">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-wrap gap-4">
                  {billingData?.subscription ? (
                    <Button 
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => router.push('/pricing')}
                    >
                      <Briefcase className="w-4 h-4" />
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button 
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => router.push('/pricing')}
                    >
                      <Briefcase className="w-4 h-4" />
                      Subscribe Now
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={handleDownloadReceipt}
                    disabled={!billingData?.invoices?.[0]?.invoice_pdf}
                  >
                    <Download className="w-4 h-4" />
                    Download Receipt
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2" 
                    onClick={() => setShowPurchaseHistory(true)}
                  >
                    <History className="w-4 h-4" />
                    View Purchase History
                  </Button>
                </div>
              </>
            ) : (
              <div>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowPurchaseHistory(false)} 
                  className="mb-6 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Billing
                </Button>
                <ViewPurchaseHistory />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 