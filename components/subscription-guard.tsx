"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, CreditCard } from "lucide-react";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

export function SubscriptionGuard({ 
  children, 
  fallbackTitle = "Premium Feature",
  fallbackMessage = "This feature requires an active subscription to access."
}: SubscriptionGuardProps) {
  const { user, loading } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const router = useRouter();

  // Development/override bypass: allow access locally or when explicitly disabled via env flag
  const isGuardDisabled =
    process.env.NEXT_PUBLIC_DISABLE_SUBSCRIPTION_GUARD === 'true' ||
    process.env.NODE_ENV !== 'production';

  if (isGuardDisabled) {
    return <>{children}</>;
  }

  useEffect(() => {
    console.log('🔐 SubscriptionGuard: Auth check -', { 
      user: user?.email || 'No user', 
      loading,
      hasActiveSubscription,
      subscriptionLoading
    });
  }, [user, loading, hasActiveSubscription, subscriptionLoading]);

  // Check subscription status when user is available
  useEffect(() => {
    if (loading || !user) {
      setSubscriptionLoading(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        console.log('💳 Checking subscription status directly from Stripe for user:', user.email);
        setSubscriptionLoading(true);

        // Check subscription status using the same method as checkout button
        // Try to create a checkout session to see if user has active subscription
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plan: 'premium' }), // Use any plan for checking
        });

        if (response.status === 409) {
          // User has active subscription (409 = Conflict)
          const data = await response.json();
          console.log('✅ Active subscription detected via Stripe:', data);
          setHasActiveSubscription(true);
        } else if (response.ok) {
          // No active subscription, user can proceed with checkout
          console.log('❌ No active subscription found via Stripe');
          setHasActiveSubscription(false);
        } else {
          // Other error - be conservative and allow access
          const data = await response.json();
          console.error('⚠️ Error checking subscription via Stripe:', data);
          console.log('🔄 Falling back to Supabase check...');
          
          // Fallback to Supabase check
          const { data: subscriptions, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

          if (error) {
            console.error('❌ Supabase subscription query error:', error);
            setHasActiveSubscription(false);
          } else {
            const isActive = !!subscriptions;
            setHasActiveSubscription(isActive);
            console.log('🔍 Supabase fallback result:', { hasSubscription: isActive });
          }
        }
      } catch (error: any) {
        console.error('❌ Error checking subscription:', error);
        // On error, be conservative and don't block access
        setHasActiveSubscription(false);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    checkSubscription();
  }, [user, loading]);

  // Show loading while checking authentication or subscription
  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {loading ? 'Checking authentication...' : 'Checking subscription...'}
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('🚫 SubscriptionGuard: No user found, showing login prompt');
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <div className="mb-4 flex justify-center">
              <Logo size="lg" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Login Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-gray-600 text-lg">
              Please log in to access this premium feature.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/login')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold"
              >
                Login
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/sign-up')}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3 text-lg"
              >
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check subscription status after authentication
  if (!hasActiveSubscription) {
    console.log('🚫 SubscriptionGuard: No active subscription, showing upgrade prompt');
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <div className="mb-6">
              <Logo size="lg" />
            </div>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">{fallbackTitle}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-gray-600 text-lg leading-relaxed">
              {fallbackMessage}
            </p>
            <div className="space-y-3">
              <Link href="/pricing">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold">
                  <CreditCard className="mr-2 h-5 w-5" />
                  View Pricing Plans
                </Button>
              </Link>
              <Button 
                variant="outline"
                onClick={() => router.back()}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3 text-lg"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and has active subscription - allow access
  console.log('✅ SubscriptionGuard: User authenticated with active subscription, allowing access');
  return <>{children}</>;
}
