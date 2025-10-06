'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from './SupabaseProvider';
import { useAuth } from './auth-provider';

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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please log in to access this feature.</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/sign-up')}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{fallbackTitle}</h2>
            <p className="text-gray-600 mb-6">{fallbackMessage}</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/pricing')}
              className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              View Pricing Plans
            </button>
            <button
              onClick={() => router.back()}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
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