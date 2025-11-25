# Azure Microsoft Graph API Email Setup

## ✅ What Changed

The contact form now uses **Microsoft Graph API** with **Azure AD credentials** instead of SMTP.

## How It Works

1. **Azure AD Authentication**: Uses your Azure AD credentials (Client ID, Tenant ID, Client Secret) to get an access token
2. **Microsoft Graph API**: Sends emails via Microsoft Graph API instead of SMTP
3. **No App Password Needed**: Uses Azure AD authentication, not SMTP passwords

## Required Azure AD Permissions

Your Azure AD application needs the following API permissions:

### Step 1: Add Microsoft Graph API Permissions

1. Go to: https://portal.azure.com
2. Navigate to: **Azure Active Directory** → **App registrations**
3. Find your app: **Application ID** `04f15a46-272c-4541-833a-686134dd3417`
4. Go to: **API permissions**
5. Click: **Add a permission**
6. Select: **Microsoft Graph**
7. Select: **Application permissions** (not Delegated)
8. Add these permissions:
   - `Mail.Send` - Send mail as any user
   - `User.Read.All` - Read all users' profiles (if needed)

### Step 2: Grant Admin Consent

1. After adding permissions, click **Grant admin consent for [Your Organization]**
2. Confirm the consent

### Step 3: Verify Permissions

Your API permissions should show:
- ✅ `Mail.Send` (Application) - Status: ✅ Granted for [Your Organization]
- ✅ `User.Read.All` (Application) - Status: ✅ Granted for [Your Organization]

## Environment Variables

Make sure these are set in `.env.local`:

```bash
# Azure AD Credentials (already configured)
AZURE_CLIENT_ID=04f15a46-272c-4541-833a-686134dd3417
AZURE_TENANT_ID=055d353e-2569-4380-9ebb-981a10856266
AZURE_CLIENT_SECRET=your_azure_client_secret

# Email Configuration
SMTP_FROM=support@askailegal.com    # Email address to send from
SMTP_TO=support@askailegal.com      # Email address to send to
```

**Note**: `SMTP_FROM` and `SMTP_TO` are still used for email addresses, but authentication is via Azure AD, not SMTP.

## How to Test

1. **Restart your dev server**:
   ```bash
   npm run dev
   ```

2. **Visit the contact form**:
   ```
   http://localhost:3000/contact
   ```

3. **Submit a test message**

4. **Check your inbox**: `support@askailegal.com`

## Troubleshooting

### Error: "Azure AD credentials are missing"
- **Fix**: Make sure `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_CLIENT_SECRET` are set in `.env.local`

### Error: "Failed to get Azure AD access token"
- **Fix**: Verify your `AZURE_CLIENT_SECRET` is correct
- **Check**: Azure Portal → App registrations → Your app → Certificates & secrets

### Error: "Microsoft Graph API authentication failed" or "403 Forbidden"
- **Fix**: Add `Mail.Send` permission in Azure Portal
- **Fix**: Grant admin consent for the permission
- **Check**: Azure Portal → App registrations → Your app → API permissions

### Error: "Email address not found" or "404"
- **Fix**: Verify `SMTP_FROM` email exists in your Azure AD tenant
- **Fix**: The email must be a valid user in your Azure AD organization

### Error: "Insufficient privileges"
- **Fix**: Ensure admin consent is granted for `Mail.Send` permission
- **Fix**: The permission must be "Application" type, not "Delegated"

## Benefits of Using Microsoft Graph API

✅ **No App Password Needed**: Uses Azure AD authentication  
✅ **More Secure**: OAuth 2.0 client credentials flow  
✅ **Better Integration**: Works with Azure AD and Office 365  
✅ **Unified Authentication**: Same credentials as Azure OAuth

## Summary

- ✅ Contact form now uses Microsoft Graph API
- ✅ Uses Azure AD credentials (Client ID, Tenant ID, Client Secret)
- ⚠️ **Action Required**: Add `Mail.Send` permission in Azure Portal
- ⚠️ **Action Required**: Grant admin consent for the permission


