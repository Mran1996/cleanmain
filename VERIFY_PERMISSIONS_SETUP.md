# Verify Your API Permissions Setup

## ⚠️ Still Getting 403 Error?

The error shows Microsoft Graph API is still denying access. Let's verify your permissions are set up correctly.

## ✅ Step-by-Step Verification

### Step 1: Check API Permissions in Azure Portal

1. **Go to**: https://portal.azure.com
2. **Navigate to**: Azure Active Directory → App registrations
3. **Find your app**: Application ID `04f15a46-272c-4541-833a-686134dd3417`
4. **Click on the app name**
5. **Go to**: "API permissions" (in the left sidebar)

### Step 2: Verify Mail.Send Permission

Look for `Mail.Send` in the permissions list. It should show:

| API / Permission name | Type | Status |
|----------------------|------|--------|
| Microsoft Graph | Mail.Send | ✅ **Granted for [Your Organization]** |

**Check these things:**

1. **Permission Name**: Should be `Mail.Send`
2. **Type**: Should be **"Application"** (NOT "Delegated")
   - ❌ Wrong: "Delegated permissions"
   - ✅ Right: "Application permissions"
3. **Status**: Should show **"✅ Granted for [Your Organization]"**
   - ❌ Wrong: "Not granted" or "Pending"
   - ✅ Right: "✅ Granted for [Your Organization]"

### Step 3: If Status is "Not granted"

If the status shows "Not granted":

1. **Click the "Grant admin consent for [Your Organization]" button**
   - It's usually at the top of the permissions list
   - Or next to the Microsoft Graph section
2. **Confirm** by clicking "Yes" in the popup
3. **Wait** for it to process (usually 10-30 seconds)
4. **Refresh the page** and verify it now shows "✅ Granted"

### Step 4: If Type is "Delegated" Instead of "Application"

If the permission type shows "Delegated permissions":

1. **Remove the delegated permission**:
   - Click the three dots (...) next to the permission
   - Click "Remove permission"
   - Confirm
2. **Add the correct permission**:
   - Click "+ Add a permission"
   - Select "Microsoft Graph"
   - **IMPORTANT**: Select **"Application permissions"** (NOT "Delegated permissions")
   - Search for "Mail.Send"
   - Check the box and click "Add permissions"
3. **Grant admin consent**:
   - Click "Grant admin consent for [Your Organization]"
   - Confirm

### Step 5: Wait for Propagation

After granting permissions:

1. **Wait 2-5 minutes** for permissions to propagate
   - Azure permissions can take time to become active
   - Don't test immediately after granting
2. **Restart your dev server** (optional but recommended):
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```
3. **Test again** after waiting

## 🔍 Common Issues

### Issue 1: Permission Type is Wrong
- **Symptom**: Permission shows "Delegated" instead of "Application"
- **Fix**: Remove delegated permission, add application permission
- **Why**: Server-to-server email sending requires Application permissions

### Issue 2: Admin Consent Not Granted
- **Symptom**: Status shows "Not granted" or "Pending"
- **Fix**: Click "Grant admin consent" button
- **Why**: Admin consent is required for application permissions

### Issue 3: Permissions Haven't Propagated
- **Symptom**: Permission shows "✅ Granted" but still getting 403 error
- **Fix**: Wait 2-5 minutes (sometimes up to 10 minutes)
- **Why**: Azure needs time to propagate permissions across services

### Issue 4: Wrong Email Address
- **Symptom**: Getting 404 or "email not found" errors
- **Fix**: Verify `support@askailegal.com` exists in your Azure AD tenant
- **Why**: The email must be a valid user with a mailbox

## ✅ Correct Setup Checklist

Your API permissions should look like this:

```
Microsoft Graph
├── Mail.Send (Application permissions)
│   └── Status: ✅ Granted for [Your Organization]
└── (Any other permissions you have)
```

**Key points:**
- ✅ Type: "Application permissions"
- ✅ Status: "✅ Granted for [Your Organization]"
- ✅ No warnings or errors

## 🧪 Test After Verification

1. **Wait 2-5 minutes** after granting permissions
2. **Restart dev server** (if you haven't already)
3. **Test the contact form**: http://localhost:3000/contact
4. **Submit a test message**
5. **Check for success** (should see "Message Sent Successfully!")

## 📞 Still Not Working?

If you've verified everything and it's still not working:

1. **Double-check admin consent**:
   - Make sure the button is grayed out (already granted)
   - Status should show green checkmark

2. **Check server logs**:
   - Look at terminal running `npm run dev`
   - Check for any additional error messages

3. **Try waiting longer**:
   - Sometimes permissions take 10+ minutes to propagate
   - Wait 10 minutes and try again

4. **Verify email address**:
   - Make sure `support@askailegal.com` is a valid user in Azure AD
   - The user must have a mailbox (not just a guest account)

5. **Check Azure AD role assignments**:
   - Some organizations require explicit role assignments
   - Contact your Azure AD administrator if needed

