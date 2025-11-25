# Fix: "Email service configuration error" Message

## 🔴 Current Error

You're seeing this error message:
```
Email service configuration error. 
Please contact support at support@askailegal.com or try again later.
```

This means Microsoft Graph API is still returning `403 ErrorAccessDenied`.

## ✅ What This Means

The error is happening because:
- ✅ Your Azure client secret is correct
- ✅ Authentication is working
- ❌ Microsoft Graph API doesn't have permission to send emails

## 📋 Step-by-Step Fix

### Step 1: Verify Permissions in Azure Portal

1. **Go to**: https://portal.azure.com
2. **Navigate to**: 
   - Azure Active Directory → App registrations
   - Find app: `04f15a46-272c-4541-833a-686134dd3417`
   - Click on the app name
3. **Go to**: "API permissions" (left sidebar)

### Step 2: Check Mail.Send Permission

Look for `Mail.Send` in the list. You need to verify:

**Required Setup:**
- ✅ **Permission Name**: `Mail.Send`
- ✅ **Type**: **"Application permissions"** (NOT "Delegated")
- ✅ **Status**: **"✅ Granted for [Your Organization]"**

### Step 3: If Permission is Missing

If you don't see `Mail.Send`:

1. Click **"+ Add a permission"**
2. Select **"Microsoft Graph"**
3. **IMPORTANT**: Select **"Application permissions"** (NOT "Delegated permissions")
4. Search for **"Mail.Send"**
5. Check the box next to **"Mail.Send"**
6. Click **"Add permissions"**

### Step 4: Grant Admin Consent (CRITICAL!)

This is the most important step:

1. After adding the permission, look for the **"Grant admin consent for [Your Organization]"** button
   - It's usually at the top of the permissions list
   - Or in the Microsoft Graph section
2. **Click the button**
3. **Confirm** by clicking "Yes" in the popup
4. **Wait** 10-30 seconds for it to process
5. **Refresh the page**
6. **Verify** the status now shows: **"✅ Granted for [Your Organization]"**

### Step 5: If Type is Wrong

If `Mail.Send` shows **"Delegated permissions"** instead of **"Application permissions"**:

1. **Remove the delegated permission**:
   - Click the three dots (...) next to Mail.Send
   - Click "Remove permission"
   - Confirm
2. **Add the correct permission**:
   - Click "+ Add a permission"
   - Select "Microsoft Graph"
   - Select **"Application permissions"** (NOT "Delegated")
   - Add "Mail.Send"
3. **Grant admin consent** (Step 4 above)

### Step 6: Wait for Propagation

After granting permissions:

1. **Wait 2-5 minutes** (sometimes up to 10 minutes)
   - Azure permissions need time to propagate
   - Don't test immediately
2. **Restart your dev server**:
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```
3. **Test the form again**

## 🎯 Visual Guide

Your API permissions page should look like this:

```
Microsoft Graph
├── Mail.Send
│   ├── Type: Application permissions ✅
│   └── Status: ✅ Granted for [Your Organization] ✅
└── (other permissions if any)
```

**NOT like this:**
```
Microsoft Graph
├── Mail.Send
│   ├── Type: Delegated permissions ❌ (WRONG!)
│   └── Status: Not granted ❌ (WRONG!)
```

## ✅ Verification Checklist

Before testing, make sure:

- [ ] `Mail.Send` permission exists
- [ ] Type is "Application permissions" (not "Delegated")
- [ ] Status shows "✅ Granted for [Your Organization]"
- [ ] Admin consent button is grayed out (already granted)
- [ ] Waited 2-5 minutes after granting
- [ ] Restarted dev server

## 🧪 Test After Setup

1. **Wait 2-5 minutes** after granting permissions
2. **Restart dev server** (if you haven't)
3. **Visit**: http://localhost:3000/contact
4. **Fill out the form** and submit
5. **Expected**: You should see "Message Sent Successfully!" ✅

## ⚠️ Common Mistakes

1. **Using Delegated instead of Application permissions**
   - ❌ Wrong: Delegated permissions
   - ✅ Right: Application permissions

2. **Not granting admin consent**
   - ❌ Wrong: Permission added but status shows "Not granted"
   - ✅ Right: Permission added AND admin consent granted

3. **Testing too quickly**
   - ❌ Wrong: Testing immediately after granting
   - ✅ Right: Wait 2-5 minutes for propagation

4. **Not restarting server**
   - ❌ Wrong: Changed permissions but didn't restart
   - ✅ Right: Restart dev server after changes

## 🆘 Still Getting Error?

If you've followed all steps and still get the error:

1. **Double-check admin consent**:
   - Go back to API permissions
   - Verify status is "✅ Granted"
   - If not, click "Grant admin consent" again

2. **Wait longer**:
   - Sometimes permissions take 10+ minutes
   - Wait 10 minutes and try again

3. **Check email address**:
   - Verify `support@askailegal.com` exists in Azure AD
   - Must be a valid user with a mailbox

4. **Check server logs**:
   - Look at terminal running `npm run dev`
   - Check for detailed error messages

5. **Verify all credentials**:
   - Check `.env.local` has correct values
   - Make sure `AZURE_CLIENT_SECRET` is the value (not ID)

## 📞 Quick Reference

- **Azure Portal**: https://portal.azure.com
- **App ID**: `04f15a46-272c-4541-833a-686134dd3417`
- **Required Permission**: `Mail.Send` (Application)
- **Required Status**: ✅ Granted for [Your Organization]
- **Contact Form**: http://localhost:3000/contact

