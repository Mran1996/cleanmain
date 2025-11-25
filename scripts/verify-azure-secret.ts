/**
 * Quick verification script to check if Azure Client Secret is configured
 * Run this after adding AZURE_CLIENT_SECRET to .env.local
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local if it exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const clientSecret = process.env.AZURE_CLIENT_SECRET;
const clientId = process.env.AZURE_CLIENT_ID || '04f15a46-272c-4541-833a-686134dd3417';
const tenantId = process.env.AZURE_TENANT_ID || '055d353e-2569-4380-9ebb-981a10856266';
const applicationIdUri = process.env.AZURE_APPLICATION_ID_URI || 'api://04f15a46-272c-4541-833a-686134dd3417';

console.log('🔐 Azure AD OAuth Secret Verification');
console.log('=====================================\n');

console.log('Configuration Status:');
console.log('---------------------');
console.log('✓ Application ID:', clientId);
console.log('✓ Tenant ID:', tenantId);
console.log('✓ Application ID URI:', applicationIdUri);

if (clientSecret) {
  console.log('✅ Client Secret: Configured (' + clientSecret.substring(0, 4) + '****)');
  console.log('\n🎉 All Azure AD OAuth credentials are configured!');
  console.log('\nNext Steps:');
  console.log('1. Restart your dev server: npm run dev');
  console.log('2. Visit: http://localhost:3000/api/test-azure-oauth');
  console.log('3. Verify status shows "✅ Ready"');
  console.log('4. Test OAuth flow (if implemented)');
} else {
  console.log('❌ Client Secret: Not found');
  console.log('\n⚠️  Please add AZURE_CLIENT_SECRET to your .env.local file');
  console.log('   Get it from: https://portal.azure.com → Azure AD → App registrations');
  console.log('   → Your app → Certificates & secrets');
}


