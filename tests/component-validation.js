/**
 * Manual Component Validation Script
 * 
 * This script can help validate that our components are working correctly
 * with real data and no placeholders.
 */

/**
 * Validates that the billing page component is using real data
 */
function validateBillingPage() {
  console.log('🧪 Validating Billing Page Component');
  
  // Check for placeholder indicators
  const pageElement = document.getElementById('billing-page');
  if (!pageElement) {
    console.warn('⚠️ Billing page element not found. Are you on the billing page?');
    return;
  }
  
  const pageContent = pageElement.innerText;
  
  // Check for placeholder text
  const placeholderChecks = [
    'placeholder',
    'PLACEHOLDER',
    'example',
    'EXAMPLE',
    'demo',
    'DEMO',
    'Lorem ipsum',
    'John Doe',
    'Jane Doe',
    'xxx-xxxx-xxxx'
  ];
  
  const foundPlaceholders = placeholderChecks.filter(text => pageContent.includes(text));
  
  if (foundPlaceholders.length > 0) {
    console.error('❌ Found potential placeholder content:', foundPlaceholders);
    console.error('Please check the billing page for any remaining placeholder data.');
  } else {
    console.log('✅ No obvious placeholder content found on the billing page');
  }
  
  // Check for empty data sections
  const emptyDataChecks = [
    { selector: '.subscription-status', name: 'Subscription status' },
    { selector: '.payment-methods', name: 'Payment methods' },
    { selector: '.invoices-list', name: 'Invoices list' }
  ];
  
  emptyDataChecks.forEach(check => {
    const element = document.querySelector(check.selector);
    if (element && (!element.innerText || element.innerText.trim() === '')) {
      console.warn(`⚠️ ${check.name} section appears to be empty`);
    } else if (!element) {
      console.warn(`⚠️ ${check.name} section not found with selector "${check.selector}"`);
    } else {
      console.log(`✅ ${check.name} section has content`);
    }
  });
}

/**
 * Validates that the account page component is using real data
 */
function validateAccountPage() {
  console.log('🧪 Validating Account Page Component');
  
  // Check for placeholder indicators
  const pageElement = document.getElementById('account-page');
  if (!pageElement) {
    console.warn('⚠️ Account page element not found. Are you on the account page?');
    return;
  }
  
  const pageContent = pageElement.innerText;
  
  // Check for placeholder text
  const placeholderChecks = [
    'placeholder',
    'PLACEHOLDER',
    'example',
    'EXAMPLE',
    'demo',
    'DEMO',
    'Lorem ipsum',
    'John Doe',
    'Jane Doe'
  ];
  
  const foundPlaceholders = placeholderChecks.filter(text => pageContent.includes(text));
  
  if (foundPlaceholders.length > 0) {
    console.error('❌ Found potential placeholder content:', foundPlaceholders);
    console.error('Please check the account page for any remaining placeholder data.');
  } else {
    console.log('✅ No obvious placeholder content found on the account page');
  }
  
  // Check for user data
  const userDataChecks = [
    { selector: '.user-email', name: 'User email' },
    { selector: '.user-name', name: 'User name' },
    { selector: '.subscription-info', name: 'Subscription info' }
  ];
  
  userDataChecks.forEach(check => {
    const element = document.querySelector(check.selector);
    if (element && (!element.innerText || element.innerText.trim() === '')) {
      console.warn(`⚠️ ${check.name} appears to be empty`);
    } else if (!element) {
      console.warn(`⚠️ ${check.name} not found with selector "${check.selector}"`);
    } else {
      console.log(`✅ ${check.name} has content`);
    }
  });
}

/**
 * Validates that the purchase history component is using real data
 */
function validatePurchaseHistory() {
  console.log('🧪 Validating Purchase History Component');
  
  // Check for placeholder indicators
  const component = document.querySelector('.purchase-history');
  if (!component) {
    console.warn('⚠️ Purchase history component not found');
    return;
  }
  
  const content = component.innerText;
  
  // Check for placeholder text
  const placeholderChecks = [
    'placeholder',
    'PLACEHOLDER',
    'example',
    'EXAMPLE',
    'demo',
    'DEMO',
    'Lorem ipsum',
    'Sample Document'
  ];
  
  const foundPlaceholders = placeholderChecks.filter(text => content.includes(text));
  
  if (foundPlaceholders.length > 0) {
    console.error('❌ Found potential placeholder content:', foundPlaceholders);
    console.error('Please check the purchase history for any remaining placeholder data.');
  } else {
    console.log('✅ No obvious placeholder content found in purchase history');
  }
  
  // Check for purchase items
  const purchaseItems = document.querySelectorAll('.purchase-item');
  if (purchaseItems.length === 0) {
    console.warn('⚠️ No purchase items found. User may have no purchases or there may be a display issue');
  } else {
    console.log(`✅ Found ${purchaseItems.length} purchase items`);
  }
}

/**
 * Run all validations
 */
function validateAllComponents() {
  console.log('🧪 Starting component validation');
  validateBillingPage();
  validateAccountPage();
  validatePurchaseHistory();
  console.log('🧪 Component validation complete');
}

console.log('💡 To validate components, navigate to the appropriate page and run:');
console.log('- validateBillingPage() - on the billing page');
console.log('- validateAccountPage() - on the account page');
console.log('- validatePurchaseHistory() - on any page with purchase history');
console.log('- validateAllComponents() - to run all validations');