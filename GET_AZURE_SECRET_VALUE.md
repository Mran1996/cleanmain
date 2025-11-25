# How to Get Your Azure Client Secret Value

## 🔍 Current Issue

Your `.env.local` currently has:
```
AZURE_CLIENT_SECRET=46244e50-3a68-4c84-816e-dbfd5997c48f
```

This looks like a **Secret ID** (GUID), not the **Secret Value**. You need the actual secret value.

## ✅ Step-by-Step: Get the Secret Value

### Step 1: Go to Azure Portal
1. Open: https://portal.azure.com
2. Sign in with your Azure account

### Step 2: Navigate to Your App
1. Click **"Azure Active Directory"** (or search for it)
2. Click **"App registrations"** in the left sidebar
3. Search for or find your app with **Application ID**: `04f15a46-272c-4541-833a-686134dd3417`
4. Click on the app name

### Step 3: Go to Certificates & Secrets
1. In the left sidebar, click **"Certificates & secrets"**
2. You'll see a list of client secrets

### Step 4: Check Existing Secrets
- Look at the **"Value"** column
- If it shows **"Hidden value"** or **"***"**, that means the value is no longer visible
- You'll need to create a **NEW** secret

### Step 5: Create a New Client Secret
1. Click the **"+ New client secret"** button (at the top)
2. **Description**: Enter something like "Contact Form Email" or "Microsoft Graph API"
3. **Expires**: Choose:
   - **24 months** (recommended for production)
   - Or **Never** (not recommended for security)
4. Click **"Add"**

### Step 6: Copy the Secret Value (IMPORTANT!)
⚠️ **You'll only see this once!** Copy it immediately.

The secret value will look something like:
```
abc~DEF123ghi456JKL789mno012PQR345stu678vwx901yz
```

**DO NOT copy:**
- ❌ The "Secret ID" (the GUID like `46244e50-3a68-4c84-816e-dbfd5997c48f`)
- ❌ The "Description"
- ❌ The "Expires" date

**ONLY copy:**
- ✅ The **"Value"** column (the long string with special characters)

### Step 7: Update Your .env.local File

1. Open `.env.local` in your project
2. Find the line: `AZURE_CLIENT_SECRET=46244e50-3a68-4c84-816e-dbfd5997c48f`
3. Replace it with:
   ```bash
   AZURE_CLIENT_SECRET=abc~DEF123ghi456JKL789mno012PQR345stu678vwx901yz
   ```
   (Use the actual value you copied from Azure Portal)

4. **Save the file**

### Step 8: Restart Your Dev Server

**CRITICAL**: Environment variables are only loaded when the server starts!

1. **Stop the server**: Press `Ctrl+C` in the terminal running `npm run dev`
2. **Start it again**:
   ```bash
   npm run dev
   ```

### Step 9: Test the Contact Form

1. Visit: http://localhost:3000/contact
2. Fill out and submit the form
3. You should see a success message! ✅

## 🎯 Quick Visual Guide

In Azure Portal, you'll see something like this:

| Description | Secret ID | Value | Expires |
|------------|-----------|-------|---------|
| Contact Form | `46244e50-3a68-4c84-816e-dbfd5997c48f` | `abc~DEF123...` | 2027-01-25 |

**Copy the "Value" column**, NOT the "Secret ID" column!

## ⚠️ Important Notes

1. **Secret values are only shown once** - If you miss it, you'll need to create a new secret
2. **Old secrets still work** - Even if you create a new one, the old one will work until it expires
3. **No spaces or quotes** - Don't add quotes around the value in `.env.local`
4. **Must restart server** - Always restart `npm run dev` after changing `.env.local`

## 🆘 If You Already Closed the Window

If you already closed the Azure Portal window and didn't copy the value:

1. Go back to Azure Portal → App registrations → Your app → Certificates & secrets
2. The "Value" column will now show "Hidden value" or "***"
3. You'll need to create a **NEW** client secret
4. Copy the value immediately this time!

## ✅ Verification

After updating, your `.env.local` should have:
```bash
AZURE_CLIENT_ID=04f15a46-272c-4541-833a-686134dd3417
AZURE_TENANT_ID=055d353e-2569-4380-9ebb-981a10856266
AZURE_CLIENT_SECRET=abc~DEF123ghi456JKL789mno012PQR345stu678vwx901yz
```

The secret should:
- ✅ Be 40+ characters long
- ✅ Contain letters, numbers, and special characters (`~`, `-`, `_`)
- ✅ NOT be a GUID (no dashes in the middle like `46244e50-3a68-4c84-816e-dbfd5997c48f`)

