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
   * Fetch user's purchase history
   * @returns Promise resolving to purchase history data
   */
  async getPurchaseHistory() {
    try {
      const res = await fetch('/api/purchase-history', {
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