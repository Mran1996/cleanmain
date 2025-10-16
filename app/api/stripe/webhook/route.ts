import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set.');
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function updateUserSubscription(
  customerId: string,
  subscriptionData: Stripe.Subscription
) {
  try {
    const supabase = await createClient();
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
    const subscriptionUpdate = {
      user_id: users.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      current_period_start: subscription.current_period_start 
        ? new Date(subscription.current_period_start * 1000).toISOString() 
        : null,
      current_period_end: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString() 
        : null,
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
      customer_id: subscriptionUpdate.stripe_customer_id
    });

    // Use upsert with conflict resolution
    const { data: upsertResult, error: updateError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionUpdate, {
        onConflict: 'stripe_subscription_id',
        ignoreDuplicates: false
      })
      .select();

    if (updateError) {
      console.error('❌ Error saving subscription:', updateError);
      console.error('❌ Subscription data that failed:', subscriptionUpdate);
      return null;
    } else {
      console.log('✅ Successfully saved subscription for user:', users.id);
      return users.id; // Return user ID for transaction processing
    }
  } catch (error) {
    console.error('Error in updateUserSubscription:', error);
  }
}

async function updateSubscriptionPaymentStatus(
  subscriptionId: string,
  status: 'paid' | 'failed'
) {
  try {
    const supabase = await createClient();
    
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: status === 'paid' ? 'active' : 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (updateError) {
      console.error('Error updating subscription payment status:', updateError);
    } else {
      console.log(`Successfully updated subscription ${subscriptionId} status to:`, status === 'paid' ? 'active' : 'past_due');
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
    const supabase = await createClient();
    console.log('💳 Processing transaction for invoice:', invoiceData.id);
    
    // Get user from subscription
    if (!invoiceData.subscription) {
      console.log('⚠️ No subscription found in invoice data, trying customer lookup');
      
      // Try to find user by customer ID directly
      if (invoiceData.customer) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', invoiceData.customer)
          .single();

        if (userError || !userData) {
          console.error('❌ Could not find user for customer:', invoiceData.customer);
          return;
        }

        // Create transaction without subscription
        const transactionData = {
          user_id: userData.id,
          stripe_payment_intent_id: invoiceData.payment_intent || null,
          stripe_invoice_id: invoiceData.id,
          stripe_subscription_id: null,
          stripe_customer_id: invoiceData.customer,
          amount: invoiceData.amount_paid || invoiceData.total || 0,
          currency: invoiceData.currency || 'usd',
          status: status,
          payment_method: invoiceData.payment_method_types?.[0] || 'card',
          description: `One-time payment - Invoice ${invoiceData.number || invoiceData.id}`,
          metadata: {
            invoice_number: invoiceData.number,
            billing_reason: invoiceData.billing_reason,
            attempt_count: invoiceData.attempt_count,
          },
          transaction_date: invoiceData.status_transitions?.paid_at 
            ? new Date(invoiceData.status_transitions.paid_at * 1000).toISOString()
            : new Date().toISOString(),
        };

        console.log('💾 Saving one-time transaction:', transactionData);

        const { error: insertError } = await supabase
          .from('transactions')
          .insert(transactionData);

        if (insertError) {
          console.error('❌ Error saving one-time transaction:', insertError);
        } else {
          console.log('✅ Successfully saved one-time transaction');
        }
        return;
      }
      
      console.error('❌ No subscription or customer found in invoice data');
      return;
    }

    // Find subscription and user
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', invoiceData.subscription)
      .single();

    if (subError || !subscription) {
      console.error('❌ Error finding subscription for transaction:', subError);
      console.log('🔄 Attempting to create subscription first...');
      
      // Try to create subscription if it doesn't exist
      if (invoiceData.customer) {
        try {
          const subscriptionFromStripe = await stripe.subscriptions.retrieve(invoiceData.subscription);
          const userId = await updateUserSubscription(invoiceData.customer, subscriptionFromStripe);
          
          if (userId) {
            // Retry transaction creation with the new subscription
            setTimeout(() => saveTransactionData(invoiceData, status), 1000);
            return;
          }
        } catch (error) {
          console.error('❌ Could not create subscription for transaction:', error);
        }
      }
      return;
    }

    // Prepare transaction data
    const transactionData = {
      user_id: subscription.user_id,
      stripe_payment_intent_id: invoiceData.payment_intent || null,
      stripe_invoice_id: invoiceData.id,
      stripe_subscription_id: invoiceData.subscription,
      stripe_customer_id: invoiceData.customer,
      amount: invoiceData.amount_paid || invoiceData.total || 0,
      currency: invoiceData.currency || 'usd',
      status: status,
      payment_method: invoiceData.payment_method_types?.[0] || 'card',
      description: `Invoice ${invoiceData.number || invoiceData.id} - ${status}`,
      metadata: {
        invoice_number: invoiceData.number,
        billing_reason: invoiceData.billing_reason,
        period_start: invoiceData.period_start,
        period_end: invoiceData.period_end,
        attempt_count: invoiceData.attempt_count,
      },
      transaction_date: invoiceData.status_transitions?.paid_at 
        ? new Date(invoiceData.status_transitions.paid_at * 1000).toISOString()
        : new Date().toISOString(),
    };

    console.log('💾 Saving subscription transaction:', {
      user_id: transactionData.user_id,
      invoice_id: transactionData.stripe_invoice_id,
      amount: transactionData.amount,
      status: transactionData.status
    });

    const { error: insertError } = await supabase
      .from('transactions')
      .insert(transactionData);

    if (insertError) {
      console.error('❌ Error saving subscription transaction:', insertError);
      console.error('❌ Transaction data that failed:', transactionData);
    } else {
      console.log(`✅ Successfully saved ${status} transaction for invoice:`, invoiceData.id);
    }
  } catch (error) {
    console.error('Error in saveTransactionData:', error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await updateUserSubscription(
          subscription.customer as string,
          subscription
        );
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);
        
        // Update user with Stripe customer ID from the session
        if (session.customer && session.metadata?.user_id) {
          try {
            const supabase = await createClient();
            
            const { error: updateError } = await supabase
              .from('users')
              .update({ 
                stripe_customer_id: session.customer as string,
                updated_at: new Date().toISOString()
              })
              .eq('id', session.metadata.user_id);

            if (updateError) {
              console.error('Error updating user with customer ID:', updateError);
            } else {
              console.log(`Successfully linked user ${session.metadata.user_id} to customer ${session.customer}`);
            }
          } catch (error) {
            console.error('Error in checkout.session.completed handler:', error);
          }
        }

        // Record one-time payments (Full Service) when mode is payment
        if (session.mode === 'payment' && session.payment_status === 'paid') {
          try {
            // Build an invoice-like object for saveTransactionData
            const invoiceLike: any = {
              id: session.id,
              customer: session.customer,
              subscription: null,
              payment_intent: session.payment_intent,
              amount_paid: session.amount_total ?? session.amount_subtotal ?? 0,
              total: session.amount_total ?? 0,
              currency: session.currency ?? 'usd',
              payment_method_types: ['card'],
              status_transitions: { paid_at: Math.floor(Date.now() / 1000) },
              number: null,
              billing_reason: 'one_time',
              attempt_count: 1,
            };

            await saveTransactionData(invoiceLike, 'paid');
            console.log('Recorded one-time payment transaction from checkout.session.completed');
          } catch (recordError) {
            console.error('Failed to record one-time payment from session:', recordError);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        console.log('Payment succeeded for invoice:', invoice.id);
        
        if (invoice.subscription) {
          // Update subscription status
          await updateSubscriptionPaymentStatus(
            invoice.subscription as string,
            'paid'
          );
          
          // Save transaction record
          await saveTransactionData(invoice, 'paid');
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        console.log('Payment failed for invoice:', invoice.id);
        
        if (invoice.subscription) {
          // Update subscription status
          await updateSubscriptionPaymentStatus(
            invoice.subscription as string,
            'failed'
          );
          
          // Save transaction record
          await saveTransactionData(invoice, 'failed');
        }
        break;
      }

      case 'invoice.voided': {
        const invoice = event.data.object as any;
        console.log('Invoice voided (canceled):', invoice.id);
        
        if (invoice.subscription) {
          // Save transaction record for canceled invoice
          await saveTransactionData(invoice, 'canceled');
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}