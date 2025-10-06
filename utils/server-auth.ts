import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';
import { User } from '@supabase/supabase-js';

/**
 * Server-side authentication utilities
 */

export interface AuthResult {
  user: User | null;
  error: string | null;
  isAuthenticated: boolean;
}

/**
 * Get authenticated user from server-side request
 * This method handles cookie parsing errors gracefully
 */
export async function getServerUser(): Promise<AuthResult> {
  try {
    console.log('[Server Auth] Starting authentication check...');
    const supabase = await createClient();
    
    // Try to get user from session
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log('[Server Auth] Supabase response:', {
      hasUser: !!user,
      userEmail: user?.email,
      errorMessage: error?.message,
      errorCode: error?.status
    });
    
    if (error) {
      console.warn('[Server Auth] Error getting user:', error.message);
      return {
        user: null,
        error: error.message,
        isAuthenticated: false
      };
    }
    
    const result = {
      user,
      error: null,
      isAuthenticated: !!user
    };
    
    console.log('[Server Auth] Final result:', {
      isAuthenticated: result.isAuthenticated,
      userEmail: result.user?.email
    });
    
    return result;
  } catch (error: any) {
    console.error('[Server Auth] Unexpected error:', error);
    return {
      user: null,
      error: error?.message || 'Authentication failed',
      isAuthenticated: false
    };
  }
}

/**
 * Get user from Authorization header (JWT token)
 * Alternative method when cookies are problematic
 */
export async function getUserFromToken(request: NextRequest): Promise<AuthResult> {
  try {
    const authorization = request.headers.get('Authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return {
        user: null,
        error: 'No authorization token provided',
        isAuthenticated: false
      };
    }
    
    const token = authorization.replace('Bearer ', '');
    const supabase = await createClient();
    
    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      return {
        user: null,
        error: error.message,
        isAuthenticated: false
      };
    }
    
    return {
      user,
      error: null,
      isAuthenticated: !!user
    };
  } catch (error: any) {
    return {
      user: null,
      error: error?.message || 'Token verification failed',
      isAuthenticated: false
    };
  }
}

/**
 * Middleware function to protect API routes
 */
export async function requireAuth(handler: (user: User) => Promise<Response>): Promise<Response> {
  const authResult = await getServerUser();
  
  if (!authResult.isAuthenticated || !authResult.user) {
    return new Response(
      JSON.stringify({ 
        error: 'Authentication required',
        details: authResult.error 
      }), 
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  return handler(authResult.user);
}

/**
 * Get user ID safely from server-side auth
 */
export async function getServerUserId(): Promise<string | null> {
  const { user } = await getServerUser();
  return user?.id || null;
}

/**
 * Check if user has specific permissions or roles
 */
export async function checkUserPermissions(requiredRole?: string): Promise<AuthResult & { hasPermission: boolean }> {
  const authResult = await getServerUser();
  
  if (!authResult.isAuthenticated || !authResult.user) {
    return {
      ...authResult,
      hasPermission: false
    };
  }
  
  // If no specific role required, just check if authenticated
  if (!requiredRole) {
    return {
      ...authResult,
      hasPermission: true
    };
  }
  
  // Check user metadata for role
  const userRole = authResult.user.user_metadata?.role || 'user';
  const hasPermission = userRole === requiredRole || userRole === 'admin';
  
  return {
    ...authResult,
    hasPermission
  };
}
