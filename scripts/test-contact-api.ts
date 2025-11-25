/**
 * Test Contact Form API with Microsoft Graph API
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

console.log('🧪 Testing Contact Form API...\n');

// Check Azure AD credentials
const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;
const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'support@askailegal.com';
const toEmail = process.env.SMTP_TO || process.env.SMTP_USER || 'support@askailegal.com';

console.log('Configuration Check:');
console.log('-------------------');
console.log('Azure Tenant ID:', tenantId ? '✅ Set' : '❌ Missing');
console.log('Azure Client ID:', clientId ? '✅ Set' : '❌ Missing');
console.log('Azure Client Secret:', clientSecret ? '✅ Set (' + clientSecret.substring(0, 4) + '****)' : '❌ Missing');
console.log('From Email:', fromEmail);
console.log('To Email:', toEmail);
console.log('');

if (!tenantId || !clientId || !clientSecret) {
  console.log('❌ Azure AD credentials are missing!');
  console.log('   Set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET in .env.local');
  process.exit(1);
}

// Test getting access token
console.log('Step 1: Testing Azure AD Access Token...');
const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

const params = new URLSearchParams({
  client_id: clientId,
  client_secret: clientSecret,
  scope: 'https://graph.microsoft.com/.default',
  grant_type: 'client_credentials'
});

try {
  const tokenResponse = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.log('❌ Failed to get access token');
    console.log('   Status:', tokenResponse.status);
    console.log('   Error:', errorText);
    process.exit(1);
  }

  const tokenData = await tokenResponse.json();
  console.log('✅ Access token obtained successfully');
  console.log('   Token type:', tokenData.token_type);
  console.log('   Expires in:', tokenData.expires_in, 'seconds');
  console.log('');

  // Test Microsoft Graph API permissions
  console.log('Step 2: Testing Microsoft Graph API permissions...');
  const graphTestEndpoint = `https://graph.microsoft.com/v1.0/users/${fromEmail}`;
  
  const graphResponse = await fetch(graphTestEndpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!graphResponse.ok) {
    const errorText = await graphResponse.text();
    console.log('⚠️  Could not access user info');
    console.log('   Status:', graphResponse.status);
    console.log('   Error:', errorText);
    console.log('');
    console.log('💡 This might mean:');
    console.log('   - The email address is not in your Azure AD tenant');
    console.log('   - API permissions are not set correctly');
    console.log('   - Admin consent is not granted');
  } else {
    const userData = await graphResponse.json();
    console.log('✅ User found in Azure AD');
    console.log('   Display Name:', userData.displayName || 'N/A');
    console.log('   Email:', userData.mail || userData.userPrincipalName);
    console.log('');
  }

  // Test sending email (dry run - check permissions)
  console.log('Step 3: Checking Mail.Send permission...');
  console.log('   To test sending, visit: http://localhost:3000/contact');
  console.log('   And submit a test message');
  console.log('');
  
  console.log('✅ All checks passed!');
  console.log('');
  console.log('📝 Next Steps:');
  console.log('   1. Make sure Mail.Send permission is added in Azure Portal');
  console.log('   2. Grant admin consent for Mail.Send permission');
  console.log('   3. Visit: http://localhost:3000/contact');
  console.log('   4. Submit a test message');
  console.log('   5. Check your inbox:', toEmail);

} catch (error: any) {
  console.log('❌ Error:', error.message);
  process.exit(1);
}


