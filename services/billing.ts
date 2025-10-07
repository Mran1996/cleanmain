/**
 * Billing Service
 * Centralizes API calls for billing-related operations
 */

export const BillingService = {
  /**
   * Fetch billing data including Stripe subscription, payment methods, and invoices
   * @returns Promise resolving to billing data object
   */
  async getBillingData() {
    try {
      const res = await fetch('/api/billing', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch billing data: ${res.status} ${res.statusText}`);
      }
      
      return res.json();
    } catch (error) {
      console.error('Billing data fetch error:', error);
      throw error;
    }
  },

  /**
   * Fetch user's purchase history with pagination
   * @param page Page number (default: 1)
   * @param limit Items per page (default: 5)
   * @param startingAfter Cursor for pagination (optional)
   * @returns Promise resolving to purchase history data with pagination
   */
  async getPurchaseHistory(page: number = 1, limit: number = 5, startingAfter?: string) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      // Add cursor-based pagination if provided
      if (startingAfter) {
        params.set('starting_after', startingAfter);
      }
      
      const res = await fetch(`/api/purchase-history?${params}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch purchase history: ${res.status} ${res.statusText}`);
      }
      
      return res.json();
    } catch (error) {
      console.error('Purchase history fetch error:', error);
      throw error;
    }
  },

  /**
   * Download receipt from first available invoice
   * @param invoiceUrl URL to the invoice PDF
   * @returns void - opens the PDF in a new tab
   */
  downloadReceipt(invoiceUrl: string | undefined): void {
    if (!invoiceUrl) {
      throw new Error('No receipt URL available');
    }
    window.open(invoiceUrl, '_blank');
  },

  /**
   * Manage subscription using dedicated subscription management API
   * @param action The action to perform ('cancel' or 'reactivate')
   * @returns Promise resolving to subscription management result
   */
  async manageSubscription(action: 'cancel' | 'reactivate') {
    try {
      console.log(`🔄 Attempting to ${action} subscription...`);
      
      const res = await fetch('/api/subscription-manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ action }),
      });
      
      console.log(`📡 API Response status: ${res.status} ${res.statusText}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(`❌ API Error:`, errorData);
        throw new Error(errorData.error || `Failed to ${action} subscription: ${res.status} ${res.statusText}`);
      }
      
      const result = await res.json();
      console.log(`✅ Subscription ${action} successful:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Subscription ${action} error:`, error);
      throw error;
    }
  },

  /**
   * Cancel subscription at period end
   * @returns Promise resolving to cancellation result
   */
  async cancelSubscription() {
    return this.manageSubscription('cancel');
  },

  /**
   * Reactivate a canceled subscription
   * @returns Promise resolving to reactivation result
   */
  async reactivateSubscription() {
    return this.manageSubscription('reactivate');
  },

  /**
   * Retry a function with exponential backoff
   * @param fn Function to retry
   * @param maxRetries Maximum number of retries
   * @param delay Initial delay in ms
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 300
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        console.log(`Attempt ${attempt + 1} failed, retrying...`);
        lastError = error as Error;
        // Wait with exponential backoff before next retry
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
    
    throw lastError!;
  }
};