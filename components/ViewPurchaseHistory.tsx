"use client";

import { useEffect, useState } from "react";
import { BillingService } from "@/services/billing";
import { Purchase } from "@/types/billing";

export default function ViewPurchaseHistory() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoading(true);
        
        // Use the billing service with retry logic
        const data = await BillingService.retryWithBackoff(
          () => BillingService.getPurchaseHistory()
        );
        
        setPurchases(data.purchases || []);
        setError(null);
      } catch (error) {
        console.error("Failed to load purchase history", error);
        setError("Failed to load purchase history. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  if (loading) return <p className="py-4 text-center">Loading purchase history...</p>;
  if (error) return <p className="py-4 text-center text-red-500">{error}</p>;
  if (!purchases.length) return <p className="py-4 text-center">No purchases found.</p>;

  return (
    <div className="space-y-4">
      {purchases.map((purchase) => (
        <div
          key={purchase.id}
          className="border p-4 rounded-md shadow-sm bg-white"
        >
          <div><strong>Document:</strong> {purchase.document_name || 'Untitled Document'}</div>
          <div><strong>Price:</strong> ${purchase.price?.toFixed(2) || '0.00'}</div>
          <div><strong>Purchased:</strong> {purchase.created_at ? new Date(purchase.created_at).toLocaleDateString() : 'Unknown date'}</div>
        </div>
      ))}
    </div>
  );
} 