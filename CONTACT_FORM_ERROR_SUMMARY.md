# Contact Form Error Summary

## Current Error

**Status**: 500 Internal Server Error  
**Root Cause**: Microsoft Graph API 403 ErrorAccessDenied  
**Message**: "Access is denied. Check credentials and try again."

## What's Working ✅

1. ✅ Contact form page loads correctly
2. ✅ Form validation works
3. ✅ Form submission reaches the API
4. ✅ Azure AD authentication works (client secret is correct)
5. ✅ API can get an access token from Azure AD

## What's Not Working ❌

1. ❌ Microsoft Graph API is denying access (403 error)
2. ❌ Email cannot be sent because the app lacks `Mail.Send` permission

## The Problem

Your Azure AD app doesn't have permission to send emails via Microsoft Graph API. Even though:
- ✅ Your client secret is correct
- ✅ Authentication works
- ✅ You can get an access token

The app still needs explicit permission to send emails.

## The Solution

You need to grant the `Mail.Send` permission in Azure Portal:

### Quick Steps:

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate to**: Azure Active Directory → App registrations
3. **Find your app**: Application ID `04f15a46-272c-4541-833a-686134dd3417`
4. **Go to**: API permissions
5. **Add permission**:
   - Click "+ Add a permission"
   - Select "Microsoft Graph"
   - Select "Application permissions" (NOT Delegated)
   - Search for "Mail.Send" and add it
6. **Grant admin consent**:
   - Click "Grant admin consent for [Your Organization]"
   - Confirm
7. **Verify**: Status should show "✅ Granted for [Your Organization]"
8. **Wait 1-2 minutes** for permissions to propagate
9. **Test the form again**

## Detailed Guide

See `FIX_MICROSOFT_GRAPH_PERMISSIONS.md` for complete step-by-step instructions with screenshots.

## Error Flow

```
User submits form
    ↓
Form sends to /api/contact
    ↓
API gets Azure AD access token ✅ (works!)
    ↓
API tries to send email via Microsoft Graph API
    ↓
Microsoft Graph API returns 403 ErrorAccessDenied ❌ (no permission)
    ↓
API catches error and returns 500 with error details
    ↓
Form shows error message to user
```

## After Fixing Permissions

Once you grant the `Mail.Send` permission and admin consent:

1. ✅ The 403 error will go away
2. ✅ Emails will be sent successfully
3. ✅ Users will see a success message
4. ✅ Emails will arrive at `support@askailegal.com`

## Testing

After granting permissions:

1. Wait 1-2 minutes
2. Visit: http://localhost:3000/contact
3. Fill out the form
4. Submit
5. You should see: "Message Sent Successfully!" ✅

## Still Having Issues?

If you still get errors after granting permissions:

1. **Double-check admin consent**: Make sure it shows "✅ Granted"
2. **Wait longer**: Permissions can take 5-10 minutes to propagate
3. **Check email address**: Verify `support@askailegal.com` exists in your Azure AD tenant
4. **Check server logs**: Look at the terminal running `npm run dev` for detailed errors

