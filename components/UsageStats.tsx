"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type UsageResponse = {
  userId: string;
  subscription: {
    status: string;
    current_period_end: string | null;
  } | null;
  usage: {
    monthly_limit?: number;
    monthly_remaining?: number;
    monthly_used?: number; // ⭐ NEW: Used from API calculation
    one_time_limit_per_purchase?: number;
    one_time_remaining?: number;
    one_time_total_granted?: number; // ⭐ Total credits ever granted
    one_time_used?: number; // ⭐ Credits used from one-time purchases
    one_time_purchase_count?: number; // ⭐ Number of one-time purchases
    api_generated_total?: number;
    monthly_period_start?: string | null;
    monthly_period_end?: string | null;
    updated_at?: string | null;
  };
};

export default function UsageStats() {
  const [data, setData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/usage", { method: "GET" });
      if (!res.ok) {
        const details = await res.json().catch(() => ({}));
        throw new Error(details?.error || `Failed to load usage (${res.status})`);
      }
      const json: UsageResponse = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Failed to load usage");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const monthly = useMemo(() => {
    const limit = Math.max(0, data?.usage?.monthly_limit ?? 0);
    const remaining = Math.max(0, data?.usage?.monthly_remaining ?? 0);
    const used = Math.max(0, data?.usage?.monthly_used ?? (limit - remaining)); // ⭐ Use API value or calculate
    const pctUsed = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    return { limit, remaining, used, pctUsed };
  }, [data]);

  const oneTime = useMemo(() => {
    const perPurchaseLimit = Math.max(0, data?.usage?.one_time_limit_per_purchase ?? 0);
    const remaining = Math.max(0, data?.usage?.one_time_remaining ?? 0);
    const totalGranted = Math.max(0, data?.usage?.one_time_total_granted ?? 0); // Total ever granted
    const used = Math.max(0, data?.usage?.one_time_used ?? 0); // Used amount
    const purchaseCount = Math.max(0, data?.usage?.one_time_purchase_count ?? 0);
    
    // Calculate percentage used
    const pctUsed = totalGranted > 0 ? Math.min(100, Math.round((used / totalGranted) * 100)) : 0;
    
    return { perPurchaseLimit, remaining, used, totalGranted, pctUsed, purchaseCount };
  }, [data]);

  // ⭐ Calculate total available credits
  const totalAvailable = useMemo(() => {
    return monthly.remaining + oneTime.remaining;
  }, [monthly.remaining, oneTime.remaining]);

  const periodEnd = useMemo(() => {
    const end = data?.usage?.monthly_period_end || data?.subscription?.current_period_end || null;
    return end ? new Date(end) : null;
  }, [data]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Usage & Credits</CardTitle>
              <CardDescription>Track monthly and one-time credits with live updates.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchUsage} 
                disabled={loading}
                title="Refresh credit data (auto-verification runs on every load)"
              >
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-600 text-sm">{error}</div>
          ) : loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* ⭐ TOTAL AVAILABLE CREDITS - Prominent Display */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Total Available Credits</h3>
               
                </div>
                <div className="text-4xl font-bold text-green-700 mb-1">
                  {totalAvailable.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  {monthly.remaining} monthly + {oneTime.remaining} one-time
                </div>
              </div>

              {/* Monthly Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Monthly Subscription Credits</h3>
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">{monthly.used}</span> used of <span className="font-medium">{monthly.limit}</span> credits
                  {typeof monthly.remaining === "number" && (
                    <> · <span className="font-medium text-green-600">{monthly.remaining} remaining</span></>
                  )}
                </div>
                <div className="w-full h-3 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-3 bg-green-600"
                    style={{ width: `${monthly.pctUsed}%` }}
                    aria-label={`Monthly used ${monthly.pctUsed}%`}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {periodEnd ? (
                    <>Resets by <span className="font-medium">{periodEnd.toLocaleDateString()}</span></>
                  ) : (
                    <>Period end not set</>
                  )}
                </div>
              </div>

              {/* One-Time Credits */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">One-Time Purchase Credits</h3>
                  <span className="text-xs text-gray-500">Per purchase: {oneTime.perPurchaseLimit}</span>
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">{oneTime.used}</span> used of <span className="font-medium">{oneTime.totalGranted}</span> credits
                  {typeof oneTime.remaining === "number" && (
                    <> · <span className="font-medium text-emerald-600">{oneTime.remaining} remaining</span></>
                  )}
                </div>
                <div className="w-full h-3 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-3 bg-emerald-500"
                    style={{ width: `${oneTime.pctUsed}%` }}
                    aria-label={`One-time used ${oneTime.pctUsed}%`}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {oneTime.purchaseCount > 0 
                    ? `From ${oneTime.purchaseCount} purchase${oneTime.purchaseCount !== 1 ? 's' : ''}. Never expires.`
                    : 'Accumulates across all purchases. Never expires.'
                  }
                </div>
              </div>

              {/* Updated timestamp */}
              <div className="text-xs text-gray-500 border-t pt-3">
                Updated {data.usage?.updated_at ? new Date(data.usage.updated_at).toLocaleString() : "recently"}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No usage data available.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}