'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/SupabaseProvider'
import AccountClient from "./AccountClient"
import { BillingService } from '@/services/billing'
import { BillingData } from '@/types/billing'

export default function AccountPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [billingData, setBillingData] = useState<BillingData | undefined>(undefined)
  const [loadingBilling, setLoadingBilling] = useState(false)
  const supabase = useSupabase()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log('🔍 Starting auth check...')
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('❌ Error getting user:', error)
          setError('Failed to load user data')
          setIsLoading(false)
          return
        }

        if (!user) {
          console.log('❌ No user found, redirecting to login')
          router.push('/login')
          return
        }

        console.log('✅ User authenticated:', user.email)
        setUser(user)
        setIsLoading(false)
      } catch (err) {
        console.error('❌ Auth check failed:', err)
        setError('Authentication failed')
        setIsLoading(false)
      }
    }

    checkUser()

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Auth check timeout, redirecting to login')
        router.push('/login')
      }
    }, 5000) // 5 second timeout

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email)
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login')
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        setIsLoading(false)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [supabase.auth, router, isLoading])

  useEffect(() => {
    console.log('🏠 Account page loaded successfully');
    console.log('👤 User data:', user);
    console.log('🔐 User authenticated:', !!user);
    console.log('📊 Loading states:', { isLoading, loadingBilling });
    
    // Clear any OAuth errors from URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      console.error('OAuth error detected:', error);
      // Clear the error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Fetch billing data if user is logged in
    if (user) {
      const fetchBillingData = async () => {
        try {
          setLoadingBilling(true);
          
          // Set a timeout for billing data loading
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Billing data loading timeout')), 8000);
          });
          
          // Race between billing data fetch and timeout
          const data = await Promise.race([
            BillingService.retryWithBackoff(() => BillingService.getBillingData()),
            timeoutPromise
          ]);
          
          console.log('💳 Billing data loaded:', data);
          setBillingData(data);
        } catch (err) {
          console.error('❌ Error fetching billing data:', err);
          // Set empty billing data instead of leaving it null
          setBillingData({
            subscription: undefined,
            paymentMethods: [],
            invoices: []
          });
        } finally {
          setLoadingBilling(false);
        }
      };
      
      fetchBillingData();
    } else {
      // If no user, set empty billing data immediately
      setBillingData({
        subscription: undefined,
        paymentMethods: [],
        invoices: []
      });
    }
  }, [user]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6fefa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Loading account information...</p>
          <p className="text-sm text-gray-500">If you're not signed in, please use the Sign In button above</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#f6fefa] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  // Show account page with real user data
  if (user) {
    const userData = {
      email: user.email || "No email",
      firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || "User",
      lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ')[1] || "",
      displayName: user.user_metadata?.full_name || user.user_metadata?.first_name || user.email?.split('@')[0] || "User",
      avatarUrl: user.user_metadata?.avatar_url || null,
      createdAt: new Date(user.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }

    return (
      <div className="min-h-screen bg-[#f6fefa]">
        <AccountClient
          avatarUrl={userData.avatarUrl}
          displayName={userData.displayName}
          firstName={userData.firstName}
          lastName={userData.lastName}
          email={userData.email}
          createdAt={userData.createdAt}
          subscription={billingData?.subscription}
          billingData={billingData}
        />
      </div>
    )
  }

  // Fallback - should not reach here
  return (
    <div className="min-h-screen bg-[#f6fefa] flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Something went wrong. Please try again.</p>
        <button 
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Sign In
        </button>
      </div>
    </div>
  )
} 