# Fix: Microsoft Graph API Access Denied Error

## 🔴 Current Error

```
Microsoft Graph API authentication failed. 
Error: ErrorAccessDenied - Access is denied. Check credentials and try again.
Status: 403
```

## ✅ What This Means

Your Azure AD credentials are **correct** (the authentication worked!), but your Azure AD app doesn't have permission to send emails via Microsoft Graph API.

## 📋 Step-by-Step Fix

### Step 1: Go to Azure Portal

1. Open: https://portal.azure.com
2. Sign in with your Azure account

### Step 2: Navigate to Your App

1. Click **"Azure Active Directory"** (or search for it)
2. Click **"App registrations"** in the left sidebar
3. Find your app with **Application ID**: `04f15a46-272c-4541-833a-686134dd3417`
4. Click on the app name

### Step 3: Add Microsoft Graph API Permissions

1. In the left sidebar, click **"API permissions"**
2. You'll see a list of current permissions
3. Click **"+ Add a permission"** button (at the top)

### Step 4: Select Microsoft Graph

1. In the popup, click **"Microsoft Graph"**
2. Select **"Application permissions"** (NOT "Delegated permissions")
   - ⚠️ **Important**: Must be "Application permissions" for server-to-server email sending

### Step 5: Add Mail.Send Permission

1. In the search box, type: `Mail.Send`
2. Check the box next to **"Mail.Send"**
3. Click **"Add permissions"** at the bottom

### Step 6: Grant Admin Consent (CRITICAL!)

This is the most important step - without admin consent, the permission won't work!

1. After adding the permission, you'll see it in the list
2. Look for the **"Grant admin consent for [Your Organization]"** button
3. Click it
4. Confirm by clicking **"Yes"** in the popup
5. Wait a few seconds for it to process

### Step 7: Verify Permissions

Your API permissions should now show:

| API / Permission name | Type | Status |
|----------------------|------|--------|
| Microsoft Graph | Mail.Send | ✅ Granted for [Your Organization] |

The **Status** column should show:
- ✅ **"Granted for [Your Organization]"** (this is what you need!)
- ❌ NOT "Not granted" or "Pending"

### Step 8: Wait and Test

1. **Wait 1-2 minutes** for the permissions to propagate
2. **Restart your dev server** (optional, but recommended):
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```
3. **Test the contact form**:
   - Visit: http://localhost:3000/contact
   - Fill out and submit the form
   - You should see a success message! ✅

## 🎯 Quick Checklist

- [ ] Opened Azure Portal → App registrations → Your app
- [ ] Went to "API permissions"
- [ ] Added "Microsoft Graph" → "Application permissions"
- [ ] Added "Mail.Send" permission
- [ ] Clicked "Grant admin consent for [Your Organization]"
- [ ] Verified status shows "✅ Granted for [Your Organization]"
- [ ] Waited 1-2 minutes
- [ ] Tested the contact form

## ⚠️ Common Mistakes

1. **Using "Delegated permissions" instead of "Application permissions"**
   - ❌ Wrong: Delegated permissions (for user context)
   - ✅ Right: Application permissions (for server-to-server)

2. **Not granting admin consent**
   - ❌ Wrong: Permission added but not granted
   - ✅ Right: Permission added AND admin consent granted

3. **Not waiting for propagation**
   - Permissions can take 1-2 minutes to propagate
   - If it still doesn't work, wait a bit longer

## 🔍 Verify Your Setup

After following these steps, check:

1. **API Permissions page** should show:
   ```
   Microsoft Graph
   ├── Mail.Send (Application)
   └── Status: ✅ Granted for [Your Organization]
   ```

2. **No warnings** in yellow or red

3. **Admin consent** button should be grayed out (already granted)

## 🆘 Still Not Working?

If you still get `403 ErrorAccessDenied` after following these steps:

1. **Double-check admin consent**:
   - Go back to API permissions
   - Make sure "Mail.Send" shows "✅ Granted for [Your Organization]"
   - If not, click "Grant admin consent" again

2. **Check the email address**:
   - Verify `SMTP_FROM=support@askailegal.com` exists in your Azure AD tenant
   - The email must be a valid user in your Azure AD organization
   - The user must have a mailbox (not just a guest account)

3. **Check app role assignments** (if using app-only authentication):
   - Some organizations require explicit role assignments
   - Contact your Azure AD administrator if needed

4. **Wait longer**:
   - Sometimes permissions take 5-10 minutes to fully propagate
   - Try again after waiting

5. **Check server logs**:
   - Look at the terminal where `npm run dev` is running
   - Check for any additional error messages

## 📞 Need More Help?

If you're still having issues:
- Check `AZURE_GRAPH_EMAIL_SETUP.md` for the full setup guide
- Verify all environment variables are set correctly
- Make sure you're using the correct Azure AD tenant

