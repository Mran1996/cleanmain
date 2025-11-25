/**
 * Azure AD OAuth Connection Test Endpoint
 * 
 * This endpoint helps verify your Azure AD OAuth configuration
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const applicationId = process.env.AZURE_CLIENT_ID || '04f15a46-272c-4541-833a-686134dd3417';
  const tenantId = process.env.AZURE_TENANT_ID || '055d353e-2569-4380-9ebb-981a10856266';
  const applicationIdUri = process.env.AZURE_APPLICATION_ID_URI || 'api://04f15a46-272c-4541-833a-686134dd3417';
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  
  // Build redirect URI
  const redirectUri = `${origin}/auth/callback`;
  
  // Azure AD endpoints
  const authEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;
  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  
  // Build authorization URL for testing
  const authUrl = new URL(authEndpoint);
  authUrl.searchParams.set('client_id', applicationId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_mode', 'query');
  // Include Application ID URI in scope for API access
  authUrl.searchParams.set('scope', `openid profile email ${applicationIdUri}/.default`);
  authUrl.searchParams.set('state', 'test-state');
  
  const config = {
    applicationId,
    tenantId,
    applicationIdUri,
    hasClientSecret: !!clientSecret,
    redirectUri,
    endpoints: {
      authorization: authEndpoint,
      token: tokenEndpoint,
    },
    testAuthUrl: authUrl.toString(),
    status: clientSecret ? '✅ Ready' : '⚠️ Missing Client Secret',
  };
  
  return NextResponse.json({
    message: 'Azure AD OAuth Configuration',
    config,
    instructions: {
      step1: 'Add redirect URI in Azure Portal: ' + redirectUri,
      step2: 'Get client secret from Azure Portal → Certificates & secrets',
      step3: 'Add AZURE_CLIENT_SECRET to .env.local',
      step4: 'Test the connection using the testAuthUrl',
    },
    requiredRedirectUris: [
      'http://localhost:3000/auth/callback',
      'https://www.askailegal.com/auth/callback',
      'https://*.vercel.app/auth/callback',
    ],
  }, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

