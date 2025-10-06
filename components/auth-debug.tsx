"use client";

import { useEffect, useState } from 'react';
import { useAuth } from './auth-provider';
import { useSupabase } from './SupabaseProvider';
import { clearSupabaseAuth } from '../utils/auth-cleanup';

export function AuthDebug() {
  const { user, loading } = useAuth();
  const supabase = useSupabase();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check environment variables
        const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
        const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        // Check Supabase session directly
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Check user from Supabase directly
        const { data: { user: directUser }, error: userError } = await supabase.auth.getUser();
        
        setDebugInfo({
          hasUrl,
          hasKey,
          urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
          session: session ? {
            userId: session.user?.id,
            email: session.user?.email,
            expires: session.expires_at
          } : null,
          sessionError: error?.message,
          directUser: directUser ? {
            id: directUser.id,
            email: directUser.email
          } : null,
          userError: userError?.message,
          authProviderUser: user ? {
            id: user.id,
            email: user.email
          } : null,
          authProviderLoading: loading
        });
      } catch (err) {
        setDebugInfo({ error: err.message });
      }
    };

    checkAuth();
  }, [user, loading, supabase]);

  const handleClearAuth = () => {
    if (clearSupabaseAuth()) {
      alert('Auth data cleared! Please refresh the page and log in again.');
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-md text-xs z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Auth Debug Info:</h3>
        <button 
          onClick={handleClearAuth}
          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
        >
          🧹 Clear Auth
        </button>
      </div>
      <pre className="whitespace-pre-wrap overflow-auto max-h-96">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
}
