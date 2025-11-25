/**
 * Azure AD OAuth Verification Script
 * 
 * This script verifies the Azure AD OAuth connection using the provided
 * Application ID and Tenant ID.
 */

const AZURE_APPLICATION_ID = '04f15a46-272c-4541-833a-686134dd3417';
const AZURE_TENANT_ID = '055d353e-2569-4380-9ebb-981a10856266';
const AZURE_APPLICATION_ID_URI = 'api://04f15a46-272c-4541-833a-686134dd3417';

// OAuth redirect URIs
const REDIRECT_URIS = {
  local: 'http://localhost:3000/auth/callback',
  production: 'https://www.askailegal.com/auth/callback',
  vercel: 'https://ask-ai-legal-deployment-8-*.vercel.app/auth/callback'
};

// Azure AD endpoints
const AZURE_ENDPOINTS = {
  authorization: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/authorize`,
  token: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`,
  logout: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/logout`
};

console.log('🔐 Azure AD OAuth Configuration');
console.log('================================\n');

console.log('Application (Client) ID:', AZURE_APPLICATION_ID);
console.log('Tenant ID:', AZURE_TENANT_ID);
console.log('Application ID URI:', AZURE_APPLICATION_ID_URI);
console.log('\n');

console.log('📋 Required Redirect URIs (add these in Azure Portal):');
console.log('------------------------------------------------------');
Object.entries(REDIRECT_URIS).forEach(([env, uri]) => {
  console.log(`${env.padEnd(12)}: ${uri}`);
});
console.log('\n');

console.log('🔗 Azure AD Endpoints:');
console.log('----------------------');
console.log('Authorization:', AZURE_ENDPOINTS.authorization);
console.log('Token:', AZURE_ENDPOINTS.token);
console.log('Logout:', AZURE_ENDPOINTS.logout);
console.log('\n');

console.log('📝 Environment Variables Needed:');
console.log('---------------------------------');
console.log('AZURE_CLIENT_ID=' + AZURE_APPLICATION_ID);
console.log('AZURE_TENANT_ID=' + AZURE_TENANT_ID);
console.log('AZURE_CLIENT_SECRET=<your_client_secret>');
console.log('\n');

console.log('✅ Configuration Summary:');
console.log('--------------------------');
console.log('✓ Application ID configured');
console.log('✓ Tenant ID configured');
console.log('⚠️  Client Secret needed (get from Azure Portal)');
console.log('⚠️  Redirect URIs must be added in Azure Portal');
console.log('\n');

console.log('🔍 Next Steps:');
console.log('--------------');
console.log('1. Go to: https://portal.azure.com');
console.log('2. Navigate to: Azure Active Directory → App registrations');
console.log('3. Find your app (Application ID: ' + AZURE_APPLICATION_ID + ')');
console.log('4. Go to: Authentication → Add redirect URI');
console.log('5. Add all redirect URIs listed above');
console.log('6. Go to: Certificates & secrets → New client secret');
console.log('7. Copy the client secret and add to .env.local');
console.log('\n');

export {
  AZURE_APPLICATION_ID,
  AZURE_TENANT_ID,
  AZURE_APPLICATION_ID_URI,
  REDIRECT_URIS,
  AZURE_ENDPOINTS
};

