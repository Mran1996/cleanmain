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
    one_time_limit_per_purchase?: number;
    one_time_remaining?: number;
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
    const used = Math.max(0, limit - remaining);
    const pctUsed = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    return { limit, remaining, used, pctUsed };
  }, [data]);

  const oneTime = useMemo(() => {
    const perPurchaseLimit = Math.max(0, data?.usage?.one_time_limit_per_purchase ?? 0);
    const remaining = Math.max(0, data?.usage?.one_time_remaining ?? 0);
    // Progress shown against a single purchase limit (approximation)
    const usedAgainstSingle = Math.max(0, perPurchaseLimit - Math.min(perPurchaseLimit, remaining));
    const pctUsedApprox = perPurchaseLimit > 0 ? Math.min(100, Math.round((usedAgainstSingle / perPurchaseLimit) * 100)) : 0;
    const totalGenerated = Math.max(0, data?.usage?.api_generated_total ?? 0);
    return { perPurchaseLimit, remaining, usedAgainstSingle, pctUsedApprox, totalGenerated };
  }, [data]);

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
            <Button variant="outline" size="sm" onClick={fetchUsage} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
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
              {/* Monthly Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Monthly Usage</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    (data.subscription?.status || "inactive") === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {data.subscription?.status || "inactive"}
                  </span>
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">{monthly.used}</span> used of <span className="font-medium">{monthly.limit}</span> credits
                  {typeof monthly.remaining === "number" && (
                    <> · <span className="font-medium">{monthly.remaining}</span> remaining</>
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
                  <h3 className="text-sm font-semibold">One-Time Credits</h3>
                  <span className="text-xs text-gray-500">Per purchase limit {oneTime.perPurchaseLimit}</span>
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">{oneTime.remaining}</span> credits remaining
                  {typeof oneTime.totalGenerated === "number" && (
                    <> · <span className="font-medium">{oneTime.totalGenerated}</span> generated total</>
                  )}
                </div>
                <div className="w-full h-3 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-3 bg-emerald-500"
                    style={{ width: `${oneTime.pctUsedApprox}%` }}
                    aria-label={`One-time used (approx) ${oneTime.pctUsedApprox}%`}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">Graph approximates usage against one purchase’s limit.</div>
              </div>

              {/* Updated timestamp */}
              <div className="text-xs text-gray-500">
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