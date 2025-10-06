"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { redirectToCheckout } from "@/lib/checkout";
import type { ProductName } from "@/lib/stripe-config";
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
    plan_name: string;
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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Check subscription status when user is available
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user || authLoading) return;
      
      setCheckingSubscription(true);
      try {
        console.log('🔍 Checking subscription status for user:', user.email);
        
        // Try to create a checkout session to see if user has active subscription
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plan }),
        });

        if (response.status === 409) {
          // User has active subscription
          const data = await response.json();
          console.log('⚠️ Active subscription detected:', data);
          
          setSubscriptionStatus({
            hasActiveSubscription: true,
            subscriptionDetails: {
              status: data.details?.status || 'active',
              plan_name: data.details?.plan_name || 'Premium Plan',
              current_period_end: data.details?.current_period_end || ''
            }
          });
        } else if (response.ok) {
          // No active subscription, user can proceed
          console.log('✅ No active subscription, user can purchase');
          setSubscriptionStatus({ hasActiveSubscription: false });
        } else {
          // Other error
          const data = await response.json();
          console.error('❌ Error checking subscription:', data);
          setSubscriptionStatus({ 
            hasActiveSubscription: false, 
            error: data.error || 'Failed to check subscription status'
          });
          
          // Only show error toast for critical errors, not for normal "no subscription" cases
          if (response.status >= 500) {
            toast.error("Subscription Check Failed", {
              description: "Unable to verify subscription status. You can still proceed with checkout."
            });
          }
        }
      } catch (error) {
        console.error('❌ Failed to check subscription status:', error);
        setSubscriptionStatus({ 
          hasActiveSubscription: false, 
          error: 'Failed to check subscription status'
        });
        
        // Show toast for network errors
        toast.error("Connection Error", {
          description: "Unable to check subscription status. Please check your connection."
        });
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscriptionStatus();
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
    if (subscriptionStatus.hasActiveSubscription) {
      const status = subscriptionStatus.subscriptionDetails?.status || 'active';
      const planName = subscriptionStatus.subscriptionDetails?.plan_name || 'subscription';
      
      toast.warning("Subscription Already Active", {
        description: `You already have an ${status} ${planName}. Manage it from your account page.`,
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
  const isDisabled = isLoading || checkingSubscription || subscriptionStatus.hasActiveSubscription;
  const buttonVariant = subscriptionStatus.hasActiveSubscription ? "outline" : variant;
  
  const getButtonContent = () => {
    if (checkingSubscription) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Checking subscription...
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
      
      {/* Show subscription details message */}
      {subscriptionStatus.hasActiveSubscription && subscriptionStatus.subscriptionDetails && (
        <div className="text-sm text-gray-600 text-center">
          <p>
            You have an <strong>{subscriptionStatus.subscriptionDetails.status}</strong> subscription
            {subscriptionStatus.subscriptionDetails.plan_name && (
              <> ({subscriptionStatus.subscriptionDetails.plan_name})</>
            )}
          </p>
          {subscriptionStatus.subscriptionDetails.current_period_end && (
            <p className="text-xs text-gray-500 mt-1">
              {subscriptionStatus.subscriptionDetails.status === 'active' 
                ? 'Renews on' 
                : 'Expires on'
              }: {new Date(subscriptionStatus.subscriptionDetails.current_period_end).toLocaleDateString()}
            </p>
          )}
          <p className="text-xs text-blue-600 mt-1">
            <a href="/account" className="underline hover:no-underline">
              Manage subscription →
            </a>
          </p>
        </div>
      )}
      
      {/* Show error message */}
      {subscriptionStatus.error && (
        <div className="text-sm text-red-600 text-center">
          <p>{subscriptionStatus.error}</p>
        </div>
      )}
    </div>
  );
} 