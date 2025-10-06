"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useSupabase } from './SupabaseProvider';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabase();

  useEffect(() => {
    // Get initial session using Supabase's native method
    const getInitialSession = async () => {
      try {
        console.log('🔄 AuthProvider: Getting initial session...');
        
        // Use Supabase's getSession method
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('⚠️ AuthProvider session error:', error.message);
          setUser(null);
        } else {
          console.log('✅ AuthProvider session result:', session?.user?.email || 'No user');
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('❌ AuthProvider error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log('🔄 AuthProvider auth change:', event, session?.user?.email || 'No user');
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signOut = async () => {
    try {
      console.log('🚪 AuthProvider: Signing out...');
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('❌ AuthProvider sign out error:', error);
    }
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
