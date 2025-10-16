"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { redirectToCheckout } from "@/lib/checkout";
import type { ProductName } from "@/lib/stripe-config";
import { PRODUCTS } from "@/lib/stripe-config";
import { CreditCard, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";

interface StripeCheckoutButtonProps {
  plan: ProductName;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionDetails?: {
    status: string;
    current_period_end: string;
  };
  error?: string;
}

export default function StripeCheckoutButton({
  plan,
  children = "Pay & Continue",
  className,
  variant = "default",
  size = "default",
}: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    hasActiveSubscription: false
  });
  const [oneTimeLoading, setOneTimeLoading] = useState(false);
  const [oneTimeRemaining, setOneTimeRemaining] = useState<number | null>(null);
  const [oneTimeLimit, setOneTimeLimit] = useState<number | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Pre-checks depending on plan
  useEffect(() => {
    if (!user || authLoading) return;
    const isOneTime = plan === PRODUCTS.FULL_SERVICE;

    const checkSubscriptionStatus = async () => {
      setCheckingSubscription(true);
      try {
        const response = await fetch('/api/subscription/status');
        if (response.ok) {
          const data = await response.json();
          const status = data?.subscription?.status;
          const periodEnd = data?.subscription?.current_period_end || '';
          if (status === 'active' || status === 'trialing') {
            setSubscriptionStatus({
              hasActiveSubscription: true,
              subscriptionDetails: { status, current_period_end: periodEnd }
            });
          } else {
            setSubscriptionStatus({ hasActiveSubscription: false });
          }
        } else {
          const data = await response.json().catch(() => ({}));
          setSubscriptionStatus({ hasActiveSubscription: false, error: data?.error || 'Failed to check subscription status' });
        }
      } catch (error) {
        setSubscriptionStatus({ hasActiveSubscription: false, error: 'Failed to check subscription status' });
      } finally {
        setCheckingSubscription(false);
      }
    };

    const checkOneTimeCredits = async () => {
      setOneTimeLoading(true);
      try {
        const response = await fetch('/api/usage/one-time');
        if (response.ok) {
          const data = await response.json();
          const remaining = data?.usage?.one_time_remaining;
          const limit = data?.usage?.one_time_limit_per_purchase;
          setOneTimeRemaining(typeof remaining === 'number' ? remaining : 0);
          setOneTimeLimit(typeof limit === 'number' ? limit : null);
        } else {
          setOneTimeRemaining(null);
          setOneTimeLimit(null);
        }
      } catch (error) {
        setOneTimeRemaining(null);
        setOneTimeLimit(null);
      } finally {
        setOneTimeLoading(false);
      }
    };

    if (isOneTime) {
      checkOneTimeCredits();
    } else {
      checkSubscriptionStatus();
    }
  }, [user, authLoading, plan]);

  console.log('💳 StripeCheckoutButton state:', { 
    user: user?.email || 'No user', 
    authLoading, 
    isLoading,
    checkingSubscription,
    subscriptionStatus 
  });

  const handleCheckout = async () => {
    // Check if user has active subscription
    const isOneTime = plan === PRODUCTS.FULL_SERVICE;
    if (!isOneTime && subscriptionStatus.hasActiveSubscription) {
      const status = subscriptionStatus.subscriptionDetails?.status || 'active';
      
      toast.warning("Subscription Already Active", {
        description: `You already have an ${status} subscription. Manage it from your account page.`,
        action: {
          label: "Go to Account",
          onClick: () => router.push('/account')
        }
      });
      return;
    }

    console.log('💳 StripeCheckoutButton: Checkout initiated');
    
    if (!user) {
      console.log('🔒 User not authenticated, redirecting to login');
      toast.info("Login Required", {
        description: "Please log in to continue with your subscription.",
        action: {
          label: "Login",
          onClick: () => router.push('/login')
        }
      });
      router.push('/login');
      return;
    }

    setIsLoading(true);
    toast.loading("Redirecting to checkout...", {
      id: "checkout-loading"
    });

    try {
      await redirectToCheckout(plan);
      toast.dismiss("checkout-loading");
    } catch (error) {
      console.error("Checkout error:", error);
      toast.dismiss("checkout-loading");
      
      // Handle specific error from our checkout API
      if (error instanceof Error && error.message.includes('already have an active subscription')) {
        toast.warning("Subscription Already Active", {
          description: "You already have an active subscription. Please manage your subscription from your account page.",
          action: {
            label: "Go to Account",
            onClick: () => router.push('/account')
          }
        });
        return;
      }
      
      // Provide more specific error messages with toast
      if (error instanceof Error) {
        if (error.message.includes('publishable key is not configured')) {
          toast.error("Configuration Error", {
            description: "Payment system is not configured. Please contact support."
          });
        } else if (error.message.includes('Stripe failed to load')) {
          toast.error("Service Unavailable", {
            description: "Payment system is temporarily unavailable. Please try again later."
          });
        } else {
          toast.error("Checkout Failed", {
            description: error.message || "Payment failed. Please try again."
          });
        }
      } else {
        toast.error("Checkout Failed", {
          description: "An unexpected error occurred. Please try again."
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Determine button state and content
  const isOneTime = plan === PRODUCTS.FULL_SERVICE;
  const isDisabled = isLoading || (isOneTime ? oneTimeLoading : checkingSubscription) || (!isOneTime && subscriptionStatus.hasActiveSubscription);
  const buttonVariant = (!isOneTime && subscriptionStatus.hasActiveSubscription) ? "outline" : variant;
  
  const getButtonContent = () => {
    if (!isOneTime && checkingSubscription) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Checking subscription...
        </>
      );
    }
    if (isOneTime && oneTimeLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Checking credits...
        </>
      );
    }
    
    if (subscriptionStatus.hasActiveSubscription) {
      const status = subscriptionStatus.subscriptionDetails?.status;
      if (status === 'active') {
        return (
          <>
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            Already Subscribed
          </>
        );
      } else if (status === 'trialing') {
        return (
          <>
            <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
            Trial Active
          </>
        );
      } else if (status === 'past_due') {
        return (
          <>
            <AlertCircle className="mr-2 h-4 w-4 text-orange-600" />
            Payment Required
          </>
        );
      } else {
        return (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Subscription Active
          </>
        );
      }
    }
    
    if (isLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      );
    }
    
    return (
      <>
        <CreditCard className="mr-2 h-4 w-4" />
        {children}
      </>
    );
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleCheckout}
        disabled={isDisabled}
        className={className}
        variant={buttonVariant}
        size={size}
      >
        {getButtonContent()}
      </Button>
      {/* Basic subscription info (status + next renewal) */}
      {!isOneTime && subscriptionStatus.subscriptionDetails && (
        <p className="text-xs text-muted-foreground">
          Subscription: {subscriptionStatus.subscriptionDetails.status}
          {subscriptionStatus.subscriptionDetails.current_period_end && (
            <> • Renews {new Date(subscriptionStatus.subscriptionDetails.current_period_end).toLocaleDateString()}</>
          )}
        </p>
      )}
    </div>
  );
}