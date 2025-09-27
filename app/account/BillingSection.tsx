"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ViewPurchaseHistory from "@/components/ViewPurchaseHistory";
import { useSupabase } from '@/components/SupabaseProvider';
import { User } from '@supabase/supabase-js';

export default function BillingSection() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = useSupabase();

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
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDownloadReceipt = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receipt?userId=${user?.id}`);
      const data = await res.json();
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        alert("Receipt not found.");
      }
    } catch (err) {
      console.error("Error downloading receipt", err);
      alert("Something went wrong.");
    }
    setLoading(false);
  };

  return (
    <div>
      {!showHistory ? (
        <div className="space-y-4">
          {/* Only show real Stripe data, no placeholders */}
          <Button onClick={handleDownloadReceipt} disabled={loading}>
            {loading ? "Downloading..." : "Download Receipt"}
          </Button>

          <Button variant="outline" onClick={() => setShowHistory(true)}>
            View Purchase History
          </Button>
        </div>
      ) : (
        <div>
          <Button variant="ghost" onClick={() => setShowHistory(false)}>
            ← Back to Billing
          </Button>
          <ViewPurchaseHistory />
        </div>
      )}
    </div>
  );
} 