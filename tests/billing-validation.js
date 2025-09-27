/**
 * Manual Billing System Validation Script
 * 
 * This script can be used to validate the billing system changes we've made.
 * Run this in a browser console while logged into the application to validate:
 * 
 * 1. Correct typing and shape of billing data
 * 2. No placeholder/hardcoded values
 * 3. Proper error handling
 * 4. Service layer functionality
 */

// Test the billing service functionality
async function testBillingService() {
  console.log('🧪 Testing Billing Service');
  
  try {
    // Test getBillingData with retry
    console.log('Testing getBillingData with retry...');
    const billingData = await BillingService.retryWithBackoff(
      () => BillingService.getBillingData()
    );
    console.log('✅ getBillingData successful:', billingData);
    
    // Validate billing data structure
    console.log('Validating billing data structure...');
    validateBillingDataStructure(billingData);
    
    // Test getPurchaseHistory with retry
    console.log('Testing getPurchaseHistory with retry...');
    const purchaseHistory = await BillingService.retryWithBackoff(
      () => BillingService.getPurchaseHistory()
    );
    console.log('✅ getPurchaseHistory successful:', purchaseHistory);
    
    // Validate purchase history structure
    console.log('Validating purchase history structure...');
    validatePurchaseHistoryStructure(purchaseHistory);
    
    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Validate the structure of billing data
function validateBillingDataStructure(data) {
  // Check if billing data exists
  if (!data) {
    throw new Error('Billing data is null or undefined');
  }
  
  // Check if it has the expected properties
  const hasExpectedProps = 'subscription' in data && 
                         'paymentMethods' in data && 
                         'invoices' in data;
  if (!hasExpectedProps) {
    throw new Error('Billing data missing expected properties');
  }
  
  // Check if paymentMethods is an array
  if (!Array.isArray(data.paymentMethods)) {
    throw new Error('paymentMethods should be an array');
  }
  
  // Check if invoices is an array
  if (!Array.isArray(data.invoices)) {
    throw new Error('invoices should be an array');
  }
  
  // Check if any values look like placeholders
  const containsPlaceholder = JSON.stringify(data).includes('placeholder') || 
                            JSON.stringify(data).includes('PLACEHOLDER') ||
                            JSON.stringify(data).includes('example') ||
                            JSON.stringify(data).includes('EXAMPLE') ||
                            JSON.stringify(data).includes('demo') ||
                            JSON.stringify(data).includes('DEMO');
  
  if (containsPlaceholder) {
    throw new Error('Billing data contains placeholder values');
  }
  
  console.log('✅ Billing data structure is valid');
  return true;
}

// Validate the structure of purchase history
function validatePurchaseHistoryStructure(data) {
  // Check if purchase history exists
  if (!data) {
    throw new Error('Purchase history is null or undefined');
  }
  
  // Check if it has purchases property
  if (!('purchases' in data)) {
    throw new Error('Purchase history missing purchases property');
  }
  
  // Check if purchases is an array
  if (!Array.isArray(data.purchases)) {
    throw new Error('purchases should be an array');
  }
  
  // Check if any values look like placeholders
  const containsPlaceholder = JSON.stringify(data).includes('placeholder') || 
                            JSON.stringify(data).includes('PLACEHOLDER') ||
                            JSON.stringify(data).includes('example') ||
                            JSON.stringify(data).includes('EXAMPLE') ||
                            JSON.stringify(data).includes('demo') ||
                            JSON.stringify(data).includes('DEMO');
  
  if (containsPlaceholder) {
    throw new Error('Purchase history contains placeholder values');
  }
  
  console.log('✅ Purchase history structure is valid');
  return true;
}

// Run the test (in browser console)
// testBillingService();

console.log('💡 To run the billing validation test, call testBillingService() in your browser console while logged in.');