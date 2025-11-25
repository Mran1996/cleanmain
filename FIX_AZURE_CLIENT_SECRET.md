# Fix: Azure AD Client Secret Error

## 🔴 The Problem

You're getting this error:
```
Azure AD authentication failed. Invalid client secret provided.
AADSTS7000215: Invalid client secret provided. Ensure the secret being sent 
in the request is the client secret value, not the client secret ID.
```

## ✅ The Solution

The issue is that `AZURE_CLIENT_SECRET` in your `.env.local` file contains the **Secret ID** instead of the **Secret Value**.

### What's the Difference?

- **Secret ID**: A GUID like `a1b2c3d4-e5f6-7890-abcd-ef1234567890` (this is NOT what you need)
- **Secret Value**: A long string like `abc~DEF123ghi456JKL789mno012PQR345stu678vwx901yz` (this IS what you need)

## 📋 Step-by-Step Fix

### Step 1: Get the Correct Client Secret from Azure Portal

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate to**: 
   - **Azure Active Directory** → **App registrations**
   - Find your app: **Application ID** `04f15a46-272c-4541-833a-686134dd3417`
3. **Go to**: **Certificates & secrets** (in the left sidebar)
4. **Check existing secrets**:
   - If you see a secret with a "Value" column that shows "Hidden value" or "***", that secret's value is no longer visible
   - You'll need to create a NEW secret

### Step 2: Create a New Client Secret

1. Click **"New client secret"** button
2. **Description**: Enter something like "Contact Form Email" or "Microsoft Graph API"
3. **Expires**: Choose an expiration (recommend 24 months for production)
4. Click **"Add"**
5. **⚠️ IMPORTANT**: Copy the **"Value"** immediately (you'll only see it once!)
   - It will look like: `abc~DEF123ghi456JKL789mno012PQR345stu678vwx901yz`
   - Do NOT copy the "Secret ID" (the GUID)

### Step 3: Update Your .env.local File

1. Open `.env.local` in your project root
2. Find the line: `AZURE_CLIENT_SECRET=...`
3. Replace it with:
   ```bash
   AZURE_CLIENT_SECRET=abc~DEF123ghi456JKL789mno012PQR345stu678vwx901yz
   ```
   (Use the actual secret value you copied from Azure Portal)

4. **Save the file**

### Step 4: Restart Your Dev Server

**CRITICAL**: Next.js only loads environment variables on startup!

1. **Stop the current server**: Press `Ctrl+C` in the terminal running `npm run dev`
2. **Start it again**:
   ```bash
   npm run dev
   ```

### Step 5: Test the Contact Form

1. Visit: http://localhost:3000/contact
2. Fill out the form:
   - Name: Test User
   - Email: test@example.com
   - Reason: Testing
   - Message: This is a test message
3. Submit the form
4. You should see a success message! ✅

## 🔍 How to Verify Your Secret is Correct

The secret value should:
- ✅ Be a long string (usually 40+ characters)
- ✅ Contain letters, numbers, and special characters like `~`, `-`, `_`
- ✅ NOT be a GUID (like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
- ✅ Look something like: `abc~DEF123ghi456JKL789mno012PQR345stu678vwx901yz`

## ⚠️ Common Mistakes

1. **Copying the Secret ID instead of Value**
   - ❌ Wrong: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
   - ✅ Right: `abc~DEF123ghi456JKL789mno012PQR345stu678vwx901yz`

2. **Not restarting the dev server**
   - Environment variables are only loaded when the server starts
   - Always restart after changing `.env.local`

3. **Using an expired secret**
   - Check the expiration date in Azure Portal
   - Create a new secret if the old one expired

4. **Missing quotes or extra spaces**
   - Make sure there are no spaces around the `=` sign
   - Don't add quotes unless the value itself contains spaces

## 🎯 Quick Checklist

- [ ] Opened Azure Portal → App registrations → Your app
- [ ] Went to "Certificates & secrets"
- [ ] Created a new client secret
- [ ] Copied the **Value** (not the ID)
- [ ] Updated `AZURE_CLIENT_SECRET` in `.env.local`
- [ ] Saved `.env.local`
- [ ] Restarted the dev server (`npm run dev`)
- [ ] Tested the contact form

## 🆘 Still Not Working?

If you still get errors after following these steps:

1. **Verify the secret is correct**:
   - Check that you copied the entire value (no truncation)
   - Make sure there are no extra spaces or line breaks

2. **Check Azure AD Permissions**:
   - Go to Azure Portal → App registrations → Your app → API permissions
   - Verify `Mail.Send` permission is added
   - Verify admin consent is granted (should show ✅)

3. **Check the email address**:
   - Verify `SMTP_FROM=support@askailegal.com` exists in your Azure AD tenant
   - The email must be a valid user in your Azure AD organization

4. **Check server logs**:
   - Look at the terminal where `npm run dev` is running
   - Check for any error messages

## 📞 Need More Help?

If you're still having issues, check:
- `AZURE_GRAPH_EMAIL_SETUP.md` - Full setup guide
- `scripts/test-contact-api.ts` - Test script to verify configuration

