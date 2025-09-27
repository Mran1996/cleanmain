import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Purchase } from "@/types/billing";

// Check if we're in build time and skip operations
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV;
const isVercelBuild = process.env.VERCEL === '1' && process.env.NODE_ENV === 'production';

export async function GET(req: Request) {
  // Skip during build time
  if (isBuildTime || isVercelBuild) {
    return NextResponse.json({ error: 'API not available during build time' }, { status: 503 });
  }

  // Get the cookies from the request
  const cookieStore = await cookies();

  // Create a Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  try {
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = user.id;

    // Query payments from the database
    const { data, error } = await supabase
      .from("payments")
      .select("id, document_name, price, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ purchases: [] }, { status: 500 });
    }

    // Properly type the data
    const purchases: Purchase[] = data || [];
    
    // Cache the response for 5 minutes (300 seconds)
    return NextResponse.json({ purchases }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error("Purchase history error:", error);
    // Provide more detailed error information
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to fetch purchase history';
    
    return NextResponse.json({ 
      purchases: [], 
      error: errorMessage,
      timestamp: new Date().toISOString(),
      path: '/api/purchase-history'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  }
} 