# How to Receive Emails from Contact Form

## 🔴 Current Issue

You're not receiving emails because:
- ✅ Form submission works
- ✅ Azure AD authentication works
- ❌ Microsoft Graph API doesn't have permission to send emails
- ⚠️ Development mode is allowing form to succeed even when email fails

## ✅ Solution: Grant Mail.Send Permission

To actually receive emails, you need to grant the `Mail.Send` permission in Azure Portal.

### Step-by-Step Instructions

#### Step 1: Go to Azure Portal
1. Open: https://portal.azure.com
2. Sign in with your Azure account

#### Step 2: Navigate to Your App
1. Click **"Azure Active Directory"** (or search for it)
2. Click **"App registrations"** in the left sidebar
3. Find your app: **Application ID** `04f15a46-272c-4541-833a-686134dd3417`
4. Click on the app name

#### Step 3: Go to API Permissions
1. In the left sidebar, click **"API permissions"**
2. You'll see a list of current permissions

#### Step 4: Add Mail.Send Permission (if missing)
If you don't see `Mail.Send`:

1. Click **"+ Add a permission"** button (at the top)
2. Select **"Microsoft Graph"**
3. **IMPORTANT**: Select **"Application permissions"** (NOT "Delegated permissions")
4. Search for **"Mail.Send"**
5. Check the box next to **"Mail.Send"**
6. Click **"Add permissions"**

#### Step 5: Grant Admin Consent (CRITICAL!)

This is the most important step:

1. Look for the **"Grant admin consent for [Your Organization]"** button
   - It's usually at the top of the permissions list
   - Or in the Microsoft Graph section
2. **Click the button**
3. **Confirm** by clicking "Yes" in the popup
4. **Wait** 10-30 seconds for it to process
5. **Refresh the page**
6. **Verify** the status now shows: **"✅ Granted for [Your Organization]"**

#### Step 6: Verify Setup

Your API permissions should show:

```
Microsoft Graph
├── Mail.Send
│   ├── Type: Application permissions ✅
│   └── Status: ✅ Granted for [Your Organization] ✅
```

#### Step 7: Wait and Test

1. **Wait 2-5 minutes** for permissions to propagate
2. **Restart your dev server**:
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```
3. **Test the contact form**: http://localhost:3000/contact
4. **Submit a test message**
5. **Check your email**: support@askailegal.com

## 🔍 How to Verify Emails Are Being Sent

### Check Server Logs

When you submit the form, check the terminal where `npm run dev` is running. You should see:

**If email is sent successfully:**
```
✅ Message sent successfully via Microsoft Graph API: graph-1234567890
   Submission key: test@example.com-abc123...
   Total recent submissions tracked: 1
```

**If email fails (current state):**
```
⚠️ Email sending failed in development mode, but allowing submission: Failed to send email via Microsoft Graph: 403...
📧 Form submission details:
   Name: Test User
   Email: test@example.com
   Reason: Testing
   Message: Test message...
```

### Check Email Inbox

After granting permissions and waiting:
1. Submit the form
2. Check `support@askailegal.com` inbox
3. You should receive an email with the form submission

## ⚠️ Important Notes

1. **Development Mode**: Currently, the form shows success even if email fails. After granting permissions, emails will actually be sent.

2. **Permission Propagation**: Azure permissions can take 2-5 minutes (sometimes up to 10 minutes) to fully propagate.

3. **Email Address**: Make sure `support@askailegal.com` exists in your Azure AD tenant and has a mailbox.

4. **Admin Consent**: Without admin consent, the permission won't work even if it's added.

## 🎯 Quick Checklist

Before testing, make sure:

- [ ] `Mail.Send` permission exists in API permissions
- [ ] Type is "Application permissions" (not "Delegated")
- [ ] Status shows "✅ Granted for [Your Organization]"
- [ ] Admin consent button is grayed out (already granted)
- [ ] Waited 2-5 minutes after granting
- [ ] Restarted dev server
- [ ] Checked server logs for email sending confirmation

## 🆘 Still Not Receiving Emails?

If you've granted permissions and still don't receive emails:

1. **Check server logs**: Look for error messages in the terminal
2. **Verify email address**: Make sure `support@askailegal.com` is a valid user in Azure AD
3. **Check spam folder**: Emails might be going to spam
4. **Wait longer**: Permissions can take 10+ minutes to propagate
5. **Verify permissions again**: Go back to Azure Portal and double-check the status

## 📧 Expected Email Format

When emails are sent successfully, you'll receive an email with:

- **Subject**: "Contact Form: [Reason] - [Name]"
- **From**: support@askailegal.com
- **To**: support@askailegal.com
- **Content**: 
  - Name
  - Email
  - Reason
  - Message
  - File attachment (if provided)

