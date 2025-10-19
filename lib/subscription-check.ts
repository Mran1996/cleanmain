import { supabase } from './supabaseClient';
import { isLocalhost, config } from './config';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isLocalhost: boolean;
  shouldRedirect: boolean;
}

export async function checkSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  // In production, check actual subscription status
  try {
    return await checkSubscriptionStatusServerEnhanced(userId);
  } catch (error) {
    console.error('Error checking subscription status:', error);
    // Default to allowing access if there's an error checking status
    return {
      hasActiveSubscription: true,
      isLocalhost: false,
      shouldRedirect: false
    };
  }
}

// Server-side version for API routes
export async function checkSubscriptionStatusServer(userId: string): Promise<SubscriptionStatus> {
  try {
    // Use the enhanced version that actually checks the database
    return checkSubscriptionStatusServerEnhanced(userId);
  } catch (error) {
    console.error('Error in checkSubscriptionStatusServer:', error);
    // Default to not allowing access if there's an error
    return {
      hasActiveSubscription: false,
      isLocalhost: false,
      shouldRedirect: true
    };
  }
}

// Enhanced server-side function that actually checks the database
export async function checkSubscriptionStatusServerEnhanced(userId: string): Promise<SubscriptionStatus> {
  try {
    // Check user's subscription status in the subscriptions table
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('status, plan_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subscriptionError || !subscriptionData) {
      return {
        hasActiveSubscription: false,
        isLocalhost: false,
        shouldRedirect: true
      };
    }

    // Check if user has active subscription
    const hasActiveSubscription = subscriptionData.status === 'active' && subscriptionData.plan_id;

    return {
      hasActiveSubscription,
      isLocalhost: false,
      shouldRedirect: !hasActiveSubscription
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return {
      hasActiveSubscription: false,
      isLocalhost: false,
      shouldRedirect: true
    };
  }
} 