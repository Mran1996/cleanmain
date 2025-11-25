# Azure AD OAuth Configuration

## Your Azure AD Credentials

- **Application (Client) ID**: `04f15a46-272c-4541-833a-686134dd3417`
- **Tenant ID**: `055d353e-2569-4380-9ebb-981a10856266`
- **Application ID URI**: `api://04f15a46-272c-4541-833a-686134dd3417`

## Required Redirect URIs

Add these **exact** redirect URIs in your Azure Portal:

### For Local Development:
```
http://localhost:3000/auth/callback
```

### For Production:
```
https://www.askailegal.com/auth/callback
```

### For Vercel Preview Deployments:
```
https://ask-ai-legal-deployment-8-*.vercel.app/auth/callback
```

Or use a wildcard pattern:
```
https://*.vercel.app/auth/callback
```

## Azure Portal Configuration Steps

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate to**: Azure Active Directory → App registrations
3. **Find your app** using Application ID: `04f15a46-272c-4541-833a-686134dd3417`
4. **Go to Authentication**:
   - Click "Add a platform"
   - Select "Web"
   - Add all redirect URIs listed above
   - Save
5. **Get Client Secret**:
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Copy the secret value (you'll only see it once!)
   - Add to your `.env.local` file

## Environment Variables

Add these to your `.env.local` file:

```bash
# Azure AD OAuth Configuration
AZURE_CLIENT_ID=04f15a46-272c-4541-833a-686134dd3417
AZURE_TENANT_ID=055d353e-2569-4380-9ebb-981a10856266
AZURE_APPLICATION_ID_URI=api://04f15a46-272c-4541-833a-686134dd3417
AZURE_CLIENT_SECRET=<your_client_secret_from_azure_portal>
```

## Azure AD Endpoints

- **Authorization Endpoint**: `https://login.microsoftonline.com/055d353e-2569-4380-9ebb-981a10856266/oauth2/v2.0/authorize`
- **Token Endpoint**: `https://login.microsoftonline.com/055d353e-2569-4380-9ebb-981a10856266/oauth2/v2.0/token`
- **Logout Endpoint**: `https://login.microsoftonline.com/055d353e-2569-4380-9ebb-981a10856266/oauth2/v2.0/logout`

## Integration Options

### Option 1: Supabase Auth (Recommended)
If using Supabase Auth, you'll need to:
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Microsoft provider
3. Add your Azure AD credentials
4. Configure redirect URI: `https://your-supabase-project.supabase.co/auth/v1/callback`

### Option 2: NextAuth.js
If using NextAuth.js, add Microsoft provider to `lib/auth.ts`

## Testing the Connection

Once configured, test by:
1. Visiting `/login` page
2. Clicking "Sign in with Microsoft"
3. Verifying redirect to Microsoft login
4. After login, should redirect back to `/auth/callback`

## Troubleshooting

- **Redirect URI mismatch**: Ensure exact match in Azure Portal
- **Invalid client secret**: Regenerate secret in Azure Portal
- **Tenant ID incorrect**: Verify in Azure Portal → App registrations
- **Application ID not found**: Check you're using the correct Application ID

