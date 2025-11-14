'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import AccountClient from "./AccountClient"
import { BillingService } from '@/services/billing'
import { BillingData } from '@/types/billing'

export default function AccountPage() {
  const { user, loading: authLoading } = useAuth() // ⭐ Use AuthProvider
  const [error, setError] = useState<string | null>(null)
  const [billingData, setBillingData] = useState<BillingData | undefined>(undefined)
  const [loadingBilling, setLoadingBilling] = useState(false)
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('❌ No authenticated user, redirecting to login')
      router.push('/login')
    }
  }, [authLoading, user, router])

  // Billing data fetch effect
  useEffect(() => {
    let mounted = true
    
    console.log('🏠 Account page loaded')
    console.log('👤 User data:', user?.email)
    console.log('🔐 User authenticated:', !!user)
    console.log('📊 Loading states:', { authLoading, loadingBilling })
    
    // Clear any OAuth errors from URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const urlError = urlParams.get('error')
      if (urlError) {
        console.error('❌ OAuth error detected:', urlError)
        // Clear the error from URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
    
    // Fetch billing data if user is authenticated
    if (user && !authLoading) {
      const fetchBillingData = async () => {
        try {
          setLoadingBilling(true)
          console.log('🔄 Fetching billing data for user:', user.email)
          
          // Set a timeout for billing data loading (20 seconds to account for retries)
          // With 3 retries and exponential backoff, this gives enough time
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Billing data loading timeout')), 20000)
          })
          
          // Race between billing data fetch and timeout
          const data = await Promise.race([
            BillingService.retryWithBackoff(
              () => BillingService.getBillingData(),
              3, // max 3 retries
              300 // 300ms initial delay
            ),
            timeoutPromise
          ]) as BillingData
          
          if (!mounted) return
          
          console.log('✅ Billing data loaded successfully')
          console.log('📋 Subscription:', data.subscription?.status)
          console.log('💳 Payment methods:', data.paymentMethods?.length || 0)
          console.log('📧 Invoices:', data.invoices?.length || 0)
          
          setBillingData(data)
        } catch (err) {
          // Only log non-timeout errors to avoid console spam
          // Timeout errors are expected and handled gracefully
          if (err instanceof Error && err.message === 'Billing data loading timeout') {
            console.warn('⏱️ Billing data fetch timed out, using empty data')
          } else {
            console.error('❌ Error fetching billing data:', err)
          }
          
          if (!mounted) return
          
          // Set empty billing data instead of leaving undefined
          // This allows the page to render without billing info
          setBillingData({
            subscription: undefined,
            paymentMethods: [],
            invoices: []
          })
        } finally {
          if (mounted) {
            setLoadingBilling(false)
          }
        }
      }
      
      fetchBillingData()
    } else if (!authLoading && !user) {
      // If no user and not loading, set empty billing data
      console.log('ℹ️ No user, setting empty billing data')
      setBillingData({
        subscription: undefined,
        paymentMethods: [],
        invoices: []
      })
    }
    
    return () => {
      mounted = false
    }
  }, [user, authLoading])

  // Show loading state with skeleton UI matching actual layout
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f6fefa]">
        <div className="max-w-4xl mx-auto px-2 md:px-4 py-4 md:py-10">
          <div className="bg-white rounded-2xl shadow border flex flex-col md:flex-row gap-4 md:gap-8 p-0">
            
            {/* Sidebar Skeleton - Matches AccountClient sidebar structure */}
            <div className="w-full md:w-1/4 flex flex-col items-center border-b md:border-b-0 md:border-r md:pr-4 py-4 mb-0">
              {/* Avatar Circle Skeleton */}
              <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse mb-2"></div>
              
              {/* Tagline Skeleton */}
              <div className="w-full px-4 mb-3">
                <div className="h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
              </div>
              
              {/* Navigation Buttons Skeleton */}
              <div className="w-full flex flex-col gap-2 px-2 md:px-0">
                <div className="h-10 bg-green-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Main Content Skeleton - Matches Account/Settings tab */}
            <div className="flex-1 p-2 md:p-6 w-full">
              <div className="bg-white border rounded-xl shadow-sm p-4 md:p-6 max-w-xl w-full mx-auto">
                {/* Welcome Header Skeleton */}
                <div className="h-6 bg-gray-200 rounded w-2/3 mb-2 animate-pulse"></div>
                
                {/* Description Text Skeleton */}
                <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-4 animate-pulse"></div>
                
                {/* Section Title Skeleton */}
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-3 animate-pulse"></div>
                
                {/* Account Info Lines Skeleton */}
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
                
                {/* Input Fields Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                
                {/* Email Field Skeleton */}
                <div className="mb-4">
                  <div className="h-3 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                {/* Save Button Skeleton */}
                <div className="flex justify-end mb-6">
                  <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                
                {/*
                  Usage Stats Skeleton
                  (Commented out per request — not needed)
                  <div className="mt-6 border rounded-lg p-4">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-3 animate-pulse"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                    </div>
                  </div>
                */}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="min-h-screen bg-[#f6fefa] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to load account</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              Retry
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show account page with real user data
  if (user) {
    // Extract user data with proper defaults
    const userData = {
      email: user.email || "No email",
      firstName: user.user_metadata?.first_name || 
                 user.user_metadata?.full_name?.split(' ')[0] || 
                 user.email?.split('@')[0] || 
                 "User",
      lastName: user.user_metadata?.last_name || 
                user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                "",
      displayName: user.user_metadata?.full_name || 
                   user.user_metadata?.first_name || 
                   user.email?.split('@')[0] || 
                   "User",
      avatarUrl: user.user_metadata?.avatar_url || null,
      createdAt: user.created_at 
        ? new Date(user.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : 'Unknown'
    }

    console.log('✅ Rendering account page with user data:', {
      email: userData.email,
      name: userData.displayName,
      hasSubscription: !!billingData?.subscription,
      subscriptionStatus: billingData?.subscription?.status,
      loadingBilling
    })

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
          loadingBilling={loadingBilling} // ⭐ Pass loading state for skeleton UI
        />
      </div>
    )
  }

  // Fallback state - should rarely reach here
  return (
    <div className="min-h-screen bg-[#f6fefa] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-yellow-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Something unexpected happened</h2>
        <p className="text-gray-600 mb-4">We couldn't load your account. Please try again.</p>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Refresh Page
          </button>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  )
}