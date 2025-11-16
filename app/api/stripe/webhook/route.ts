import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient as createSupabase } from '@supabase/supabase-js';
import { PRODUCTS, PRICE_MAP } from '@/lib/stripe-config';
import { creditOneTime, resetMonthly, ensureUsageRecord } from '@/lib/usage';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set.');
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const supabaseAdmin = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateUserSubscription(
  customerId: string,
  subscriptionData: Stripe.Subscription
) {
  try {
    const supabase = supabaseAdmin;
    console.log('🔄 Processing subscription update for customer:', customerId);
    
    // First try to find user by stripe_customer_id
    let { data: users, error: queryError } = await supabase
      .from('users')
      .select('id, email')
      .eq('stripe_customer_id', customerId)
      .single();

    // If not found by customer ID, try to find by email from Stripe customer
    if (queryError || !users) {
      console.log('👤 User not found by customer ID, trying to find by email...');
      
      try {
        // Get customer details from Stripe
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        console.log('📧 Retrieved Stripe customer email:', customer.email);
        
        if (customer.email) {
          // Try to find user by email in auth.users table
          const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
          
          if (authError) {
            console.error('❌ Error listing auth users:', authError);
          } else {
            const matchingUser = authUsers?.find(u => u.email === customer.email);
            
            if (matchingUser) {
              console.log(`✅ Found user by email: ${customer.email}, linking to customer ID`);
              
              // Check if user exists in users table
              const { data: existingUser, error: userCheckError } = await supabase
                .from('users')
                .select('id')
                .eq('id', matchingUser.id)
                .single();

              if (userCheckError && userCheckError.code === 'PGRST116') {
                // User doesn't exist in users table, create it
                const { error: insertError } = await supabase
                  .from('users')
                  .insert({
                    id: matchingUser.id,
                    email: matchingUser.email,
                    stripe_customer_id: customerId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  });

                if (insertError) {
                  console.error('❌ Error creating user record:', insertError);
                } else {
                  users = { id: matchingUser.id, email: matchingUser.email };
                  console.log('✅ Created user record with customer ID');
                }
              } else if (!userCheckError) {
                // User exists, update with customer ID
                const { error: updateError } = await supabase
                  .from('users')
                  .update({ 
                    stripe_customer_id: customerId,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', matchingUser.id);

                if (updateError) {
                  console.error('❌ Error updating user with customer ID:', updateError);
                } else {
                  users = { id: matchingUser.id, email: matchingUser.email };
                  console.log('✅ Updated user with customer ID');
                }
              }
            }
          }
        }
      } catch (stripeError) {
        console.error('❌ Error retrieving customer from Stripe:', stripeError);
      }
    }

    if (!users) {
      console.error('❌ Could not find or create user for customer:', customerId);
      return null;
    }

    // Prepare subscription data with proper field mapping
    const subscription = subscriptionData as any; // Cast to access all fields
    
    // Extract plan_id from subscription items
    const planId = subscription.items?.data?.[0]?.price?.id || null;
    
    console.log('📊 Subscription raw data from Stripe:', {
      id: subscription.id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      billing_cycle_anchor: subscription.billing_cycle_anchor,
      created: subscription.created,
      items: subscription.items?.data?.length,
      plan_id: planId
    });
    
    // Extract billing_cycle_anchor (when subscription renews each billing period)
    const billingCycleAnchor = subscription.billing_cycle_anchor || subscription.created || null;
    
    // Calculate period dates if missing (Stripe sometimes doesn't include them)
    let currentPeriodStart = subscription.current_period_start;
    let currentPeriodEnd = subscription.current_period_end;
    
    if (!currentPeriodStart || !currentPeriodEnd) {
      console.log('⚠️ Period dates missing, calculating from billing cycle anchor or created date...');
      const anchorDate = subscription.billing_cycle_anchor || subscription.created;
      const plan = subscription.items?.data?.[0]?.price || subscription.plan;
      const interval = plan?.interval || 'month';
      const intervalCount = plan?.interval_count || 1;
      
      // Calculate current period based on created date and interval
      const now = Math.floor(Date.now() / 1000);
      const createdDate = new Date(anchorDate * 1000);
      const periodsSinceCreation = Math.floor((now - anchorDate) / (intervalCount * (interval === 'month' ? 2592000 : interval === 'year' ? 31536000 : 86400)));
      
      // Calculate current period start
      const periodStartDate = new Date(createdDate);
      if (interval === 'month') {
        periodStartDate.setMonth(periodStartDate.getMonth() + (periodsSinceCreation * intervalCount));
      } else if (interval === 'year') {
        periodStartDate.setFullYear(periodStartDate.getFullYear() + (periodsSinceCreation * intervalCount));
      } else if (interval === 'day') {
        periodStartDate.setDate(periodStartDate.getDate() + (periodsSinceCreation * intervalCount));
      }
      currentPeriodStart = Math.floor(periodStartDate.getTime() / 1000);
      
      // Calculate current period end
      const periodEndDate = new Date(periodStartDate);
      if (interval === 'month') {
        periodEndDate.setMonth(periodEndDate.getMonth() + intervalCount);
      } else if (interval === 'year') {
        periodEndDate.setFullYear(periodEndDate.getFullYear() + intervalCount);
      } else if (interval === 'day') {
        periodEndDate.setDate(periodEndDate.getDate() + intervalCount);
      }
      currentPeriodEnd = Math.floor(periodEndDate.getTime() / 1000);
      
      console.log('✅ Calculated period dates:', {
        start: new Date(currentPeriodStart * 1000).toISOString(),
        end: new Date(currentPeriodEnd * 1000).toISOString()
      });
    }
    
    const subscriptionUpdate = {
      user_id: users.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      plan_id: planId,
      current_period_start: currentPeriodStart 
        ? new Date(currentPeriodStart * 1000).toISOString() 
        : null,
      current_period_end: currentPeriodEnd 
        ? new Date(currentPeriodEnd * 1000).toISOString() 
        : null,
      billing_cycle_anchor: billingCycleAnchor || null, // Store as Unix timestamp (BIGINT)
      canceled_at: subscription.canceled_at 
        ? new Date(subscription.canceled_at * 1000).toISOString() 
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      created_at: subscription.created 
        ? new Date(subscription.created * 1000).toISOString()
        : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('💾 Saving subscription data:', {
      user_id: subscriptionUpdate.user_id,
      subscription_id: subscriptionUpdate.stripe_subscription_id,
      status: subscriptionUpdate.status,
      plan_id: subscriptionUpdate.plan_id,
      current_period_start: subscriptionUpdate.current_period_start,
      current_period_end: subscriptionUpdate.current_period_end,
      billing_cycle_anchor: subscriptionUpdate.billing_cycle_anchor,
      customer_id: subscriptionUpdate.stripe_customer_id
    });

    // ⭐ Use Supabase upsert with conflict resolution
    const { data: upsertResult, error: updateError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionUpdate, {
        onConflict: 'stripe_subscription_id',
        ignoreDuplicates: false
      })
      .select();

    if (updateError) {
      console.error('❌ Error saving subscription to Supabase:', updateError);
      console.error('❌ Subscription data that failed:', subscriptionUpdate);
      return null;
    } else {
      console.log('✅ Successfully saved subscription to Supabase for user:', users.id);
      console.log('✅ Supabase response:', upsertResult);
      return users.id; // Return user ID for transaction processing
    }
  } catch (error) {
    console.error('Error in updateUserSubscription:', error);
  }
}

async function updateSubscriptionPaymentStatus(
  subscriptionId: string,
  status: 'paid' | 'failed',
  invoiceData?: any
) {
  try {
    const supabase = supabaseAdmin;
    
    // Build update object with period dates if available from invoice
    const updateData: any = {
      status: status === 'paid' ? 'active' : 'past_due',
      updated_at: new Date().toISOString(),
    };
    
    // Update period dates from invoice if available
    if (invoiceData && status === 'paid') {
      if (invoiceData.period_start) {
        updateData.current_period_start = new Date(invoiceData.period_start * 1000).toISOString();
      }
      if (invoiceData.period_end) {
        updateData.current_period_end = new Date(invoiceData.period_end * 1000).toISOString();
      }
    }
    
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', subscriptionId);

    if (updateError) {
      console.error('Error updating subscription payment status:', updateError);
    } else {
      console.log(`Successfully updated subscription ${subscriptionId} status to:`, status === 'paid' ? 'active' : 'past_due');
      if (updateData.current_period_start || updateData.current_period_end) {
        console.log('✅ Updated period dates:', {
          start: updateData.current_period_start,
          end: updateData.current_period_end
        });
      }
    }
  } catch (error) {
    console.error('Error in updateSubscriptionPaymentStatus:', error);
  }
}

async function saveTransactionData(
  invoiceData: any,
  status: 'paid' | 'failed' | 'canceled'
) {
  try {
    const supabase = supabaseAdmin;
    console.log('💳 Processing transaction for invoice:', invoiceData.id);
    
    // Extract plan_id from invoice if available
    const planId = invoiceData.lines?.data?.[0]?.price?.id || 
                   invoiceData.subscription_details?.items?.[0]?.price?.id ||
                   null;
    
    // Detect if this is a subscription renewal (billing_reason indicates renewal)
    const isRenewal = invoiceData.billing_reason === 'subscription_cycle';
    
    // Get user from subscription OR customer
    let userId: string | null = null;
    let subscriptionId: string | null = null;
    
    if (invoiceData.subscription) {
      // Try to find subscription first
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('user_id, stripe_subscription_id')
        .eq('stripe_subscription_id', invoiceData.subscription)
        .single();

      if (subscription) {
        userId = subscription.user_id;
        subscriptionId = subscription.stripe_subscription_id;
        console.log('✅ Found user from subscription:', { userId, subscriptionId });
      } else if (subError) {
        console.log('⚠️ Subscription not found in DB, attempting to create from Stripe:', subError.message);
        
        // Try to create subscription if it doesn't exist
        if (invoiceData.customer) {
          try {
            const subscriptionFromStripe = await stripe.subscriptions.retrieve(invoiceData.subscription);
            const createdUserId = await updateUserSubscription(invoiceData.customer, subscriptionFromStripe);
            
            if (createdUserId) {
              userId = createdUserId;
              subscriptionId = invoiceData.subscription;
              console.log('✅ Created subscription and got user:', { userId, subscriptionId });
              // Wait a moment for DB to commit
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.error('❌ Could not create subscription for transaction:', error);
          }
        }
      }
    }
    
    // If no subscription, try to find user by customer ID
    if (!userId && invoiceData.customer) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', invoiceData.customer)
        .single();

      if (userData) {
        userId = userData.id;
        console.log('✅ Found user from customer ID:', userId);
      } else {
        console.error('❌ Could not find user for customer:', invoiceData.customer);
        return;
      }
    }
    
    if (!userId) {
      console.error('❌ No user ID found for transaction, cannot save');
      return;
    }

    // ⭐ CRITICAL FIX: Detect subscription payments even if subscription ID is missing
    const isSubscriptionPayment = (
      subscriptionId !== null || 
      invoiceData.billing_reason === 'subscription_create' ||
      invoiceData.billing_reason === 'subscription_cycle' ||
      invoiceData.billing_reason === 'subscription_update'
    );
    
    // ⭐ ADDITIONAL VALIDATION: Check if this is explicitly marked as one-time
    const isExplicitOneTime = (
      invoiceData.billing_reason === 'one_time' ||
      invoiceData.billing_reason === 'manual' ||
      (!invoiceData.subscription && !invoiceData.billing_reason)
    );
    
    // ⭐ FINAL TYPE DETERMINATION: Subscription takes precedence
    const finalTransactionType = isSubscriptionPayment ? 'subscription' : 'one_time';
    
    console.log('📋 Transaction classification:', {
      invoice_id: invoiceData.id,
      subscription_id: invoiceData.subscription,
      billing_reason: invoiceData.billing_reason,
      is_subscription_payment: isSubscriptionPayment,
      is_explicit_one_time: isExplicitOneTime,
      final_type: finalTransactionType,
      is_renewal: isRenewal
    });
    
    console.log('📋 Transaction details:', {
      invoice_id: invoiceData.id,
      subscription: invoiceData.subscription,
      customer: invoiceData.customer,
      plan_id: planId,
      status: status,
      billing_reason: invoiceData.billing_reason,
      is_renewal: isRenewal,
      is_subscription_payment: isSubscriptionPayment,
      has_subscription_id: !!subscriptionId
    });

    // Prepare comprehensive metadata
    const baseMetadata: any = {
      invoice_number: invoiceData.number,
      billing_reason: invoiceData.billing_reason,
      attempt_count: invoiceData.attempt_count,
    };
    
    // Add period dates for subscription invoices
    if (invoiceData.subscription && invoiceData.period_start && invoiceData.period_end) {
      baseMetadata.period_start = invoiceData.period_start;
      baseMetadata.period_end = invoiceData.period_end;
    }
    
    // Merge custom metadata from Stripe
    if (invoiceData.metadata && typeof invoiceData.metadata === 'object') {
      baseMetadata.custom = invoiceData.metadata;
    }
    
    // Include line items if available
    if (Array.isArray(invoiceData.line_items)) {
      baseMetadata.line_items = invoiceData.line_items;
    }
    
    // Include session/plan info
    if (invoiceData.session_id) {
      baseMetadata.session_id = invoiceData.session_id;
    }
    if (invoiceData.plan) {
      baseMetadata.plan = invoiceData.plan;
    }

    // Prepare transaction data with isRenewal flag and proper type detection
    const transactionData = {
      user_id: userId,
      stripe_payment_intent_id: invoiceData.payment_intent || null,
      stripe_invoice_id: invoiceData.id,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: invoiceData.customer,
      plan_id: planId,
      amount: invoiceData.amount_paid || invoiceData.total || 0,
      currency: invoiceData.currency || 'usd',
      status: status,
      payment_method: invoiceData.payment_method_types?.[0] || 'card',
      transaction_type: finalTransactionType, // ⭐ ENHANCED: Use finalTransactionType with validation
      is_renewal: isRenewal,
      description: invoiceData.description || 
        (finalTransactionType === 'subscription'
          ? (isRenewal ? `Subscription renewal - ${status}` : `Subscription payment - ${status}`) 
          : `One-time payment - ${status}`),
      metadata: baseMetadata,
      transaction_date: invoiceData.status_transitions?.paid_at 
        ? new Date(invoiceData.status_transitions.paid_at * 1000).toISOString()
        : new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('💾 Saving transaction:', {
      user_id: transactionData.user_id,
      invoice_id: transactionData.stripe_invoice_id,
      subscription_id: transactionData.stripe_subscription_id,
      plan_id: transactionData.plan_id,
      amount: transactionData.amount,
      status: transactionData.status,
      type: transactionData.transaction_type,
      is_renewal: transactionData.is_renewal
    });

    // Idempotent upsert: check for existing by invoice or payment intent
    let existingId: string | undefined;
    
    if (invoiceData.id) {
      const { data: existingByInvoice } = await supabase
        .from('transactions')
        .select('id')
        .eq('stripe_invoice_id', invoiceData.id)
        .limit(1)
        .single();
      existingId = existingByInvoice?.id;
    }
    
    if (!existingId && invoiceData.payment_intent) {
      const { data: existingByPi } = await supabase
        .from('transactions')
        .select('id')
        .eq('stripe_payment_intent_id', invoiceData.payment_intent)
        .limit(1)
        .single();
      existingId = existingByPi?.id;
    }

    if (existingId) {
      // Update existing transaction
      const { error: updateError } = await supabase
        .from('transactions')
        .update(transactionData)
        .eq('id', existingId);
        
      if (updateError) {
        console.error('❌ Error updating existing transaction:', updateError);
        console.error('❌ Transaction data that failed:', transactionData);
      } else {
        console.log(`✅ Updated existing ${isRenewal ? 'renewal' : ''} ${status} transaction:`, invoiceData.id);
      }
    } else {
      // Insert new transaction
      const { error: insertError } = await supabase
        .from('transactions')
        .insert(transactionData);
        
      if (insertError) {
        console.error('❌ Error inserting new transaction:', insertError);
        console.error('❌ Transaction data that failed:', transactionData);
      } else {
        console.log(`✅ Successfully saved new ${isRenewal ? 'RENEWAL' : ''} ${status} transaction:`, invoiceData.id);
      }
    }
  } catch (error) {
    console.error('❌ Error in saveTransactionData:', error);
  }
}

// ⭐ CRITICAL: Tell Next.js to NOT parse the body (Stripe needs raw body for signature verification)
export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: string;
  let signature: string | null;
  
  try {
    // Get raw body as text for signature verification
    body = await req.text();
    signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ No Stripe signature found in headers');
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error('❌ Webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    console.log('📬 Received webhook with signature');

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
      console.log('✅ Webhook signature verified:', event.type);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      console.error('Signature:', signature);
      console.error('Webhook secret (first 10 chars):', webhookSecret.substring(0, 10) + '...');
      return NextResponse.json({ 
        error: 'Invalid signature',
        message: err.message 
      }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        console.log(`📬 Received ${event.type} for subscription:`, subscription.id);
        console.log('📋 Subscription details:', {
          status: subscription.status,
          customer: subscription.customer,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
        });
        
        // Expand items to ensure we have price data
        let fullSubscription: any = subscription;
        try {
          if (!subscription.items?.data?.[0]?.price?.id) {
            console.log('⚠️ Price data not expanded, fetching full subscription from Stripe...');
            fullSubscription = await stripe.subscriptions.retrieve(subscription.id, {
              expand: ['items.data.price']
            });
            console.log('✅ Retrieved full subscription with price:', fullSubscription.items?.data?.[0]?.price?.id);
          }
        } catch (expandError) {
          console.error('❌ Failed to expand subscription:', expandError);
        }
        
        await updateUserSubscription(
          fullSubscription.customer as string,
          fullSubscription
        );
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id, 'Mode:', session.mode);
        
        // Update user with Stripe customer ID from the session
        const meta = (session.metadata || {}) as any;
        const userIdFromMeta = meta.user_id || meta.userId;
        if (session.customer && userIdFromMeta) {
          try {
            const supabase = supabaseAdmin;
            
            const { error: updateError } = await supabase
              .from('users')
              .update({ 
                stripe_customer_id: session.customer as string,
                updated_at: new Date().toISOString()
              })
              .eq('id', userIdFromMeta);

            if (updateError) {
              console.error('Error updating user with customer ID:', updateError);
            } else {
              console.log(`Successfully linked user ${userIdFromMeta} to customer ${session.customer}`);
            }
          } catch (error) {
            console.error('Error in checkout.session.completed handler:', error);
          }
        }

        // Handle subscription mode - ensure subscription is created in DB
        if (session.mode === 'subscription' && session.subscription) {
          console.log('📝 Subscription checkout completed, ensuring subscription is in DB:', session.subscription);
          try {
            const subscriptionFromStripe: any = await stripe.subscriptions.retrieve(session.subscription as string, {
              expand: ['items.data.price']
            });
            
            const userId = await updateUserSubscription(
              session.customer as string,
              subscriptionFromStripe
            );
            
            if (userId) {
              console.log('✅ Subscription saved from checkout.session.completed for user:', userId);
              
              // ⭐ IMPORTANT: For new subscriptions, check if we should reset monthly credits
              // This handles cases where invoice.payment_succeeded might come before this event
              const { data: usage } = await supabaseAdmin
                .from('document_usage')
                .select('monthly_remaining')
                .eq('user_id', userId)
                .single();
              
              if (usage && usage.monthly_remaining === 0) {
                console.log('💳 New subscription detected with 0 credits, will reset on invoice.payment_succeeded');
              }
            }
          } catch (subError) {
            console.error('❌ Failed to save subscription from checkout session:', subError);
          }
        }

        // Record one-time payments (e.g., Full Service) when mode is payment
        if (session.mode === 'payment' && session.payment_status === 'paid') {
          try {
            // Retrieve line items for richer transaction metadata
            let lineItems: Stripe.ApiList<Stripe.LineItem> | null = null;
            try {
              lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
                limit: 50,
                expand: ['data.price']
              });
            } catch (liErr) {
              console.warn('⚠️ Could not retrieve line items for session:', session.id, liErr);
            }

            const simplifiedItems = (lineItems?.data || []).map((item) => {
              const priceObj = item.price && typeof item.price === 'object' ? (item.price as Stripe.Price) : null;
              const priceId = priceObj ? priceObj.id : (typeof item.price === 'string' ? item.price : undefined);
              const descriptionFromPrice = priceObj?.nickname || (typeof priceObj?.product === 'string' ? priceObj.product : undefined);
              return {
                description: item.description || descriptionFromPrice || 'Item',
                amount_total: item.amount_total || 0,
                currency: item.currency || session.currency || 'usd',
                quantity: item.quantity || 1,
                price_id: priceId,
              };
            });

            // Detect purchased product(s) using configured price IDs
            const purchasedProductNames: string[] = [];
            for (const sItem of simplifiedItems) {
              if (sItem.price_id === PRICE_MAP[PRODUCTS.FULL_SERVICE]) {
                purchasedProductNames.push(PRODUCTS.FULL_SERVICE);
              } else if (sItem.price_id === PRICE_MAP[PRODUCTS.COURT_READY]) {
                purchasedProductNames.push(PRODUCTS.COURT_READY);
              } else if (sItem.price_id === PRICE_MAP[PRODUCTS.CASE_BUILDER]) {
                purchasedProductNames.push(PRODUCTS.CASE_BUILDER);
              } else if (sItem.price_id === PRICE_MAP[PRODUCTS.QUICK_LEGAL]) {
                purchasedProductNames.push(PRODUCTS.QUICK_LEGAL);
              }
            }

            // Build an invoice-like object for saveTransactionData with richer metadata
            const invoiceLike: any = {
              id: session.id,
              customer: session.customer,
              subscription: null, // One-time payment, no subscription
              payment_intent: session.payment_intent,
              amount_paid: session.amount_total ?? session.amount_subtotal ?? 0,
              total: session.amount_total ?? 0,
              currency: session.currency ?? 'usd',
              payment_method_types: ['card'],
              status_transitions: { paid_at: Math.floor(Date.now() / 1000) },
              number: null,
              billing_reason: 'one_time', // ⭐ Explicitly mark as one-time (not renewal)
              attempt_count: 1,
              // Prefer human-readable description if we recognize a product
              description: purchasedProductNames[0] || (session.metadata?.plan || 'One-time payment'),
              // Attach metadata to help downstream entitlement checks
              metadata: {
                session_id: session.id,
                plan: meta?.plan,
                user_id: userIdFromMeta,
                products: purchasedProductNames,
                price_ids: simplifiedItems.map(i => i.price_id).filter(Boolean),
              },
              // Include simplified line items for purchase history
              line_items: simplifiedItems
            };

            console.log('📄 Saving one-time payment transaction:', {
              session_id: session.id,
              amount: invoiceLike.amount_paid,
              products: purchasedProductNames
            });

            await saveTransactionData(invoiceLike, 'paid');

            // Avoid duplicate credit by checking if transaction already exists
            const paymentIntentId = session.payment_intent as string | undefined;
            const invoiceId = session.invoice as string | undefined;
            const { data: existingTx } = await supabaseAdmin
              .from('transactions')
              .select('id')
              .or(
                [
                  paymentIntentId ? `stripe_payment_intent_id.eq.${paymentIntentId}` : '',
                  invoiceId ? `stripe_invoice_id.eq.${invoiceId}` : ''
                ].filter(Boolean).join(',')
              )
              .eq('status', 'paid')
              .limit(1);

            if (existingTx && existingTx.length > 0) {
              console.log('ℹ️ Skipping credit: transaction already recorded as paid');
              break;
            }

            // Credit one-time document pack (150) to the user
            try {
              const userIdToCredit = userIdFromMeta || undefined;
              let resolvedUserId = userIdToCredit;
              if (!resolvedUserId && session.customer) {
                const { data: byCust } = await supabaseAdmin
                  .from('users')
                  .select('id')
                  .eq('stripe_customer_id', session.customer as string)
                  .single();
                resolvedUserId = byCust?.id;
              }
              if (resolvedUserId) {
                console.log('💳 Crediting one-time pack to user:', resolvedUserId);
                
                // ⭐ ENSURE usage record exists BEFORE checking balance
                await ensureUsageRecord(supabaseAdmin, resolvedUserId);
                
                // Check current balance before credit
                const { data: beforeCredit } = await supabaseAdmin
                  .from('document_usage')
                  .select('one_time_remaining, monthly_remaining, api_generated_total')
                  .eq('user_id', resolvedUserId)
                  .single();
                
                const balanceBefore = beforeCredit?.one_time_remaining || 0;
                console.log('📊 Usage state before credit:', {
                  one_time_remaining: beforeCredit?.one_time_remaining,
                  monthly_remaining: beforeCredit?.monthly_remaining,
                  api_generated_total: beforeCredit?.api_generated_total
                });
                
                console.log('🔄 Calling creditOneTime with:', {
                  userId: resolvedUserId,
                  amount: 150
                });
                
                // ⭐ CRITICAL: Retry logic to ensure credit is saved
                let creditAttempts = 0;
                let creditSuccess = false;
                const maxAttempts = 3;
                
                while (creditAttempts < maxAttempts && !creditSuccess) {
                  try {
                    creditAttempts++;
                    await creditOneTime(supabaseAdmin, resolvedUserId, 150);
                    creditSuccess = true;
                    console.log(`✅ Credit saved successfully on attempt ${creditAttempts}`);
                  } catch (creditError) {
                    console.error(`❌ Credit attempt ${creditAttempts} failed:`, creditError);
                    if (creditAttempts < maxAttempts) {
                      console.log(`🔄 Retrying... (${maxAttempts - creditAttempts} attempts left)`);
                      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                    } else {
                      throw creditError; // Re-throw after max attempts
                    }
                  }
                }
                
                // Wait a moment for the update to commit
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Verify credit was applied
                const { data: afterCredit } = await supabaseAdmin
                  .from('document_usage')
                  .select('one_time_remaining, monthly_remaining, api_generated_total')
                  .eq('user_id', resolvedUserId)
                  .single();
                
                const balanceAfter = afterCredit?.one_time_remaining || 0;
                console.log('✅ Credited one-time document pack (150) to user:', resolvedUserId);
                console.log('📊 Usage state after credit:', {
                  one_time_remaining: afterCredit?.one_time_remaining,
                  monthly_remaining: afterCredit?.monthly_remaining,
                  api_generated_total: afterCredit?.api_generated_total
                });
                console.log('📊 Credit change: +' + (balanceAfter - balanceBefore));
                
                // Comprehensive verification
                const expectedChange = 150;
                const actualChange = balanceAfter - balanceBefore;
                if (actualChange !== expectedChange) {
                  console.error('⚠️ WARNING: Credit amount mismatch!');
                  console.error('⚠️ Expected change: +' + expectedChange);
                  console.error('⚠️ Actual change: +' + actualChange);
                  console.error('⚠️ This may require manual intervention or backfill');
                } else {
                  console.log('✅ Credit verification passed!');
                }
                
                // Verify transaction was recorded
                const { data: txVerify } = await supabaseAdmin
                  .from('transactions')
                  .select('id, transaction_type, status')
                  .eq('stripe_invoice_id', session.id)
                  .single();
                
                if (txVerify) {
                  console.log('✅ Transaction recorded:', {
                    id: txVerify.id,
                    type: txVerify.transaction_type,
                    status: txVerify.status
                  });
                } else {
                  console.warn('⚠️ Transaction not found in database for session:', session.id);
                }
              } else {
                console.warn('⚠️ Could not resolve user to credit one-time pack');
                console.warn('⚠️ Session details:', {
                  session_id: session.id,
                  customer: session.customer,
                  user_id_from_meta: userIdFromMeta
                });
              }
            } catch (creditErr) {
              console.error('❌ Failed to credit one-time document pack:', creditErr);
              console.error('❌ Credit error details:', {
                user_id: userIdFromMeta,
                customer: session.customer,
                error: creditErr instanceof Error ? creditErr.message : String(creditErr),
                stack: creditErr instanceof Error ? creditErr.stack : undefined
              });
            }
            console.log('✅ One-time payment transaction saved successfully');
          } catch (recordError) {
            console.error('❌ Failed to record one-time payment from session:', recordError);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        console.log('💵 Payment succeeded for invoice:', invoice.id);
        console.log('📋 Invoice details:', {
          subscription: invoice.subscription,
          billing_reason: invoice.billing_reason,
          amount_paid: invoice.amount_paid,
          customer: invoice.customer
        });
        
        if (invoice.subscription) {
          console.log('🔗 Invoice linked to subscription:', invoice.subscription);
          
          // STEP 1: Update subscription status with period dates
          await updateSubscriptionPaymentStatus(
            invoice.subscription as string,
            'paid',
            invoice
          );
          
          // STEP 2: Save transaction record (will auto-link to subscription and detect renewal)
          await saveTransactionData(invoice, 'paid');

          // STEP 3: Reset monthly credits to 150 for this subscription's user
          try {
            const { data: sub } = await supabaseAdmin
              .from('subscriptions')
              .select('user_id, plan_id, status')
              .eq('stripe_subscription_id', invoice.subscription as string)
              .single();
              
            const userId = sub?.user_id;
            if (userId) {
              console.log('💳 Resetting monthly credits for user:', userId);
              console.log('📋 Subscription status:', sub.status);
              
              // ⭐ ENSURE usage record exists BEFORE checking balance
              await ensureUsageRecord(supabaseAdmin, userId);
              
              // Check current balance before reset
              const { data: beforeReset } = await supabaseAdmin
                .from('document_usage')
                .select('monthly_remaining, monthly_limit, one_time_remaining, api_generated_total')
                .eq('user_id', userId)
                .single();
              
              const balanceBefore = beforeReset?.monthly_remaining || 0;
              console.log('📊 Usage state before reset:', {
                monthly_remaining: beforeReset?.monthly_remaining,
                monthly_limit: beforeReset?.monthly_limit,
                one_time_remaining: beforeReset?.one_time_remaining,
                api_generated_total: beforeReset?.api_generated_total
              });
              
              const start = invoice.period_start ? new Date(invoice.period_start * 1000) : undefined;
              const end = invoice.period_end ? new Date(invoice.period_end * 1000) : undefined;
              
              console.log('🔄 Calling resetMonthly with:', {
                userId,
                limit: 150,
                period_start: start?.toISOString(),
                period_end: end?.toISOString()
              });
              
              // ⭐ CRITICAL: Retry logic to ensure monthly reset is saved
              let resetAttempts = 0;
              let resetSuccess = false;
              const maxAttempts = 3;
              
              while (resetAttempts < maxAttempts && !resetSuccess) {
                try {
                  resetAttempts++;
                  await resetMonthly(supabaseAdmin, userId, 150, start, end);
                  resetSuccess = true;
                  console.log(`✅ Monthly reset saved successfully on attempt ${resetAttempts}`);
                } catch (resetError) {
                  console.error(`❌ Reset attempt ${resetAttempts} failed:`, resetError);
                  if (resetAttempts < maxAttempts) {
                    console.log(`🔄 Retrying... (${maxAttempts - resetAttempts} attempts left)`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                  } else {
                    throw resetError; // Re-throw after max attempts
                  }
                }
              }
              
              // Wait a moment for the update to commit
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Verify reset was applied
              const { data: afterReset } = await supabaseAdmin
                .from('document_usage')
                .select('monthly_remaining, monthly_limit, monthly_period_start, monthly_period_end, one_time_remaining, api_generated_total')
                .eq('user_id', userId)
                .single();
              
              const balanceAfter = afterReset?.monthly_remaining || 0;
              console.log('✅ Reset monthly credits to 150 for user:', userId);
              console.log('📊 Usage state after reset:', {
                monthly_remaining: afterReset?.monthly_remaining,
                monthly_limit: afterReset?.monthly_limit,
                monthly_period_start: afterReset?.monthly_period_start,
                monthly_period_end: afterReset?.monthly_period_end,
                one_time_remaining: afterReset?.one_time_remaining,
                api_generated_total: afterReset?.api_generated_total
              });
              
              // Comprehensive verification
              const issues: string[] = [];
              if (balanceAfter !== 150) {
                issues.push(`Monthly remaining mismatch: expected 150, got ${balanceAfter}`);
              }
              if (afterReset?.monthly_limit !== 150) {
                issues.push(`Monthly limit mismatch: expected 150, got ${afterReset?.monthly_limit}`);
              }
              if (!afterReset?.monthly_period_start) {
                issues.push('Missing monthly_period_start');
              }
              if (!afterReset?.monthly_period_end) {
                issues.push('Missing monthly_period_end');
              }
              
              if (issues.length > 0) {
                console.error('⚠️ WARNING: Credit reset verification failed!');
                console.error('⚠️ Issues found:', issues);
                console.error('⚠️ This may require manual intervention or backfill');
              } else {
                console.log('✅ All verification checks passed!');
              }
            } else {
              console.warn('⚠️ Subscription user not found when resetting monthly credits');
              console.warn('⚠️ Subscription query result:', sub);
            }
          } catch (resetErr) {
            console.error('❌ Failed to reset monthly credits:', resetErr);
            console.error('❌ Reset error details:', {
              subscription_id: invoice.subscription,
              error: resetErr instanceof Error ? resetErr.message : String(resetErr),
              stack: resetErr instanceof Error ? resetErr.stack : undefined
            });
          }
          
          console.log('✅ Subscription payment processing complete');
        } else {
          console.log('💳 One-time payment via invoice (no subscription linked)');
          
          // STEP 1: Save one-time transaction
          await saveTransactionData(invoice, 'paid');
          
          // STEP 2: Credit one-time document pack (150) to the user
          try {
            // Get user from customer ID
            let userId: string | null = null;
            if (invoice.customer) {
              const { data: userData } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('stripe_customer_id', invoice.customer)
                .single();
              
              userId = userData?.id || null;
            }
            
            if (userId) {
              console.log('💳 Crediting one-time pack for invoice payment to user:', userId);
              
              // ⭐ ENSURE usage record exists BEFORE checking balance
              await ensureUsageRecord(supabaseAdmin, userId);
              
              // Check current balance before credit
              const { data: beforeCredit } = await supabaseAdmin
                .from('document_usage')
                .select('one_time_remaining, monthly_remaining, api_generated_total')
                .eq('user_id', userId)
                .single();
              
              const balanceBefore = beforeCredit?.one_time_remaining || 0;
              console.log('📊 Usage state before credit:', {
                one_time_remaining: beforeCredit?.one_time_remaining,
                monthly_remaining: beforeCredit?.monthly_remaining,
                api_generated_total: beforeCredit?.api_generated_total
              });
              
              console.log('🔄 Calling creditOneTime with:', {
                userId,
                amount: 150
              });
              
              // ⭐ CRITICAL: Retry logic to ensure credit is saved
              let creditAttempts = 0;
              let creditSuccess = false;
              const maxAttempts = 3;
              
              while (creditAttempts < maxAttempts && !creditSuccess) {
                try {
                  creditAttempts++;
                  await creditOneTime(supabaseAdmin, userId, 150);
                  creditSuccess = true;
                  console.log(`✅ Credit saved successfully on attempt ${creditAttempts}`);
                } catch (creditError) {
                  console.error(`❌ Credit attempt ${creditAttempts} failed:`, creditError);
                  if (creditAttempts < maxAttempts) {
                    console.log(`🔄 Retrying... (${maxAttempts - creditAttempts} attempts left)`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                  } else {
                    throw creditError; // Re-throw after max attempts
                  }
                }
              }
              
              // Wait a moment for the update to commit
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Verify credit was applied
              const { data: afterCredit } = await supabaseAdmin
                .from('document_usage')
                .select('one_time_remaining, monthly_remaining, api_generated_total')
                .eq('user_id', userId)
                .single();
              
              const balanceAfter = afterCredit?.one_time_remaining || 0;
              console.log('✅ Credited one-time document pack (150) for invoice to user:', userId);
              console.log('📊 Usage state after credit:', {
                one_time_remaining: afterCredit?.one_time_remaining,
                monthly_remaining: afterCredit?.monthly_remaining,
                api_generated_total: afterCredit?.api_generated_total
              });
              console.log('📊 Credit change: +' + (balanceAfter - balanceBefore));
              
              // Comprehensive verification
              const expectedChange = 150;
              const actualChange = balanceAfter - balanceBefore;
              if (actualChange !== expectedChange) {
                console.error('⚠️ WARNING: Credit amount mismatch!');
                console.error('⚠️ Expected change: +' + expectedChange);
                console.error('⚠️ Actual change: +' + actualChange);
                console.error('⚠️ This may require manual intervention or backfill');
              } else {
                console.log('✅ Credit verification passed!');
              }
              
              // Verify transaction was recorded
              const { data: txVerify } = await supabaseAdmin
                .from('transactions')
                .select('id, transaction_type, status')
                .eq('stripe_invoice_id', invoice.id)
                .single();
              
              if (txVerify) {
                console.log('✅ Transaction recorded:', {
                  id: txVerify.id,
                  type: txVerify.transaction_type,
                  status: txVerify.status
                });
                
                // ⭐ VERIFY TRANSACTION TYPE IS CORRECT
                if (txVerify.transaction_type !== 'one_time') {
                  console.error('⚠️ WARNING: Transaction type mismatch!');
                  console.error('⚠️ Expected: one_time, Got:', txVerify.transaction_type);
                  console.error('⚠️ Invoice has no subscription but transaction is marked as subscription!');
                }
              } else {
                console.warn('⚠️ Transaction not found in database for invoice:', invoice.id);
              }
            } else {
              console.warn('⚠️ Could not resolve user for one-time invoice payment');
              console.warn('⚠️ Invoice details:', {
                invoice_id: invoice.id,
                customer: invoice.customer,
                billing_reason: invoice.billing_reason
              });
            }
          } catch (creditErr) {
            console.error('❌ Failed to credit one-time document pack for invoice:', creditErr);
            console.error('❌ Credit error details:', {
              invoice_id: invoice.id,
              customer: invoice.customer,
              error: creditErr instanceof Error ? creditErr.message : String(creditErr),
              stack: creditErr instanceof Error ? creditErr.stack : undefined
            });
          }
          
          console.log('✅ One-time payment processing complete');
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        console.log('❌ Payment failed for invoice:', invoice.id);
        console.log('📋 Failed invoice details:', {
          subscription: invoice.subscription,
          billing_reason: invoice.billing_reason,
          amount_due: invoice.amount_due,
          attempt_count: invoice.attempt_count,
          customer: invoice.customer
        });
        
        if (invoice.subscription) {
          // Update subscription status
          await updateSubscriptionPaymentStatus(
            invoice.subscription as string,
            'failed',
            invoice
          );
          
          // Save failed transaction record (will detect if renewal)
          await saveTransactionData(invoice, 'failed');
          console.log('✅ Failed subscription payment recorded');
        } else {
          // Save failed one-time transaction
          await saveTransactionData(invoice, 'failed');
          console.log('✅ Failed one-time payment recorded');
        }
        break;
      }

      case 'invoice.voided': {
        const invoice = event.data.object as any;
        console.log('🚫 Invoice voided (canceled):', invoice.id);
        console.log('📋 Voided invoice details:', {
          subscription: invoice.subscription,
          billing_reason: invoice.billing_reason,
          customer: invoice.customer
        });
        
        if (invoice.subscription) {
          // Save canceled subscription transaction record
          await saveTransactionData(invoice, 'canceled');
          console.log('✅ Canceled subscription transaction recorded');
        } else {
          // Save canceled one-time transaction
          await saveTransactionData(invoice, 'canceled');
          console.log('✅ Canceled one-time transaction recorded');
        }
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
        console.log('📋 Event data:', JSON.stringify(event.data.object, null, 2).substring(0, 500) + '...');
    }

    // Log successful webhook processing
    console.log(`✅ Successfully processed webhook event: ${event.type}`);
    return NextResponse.json({ 
      received: true,
      event_type: event.type,
      event_id: event.id,
      processed_at: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Critical error in webhook handler:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      cause: error.cause
    });
    
    return NextResponse.json(
      { 
        error: 'Webhook handler failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}