import { NextResponse } from "next/server";
import { Purchase } from "@/types/billing";
import { getServerUser } from '@/utils/server-auth';
import { createClient } from '@/utils/supabase/server';

// Check if we're in build time and skip operations
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV;
const isVercelBuild = process.env.VERCEL === '1' && process.env.NODE_ENV === 'production';

export async function GET(req: Request) {
  // Parse URL parameters for pagination
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');

  try {
    // Get authenticated user using the new server auth utility
    const { user, error: authError, isAuthenticated } = await getServerUser();
    
    if (!isAuthenticated || !user) {
      return NextResponse.json({ 
        error: "Not authenticated",
        details: authError 
      }, { status: 401 });
    }

    // Create Supabase client for database operations
    const supabase = await createClient();

    console.log('🎯 Fetching purchase history from Supabase for user:', user.email, 'Page:', page, 'Limit:', limit);

    // 🎯 STEP 1: Count total transactions for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('❌ Error counting transactions:', countError);
      return NextResponse.json({ 
        purchases: [], 
        pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        error: 'Failed to count transactions'
      }, { status: 500 });
    }

    const total = totalCount || 0;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    console.log(`📊 Total transactions: ${total}, Total pages: ${totalPages}, Current page: ${page}`);

    // 🎯 STEP 2: Fetch transactions from Supabase with pagination
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (txError) {
      console.error('❌ Error fetching transactions:', txError);
      return NextResponse.json({ 
        purchases: [], 
        pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        error: 'Failed to fetch transactions'
      }, { status: 500 });
    }

    console.log(`✅ Found ${transactions?.length || 0} transactions from Supabase`);

    // 🎯 STEP 3: Transform Supabase transactions to Purchase format
    const purchases: Purchase[] = (transactions || []).map((tx: any) => ({
      id: tx.stripe_invoice_id || tx.stripe_payment_intent_id || tx.id,
      document_name: tx.description || `Transaction ${tx.id.slice(0, 8)}`,
      price: tx.amount || 0,
      created_at: tx.transaction_date || tx.created_at,
      currency: tx.currency || 'usd',
      status: tx.status || 'paid',
      payment_method: 'card',
      stripe_invoice_id: tx.stripe_invoice_id,
      stripe_payment_intent_id: tx.stripe_payment_intent_id,
      metadata: {
        transaction_type: tx.transaction_type,
        plan_id: tx.plan_id,
        subscription_id: tx.stripe_subscription_id,
      }
    }));

    // 🎯 STEP 4: Prepare pagination metadata
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    };
    
    console.log('📄 Supabase purchase history pagination:', pagination);
    
    // Cache the response for 5 minutes (300 seconds) - longer cache for Supabase data
    return NextResponse.json({ purchases, pagination }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error: any) {
    console.error("Purchase history error:", error);
    
    // Handle specific cookie parsing errors
    if (error?.message?.includes('Failed to parse cookie string')) {
      return NextResponse.json({ 
        purchases: [],
        error: 'Authentication data corrupted. Please log out and log in again.',
        code: 'COOKIE_PARSE_ERROR'
      }, { status: 401 });
    }
    
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