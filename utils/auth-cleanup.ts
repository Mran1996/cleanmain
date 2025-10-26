/**
 * Authentication Cleanup Utilities
 * 
 * These utilities help resolve authentication issues by clearing
 * invalid sessions and forcing users to re-authenticate properly.
 */

export function clearSupabaseAuth(): boolean {
  try {
    // Clear all Supabase-related localStorage items
    const keysToRemove = [
      'sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token',
      'supabase.auth.token',
      'supabase.auth.session',
      'sb-uqvgyxrjatjrtzscgdgv-auth-token', // Your specific project token
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear all localStorage items that start with 'sb-'
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage as well
    sessionStorage.clear();
    
    console.log('✅ Authentication data cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    return false;
  }
}

export function clearAllAuthData(): boolean {
  try {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear cookies (if any)
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    
    console.log('✅ All authentication data cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing all auth data:', error);
    return false;
  }
}

export function forceReauth(): void {
  // Clear auth data
  clearAllAuthData();
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}