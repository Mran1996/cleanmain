'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';
import { Logo } from '@/components/Logo';

export default function SignUpPage() {
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );

  const handleGoogleSignIn = async () => {
    if (!agreeToTerms) {
      setErrorMsg('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }
    
    setErrorMsg('');
    setLoading(true);
    
    console.log('🔐 Attempting Google sign in');
    
    try {
      // Clear any existing session and local storage first
      await supabase.auth.signOut();
      
      // Clear any existing OAuth state
      localStorage.removeItem('sb-auth-token');
      sessionStorage.clear();
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('OAuth error:', error);
        toast({
          title: "Sign-up failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Sign-up error:', err);
      toast({
        title: "Sign-up failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6fefa] px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" className="scale-125" />
        </div>
        
        {/* Description */}
        <p className="text-center text-gray-500 mb-8">Join Ask AI Legal for powerful legal assistance</p>

        {/* Terms Checkbox */}
        <div className="flex items-start mb-6">
          <input
            type="checkbox"
            id="agreeToTerms"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mt-1 checked:bg-emerald-600 checked:border-emerald-600"
          />
          <label htmlFor="agreeToTerms" className="ml-3 text-sm text-gray-600 leading-relaxed">
            I agree to the{' '}
            <a href="/terms" className="text-emerald-700 hover:underline font-medium">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-emerald-700 hover:underline font-medium">
              Privacy Policy
            </a>
          </label>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md mb-4">
            {errorMsg}
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={!agreeToTerms || loading}
          className="w-full py-3 px-4 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {/* Footer */}
        <div className="mt-6 text-xs text-gray-400 text-center">
          By creating an account, you agree to receive email communications from Ask AI Legal.
        </div>
      </div>
    </div>
  );
} 