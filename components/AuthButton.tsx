/**
 * Authentication Button Component
 * 
 * This component provides a dynamic authentication button that:
 * - Shows "Sign In" when user is not authenticated
 * - Shows "Sign Out" when user is authenticated
 * - Handles Google authentication via NextAuth
 * - Provides navigation to account page after sign in
 * - Manages user session state
 * 
 * The button adapts its styling based on authentication state
 * and provides clear visual feedback to users.
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/SupabaseProvider'
import { useTranslation } from '@/utils/translations'
import { User } from '@supabase/supabase-js'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const supabase = useSupabase()
  const router = useRouter()
  const { t } = useTranslation() // Move hook before conditional return

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  /**
   * Handle user sign in - redirect to login page
   */
  const handleSignIn = () => {
    router.push('/login')
  }

  /**
   * Handle user sign out
   * Clears authentication state and navigates to home page
   */
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error during sign out:', error)
    }
  }

  // Don't render button while loading to prevent hydration issues
  if (isLoading) {
    return null
  }

  const isSignedIn = !!user

  return (
    <button
      onClick={isSignedIn ? handleSignOut : handleSignIn}
      className={`rounded px-4 py-2 transition-colors font-medium ${
        isSignedIn 
          ? 'bg-red-600 text-white hover:bg-red-700' 
          : 'bg-green-600 text-white hover:bg-green-700'
      }`}
      aria-label={isSignedIn ? t('aria_sign_out') : t('aria_sign_in')}
    >
      {isSignedIn ? t('auth_sign_out') : t('auth_sign_in')}
    </button>
  )
}
