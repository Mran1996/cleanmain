"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, CreditCard } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle>Login Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Please log in to access this feature.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Login
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/sign-up')}
                className="w-full"
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CreditCard className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <CardTitle>{fallbackTitle}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {fallbackMessage}
            </p>
            <div className="space-y-2">
              <Link href="/pricing">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <CreditCard className="mr-2 h-4 w-4" />
                  View Pricing Plans
                </Button>
              </Link>
              <Button 
                variant="outline"
                onClick={() => router.back()}
                className="w-full"
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
