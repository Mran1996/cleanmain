import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            const cookie = cookieStore.get(name);
            if (!cookie?.value) return undefined;
            
            const value = cookie.value;
            
            // Only validate if it's clearly a problematic cookie
            // Let Supabase handle most cookie parsing internally
            if (value.startsWith('base64-')) {
              try {
                const base64Data = value.substring(7);
                const decoded = atob(base64Data);
                // Only check if it's supposed to be JSON but fails parsing
                if ((decoded.startsWith('{') || decoded.startsWith('[')) && decoded.includes('Unexpected token')) {
                  JSON.parse(decoded);
                }
                return value;
              } catch (parseError: any) {
                // Only filter out if it's clearly corrupted
                if (parseError?.message && parseError.message.includes('Unexpected token')) {
                  console.warn(`[Server] Filtering corrupted base64 cookie ${name}`);
                  return undefined;
                }
                // Otherwise let Supabase handle it
                return value;
              }
            }
            
            // For JSON cookies, only validate if they look problematic
            if (value.startsWith('{') || value.startsWith('[')) {
              try {
                JSON.parse(value);
                return value;
              } catch (parseError: any) {
                // Only filter out clear JSON parsing errors
                if (parseError?.message && parseError.message.includes('Unexpected token')) {
                  console.warn(`[Server] Filtering corrupted JSON cookie ${name}`);
                  return undefined;
                }
                // Otherwise let Supabase handle it
                return value;
              }
            }
            
            // Return all other cookies as-is (let Supabase handle them)
            return value;
          } catch (error) {
            console.warn(`[Server] Error reading cookie ${name}:`, error);
            // Return the raw value if there's an error in our validation
            return cookieStore.get(name)?.value;
          }
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.warn(`[Server] Error setting cookie ${name}:`, error);
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            console.warn(`[Server] Error removing cookie ${name}:`, error);
          }
        },
      },
    }
  )
}

// Service-role Supabase client for server-side operations that must bypass RLS.
// Uses SUPABASE_SERVICE_ROLE_KEY. Do not expose this to browsers.
export async function createAdminClient() {
  const cookieStore = await cookies();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[Server] Missing SUPABASE_SERVICE_ROLE_KEY; admin client will fail.');
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}