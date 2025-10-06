import { NextResponse } from "next/server";
import { Purchase } from "@/types/billing";
import { getServerUser } from '@/utils/server-auth';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

// Initialize Stripe client
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
}) : null;

// Check if we're in build time and skip operations
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV;
const isVercelBuild = process.env.VERCEL === '1' && process.env.NODE_ENV === 'production';

export async function GET(req: Request) {
  // Skip during build time
  if (isBuildTime || isVercelBuild) {
    return NextResponse.json({ error: 'API not available during build time' }, { status: 503 });
  }

  // Check if Stripe is configured
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  // Parse URL parameters for pagination
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '5');
  const startingAfter = url.searchParams.get('starting_after') || undefined;

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

    console.log('🔍 Fetching purchase history from Stripe for user:', user.email, 'Page:', page, 'Limit:', limit);

    // Get user's Stripe customer ID from multiple sources
    let stripeCustomerId = null;
    
    // Check users table first
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();
    
    if (userData && userData.stripe_customer_id) {
      stripeCustomerId = userData.stripe_customer_id;
    }
    
    // If not found, try to find by email in Stripe
    if (!stripeCustomerId) {
      try {
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1,
        });
        if (customers.data.length > 0) {
          stripeCustomerId = customers.data[0].id;
          console.log(`Found customer by email: ${user.email} -> ${stripeCustomerId}`);
          
          // Store the customer ID for future use
          await supabase
            .from('users')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('id', user.id);
        }
      } catch (error) {
        console.error('Error searching for customer by email:', error);
      }
    }
    
    if (!stripeCustomerId) {
      console.log('No Stripe customer found for user:', user.email);
      return NextResponse.json({ 
        purchases: [], 
        pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
      });
    }

    // Build Stripe pagination parameters
    const stripeParams: any = {
      customer: stripeCustomerId,
      limit: limit,
      status: 'paid', // Only paid invoices
      expand: ['data.payment_intent'],
    };

    // Add cursor-based pagination if provided
    if (startingAfter) {
      stripeParams.starting_after = startingAfter;
    }

    console.log('🔍 Stripe query params:', stripeParams);

    // Fetch invoices directly from Stripe with native pagination
    const invoicesResponse = await stripe.invoices.list(stripeParams);

    console.log('✅ Found', invoicesResponse.data.length, 'paid invoices from Stripe');

    // Transform Stripe invoices to Purchase format
    const purchases: Purchase[] = invoicesResponse.data.map((invoice: any) => ({
      id: invoice.id,
      document_name: invoice.description || 
                   (invoice.lines?.data?.[0]?.description) || 
                   `Invoice ${invoice.number || invoice.id.slice(-8)}`,
      price: invoice.amount_paid ? invoice.amount_paid / 100 : 0, // Convert cents to dollars
      created_at: invoice.status_transitions?.paid_at 
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : new Date(invoice.created * 1000).toISOString(),
      // Additional invoice info
      currency: invoice.currency || 'usd',
      status: 'paid',
      payment_method: invoice.payment_intent?.payment_method_types?.[0] || 'card',
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: invoice.payment_intent?.id || null,
      metadata: {
        invoice_number: invoice.number,
        billing_reason: invoice.billing_reason,
        subscription_id: invoice.subscription,
        customer_email: invoice.customer_email,
        hosted_invoice_url: invoice.hosted_invoice_url,
        invoice_pdf: invoice.invoice_pdf,
      }
    }));

    // Prepare Stripe-based pagination metadata
    const hasNext = invoicesResponse.has_more;
    const hasPrev = page > 1 || !!startingAfter;
    
    // Get cursor for next page (last item ID)
    const nextCursor = purchases.length > 0 ? purchases[purchases.length - 1].id : null;
    
    // Estimate total count (Stripe doesn't provide exact counts)
    const estimatedTotal = hasNext ? (page * limit) + 1 : (page - 1) * limit + purchases.length;
    const estimatedTotalPages = Math.ceil(estimatedTotal / limit);
    
    // Prepare pagination metadata with Stripe cursors
    const pagination = {
      page,
      limit,
      total: estimatedTotal,
      totalPages: estimatedTotalPages,
      hasNext,
      hasPrev,
      nextCursor: hasNext ? nextCursor : null,
      currentCursor: startingAfter || null,
    };
    
    console.log('📄 Stripe purchase history pagination:', pagination);
    
    // Cache the response for 1 minute (60 seconds) - shorter cache for real-time Stripe data
    return NextResponse.json({ purchases, pagination }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
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