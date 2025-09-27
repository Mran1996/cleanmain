"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ViewPurchaseHistory from "@/components/ViewPurchaseHistory"
import { useSupabase } from '@/components/SupabaseProvider';
import { User } from '@supabase/supabase-js';
import { Briefcase, CheckCircle2, Download, History } from "lucide-react"
import { BillingService } from "@/services/billing"
import { getPlanFeatures } from "@/lib/plan-features"
import { BillingData, BillingStatus } from "@/types/billing"

export default function BillingPage() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = useSupabase();
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    async function fetchBilling() {
      try {
        setLoading(true);
        // Use the billing service with retry logic
        const data = await BillingService.retryWithBackoff(
          () => BillingService.getBillingData()
        );
        
        setBillingData(data);
        setStatus(data.subscription?.status === "active" ? "active" : "inactive");
      } catch (err) {
        console.error("Billing data fetch error:", err);
        setStatus("inactive");
      } finally {
        setLoading(false);
      }
    }
    
    fetchBilling();
  }, []);

  const handleDownloadReceipt = async () => {
    try {
      const invoicePdf = billingData?.invoices?.[0]?.invoice_pdf;
      BillingService.downloadReceipt(invoicePdf);
    } catch (error) {
      alert("No receipt available");
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Billing & Payments</h1>
        <div className="text-center py-10">Loading billing information...</div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Billing & Payments</h1>

      {!showPurchaseHistory ? (
        <>
          {/* Plan status box - using real Stripe data */}
          <div className="rounded-xl border border-gray-200 bg-green-50 p-5 flex items-center gap-4 mb-6">
            <Briefcase className="w-8 h-8 text-gray-700" />
            <div>
              <div className="text-lg">
                {billingData?.subscription ? (
                  <>
                    You&apos;re on the <span className="font-bold">{billingData.subscription.plan?.nickname || "Standard"}</span> Plan
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
                </div>
              )}
            </div>
          </div>
          
          {/* Features list - dynamic based on plan using shared utility */}
          <ul className="mb-8 space-y-2">
            {getPlanFeatures(billingData?.subscription?.plan?.nickname).map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              className="flex items-center gap-2"
              onClick={handleDownloadReceipt}
              disabled={!billingData?.invoices?.[0]?.invoice_pdf}
            >
              <Download className="w-5 h-5" />
              Download Receipt
            </Button>
            <Button 
              variant="outline"
              className="flex items-center gap-2" 
              onClick={() => setShowPurchaseHistory(true)}
            >
              <History className="w-5 h-5" />
              View Purchase History
            </Button>
          </div>
        </>
      ) : (
        <div>
          <Button variant="ghost" onClick={() => setShowPurchaseHistory(false)} className="mb-4">
            ← Back to Billing
          </Button>
          <ViewPurchaseHistory />
        </div>
      )}
    </div>
  )
} 