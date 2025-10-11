'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from './SupabaseProvider';
import { useAuth } from './auth-provider';
import { Logo } from './Logo';
import { CreditCard } from 'lucide-react';

interface SubscriptionGuardProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

export function SubscriptionGuard({ 
  children, 
  fallbackTitle = "Premium Feature",
  fallbackMessage = "This feature requires an active subscription to access."
}: SubscriptionGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const { user, loading } = useAuth();
  const supabase = useSupabase();

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        // Wait for auth provider to finish loading
        if (loading) {
          return;
        }

        // Check if user is authenticated
        if (!user) {
          console.log('🚫 SubscriptionGuard: No user found, showing login prompt');
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        console.log('✅ SubscriptionGuard: User authenticated:', user.email);

        // Check subscription status
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plan: 'premium' }),
        });

        if (response.status === 409) {
          // User has active subscription
          console.log('✅ SubscriptionGuard: Active subscription found');
          setHasAccess(true);
        } else {
          // No active subscription
          console.log('❌ SubscriptionGuard: No active subscription');
          setHasAccess(false);
        }
      } catch (error) {
        console.error('❌ SubscriptionGuard error:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [user, loading, supabase]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <Logo size="lg" />
          </div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 text-lg">Please log in to access this premium feature.</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors text-lg font-semibold"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/sign-up')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors text-lg"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <Logo size="lg" />
          </div>
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{fallbackTitle}</h2>
            <p className="text-gray-600 text-lg leading-relaxed">{fallbackMessage}</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/pricing')}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center text-lg font-semibold"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              View Pricing Plans
            </button>
            <button
              onClick={() => router.back()}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors text-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 