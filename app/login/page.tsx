'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { useSupabase } from '@/components/SupabaseProvider';
import { Logo } from '@/components/Logo';

// NOTE: This is a client component, so metadata must be handled in a parent layout
// SEO metadata is defined in app/layout.tsx for all auth-related pages

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = useSupabase();

  const router = useRouter();

  // Simple auth check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('✅ User is authenticated, redirecting to account');
        router.push('/account');
      }
    };
    
    checkUser();
  }, [supabase.auth, router]);

  // Check for error parameters in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      console.error('OAuth error from URL:', error, errorDescription);
      
      // Handle specific errors
      if (errorDescription && errorDescription.includes('Database error saving new user')) {
        setErrorMsg('Account created successfully, but there was an issue saving your profile. Please try signing in again.');
      } else if (error === 'server_error' && errorDescription?.includes('Unable to exchange external code')) {
        setErrorMsg('Authentication session expired. Please try signing in again.');
      } else if (error === 'access_denied') {
        setErrorMsg('Authentication was cancelled. Please try again if you want to sign in.');
      } else if (error === 'code_challenge_mismatch' || errorDescription?.includes('code challenge')) {
        setErrorMsg('Authentication session expired. Please clear your browser data and try again.');
      } else {
        setErrorMsg(`Authentication error: ${errorDescription || error}`);
      }
      
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      // Clear any existing session and local storage first
      await supabase.auth.signOut();
      
      // Clear any existing OAuth state
      localStorage.removeItem('sb-auth-token');
      localStorage.removeItem('sb-uqvgyxrjatjrtzscgdgv-auth-token');
      sessionStorage.clear();
      
      console.log('Starting Google OAuth sign-in...');
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Redirect URL:', `${window.location.origin}/auth/callback`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('OAuth error:', error);
        setErrorMsg(`Sign-in failed: ${error.message}`);
        toast({
          title: "Sign-in failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log('OAuth response:', data);
      
      if (data?.url) {
        console.log('Redirecting to:', data.url);
        // Use window.location.replace to prevent back button issues
        window.location.replace(data.url);
      } else {
        console.error('No redirect URL received');
        setErrorMsg('No redirect URL received from OAuth provider. Please try again.');
      }
    } catch (err) {
      console.error('Sign-in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMsg(`Sign-in error: ${errorMessage}`);
      toast({
        title: "Sign-in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      // Clear any existing session and local storage first
      await supabase.auth.signOut();
      
      // Clear any existing OAuth state
      localStorage.removeItem('sb-auth-token');
      localStorage.removeItem('sb-uqvgyxrjatjrtzscgdgv-auth-token');
      sessionStorage.clear();
      
      console.log('Starting Microsoft OAuth sign-in...');
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Redirect URL:', `${window.location.origin}/auth/callback`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('OAuth error:', error);
        setErrorMsg(`Sign-in failed: ${error.message}`);
        toast({
          title: "Sign-in failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log('OAuth response:', data);
      
      if (data?.url) {
        console.log('Redirecting to:', data.url);
        // Use window.location.replace to prevent back button issues
        window.location.replace(data.url);
      } else {
        console.error('No redirect URL received');
        setErrorMsg('No redirect URL received from OAuth provider. Please try again.');
      }
    } catch (err) {
      console.error('Sign-in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMsg(`Sign-in error: ${errorMessage}`);
      toast({
        title: "Sign-in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetrySignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    
    // Clear all browser storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Wait a moment before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await handleGoogleSignIn();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6fefa] px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" className="scale-125" />
        </div>
        
        {/* Description */}
        <p className="text-center text-gray-500 mb-8">Access your AI-powered legal dashboard</p>

        {/* Error Message */}
        {errorMsg && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md mb-6">
            <p className="mb-2">{errorMsg}</p>
            {errorMsg.includes('Database error') && (
              <button
                onClick={handleRetrySignIn}
                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
              >
                Try Again
              </button>
            )}
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
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

        {/* Microsoft Sign In Button */}
        <button
          onClick={handleMicrosoftSignIn}
          disabled={loading}
          className="w-full py-3 px-4 bg-[#0078d4] text-white rounded-md font-semibold hover:bg-[#006cbe] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 23 23" fill="currentColor">
                <path d="M0 0h11.377v11.372H0zm11.377 0H23v11.372H11.377zm0 11.628H0V23h11.377zm11.623 0H23V23h-11.377z"/>
              </svg>
              Continue with Microsoft
            </>
          )}
        </button>

        {/* Footer */}
        <div className="mt-6 text-xs text-gray-400 text-center">
          By signing in, you agree to receive email communications from Ask AI Legal.
        </div>
      </div>
    </div>
  );
} 