# SMTP Setup Guide for Contact Form

## ⚠️ Important: Azure OAuth vs SMTP

**Azure OAuth** = For user authentication (signing in with Microsoft)  
**SMTP** = For sending emails from the contact form

These are **separate** and use **different credentials**.

## Current Issue

The contact form is failing with "SMTP authentication failed" because:

1. **SMTP requires an Outlook App Password** (not your regular password)
2. The email address might have a typo: `support@askailegal.comvb` (should be `support@askailegal.com`)

## How to Fix

### Step 1: Create an Outlook App Password

1. Go to: https://account.microsoft.com/security
2. Sign in with your Microsoft account (the one for `support@askailegal.com`)
3. Click **"Advanced security options"**
4. Scroll down to **"App passwords"** section
5. Click **"Create a new app password"**
6. **Copy the generated password** (you'll only see it once!)
7. **Note**: Two-factor authentication must be enabled first

### Step 2: Update .env.local

Open your `.env.local` file and make sure you have:

```bash
# SMTP Configuration for Contact Form
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=support@askailegal.com
SMTP_PASS=your_app_password_here          # ← Use the App Password from Step 1
SMTP_FROM=support@askailegal.com
SMTP_TO=support@askailegal.com            # ← Make sure no typos!
```

**Important**:
- ✅ Use the **App Password** (16 characters, no spaces)
- ❌ Do NOT use your regular Outlook password
- ✅ Make sure email addresses are correct (no typos)

### Step 3: Restart Dev Server

After updating `.env.local`:

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 4: Test

1. Visit: http://localhost:3000/contact
2. Fill out the form
3. Submit
4. Check your `support@askailegal.com` inbox

## Troubleshooting

### Error: "SMTP authentication failed"
- **Cause**: Using regular password instead of App Password
- **Fix**: Generate a new App Password and use that

### Error: "Invalid login"
- **Cause**: Email address or password is incorrect
- **Fix**: Double-check `SMTP_USER` and `SMTP_PASS` in `.env.local`

### Error: "Connection timeout"
- **Cause**: Network/firewall blocking SMTP
- **Fix**: Check your network connection and firewall settings

### Emails not arriving
- **Check**: Spam/junk folder
- **Verify**: `SMTP_TO` email address is correct
- **Test**: Try sending to a different email address

## Current Configuration

Based on verification:
- ✅ SMTP Host: `smtp.office365.com`
- ✅ SMTP Port: `587`
- ✅ SMTP User: `support@askailegal.com`
- ⚠️  SMTP Password: Needs to be an App Password
- ⚠️  SMTP To: Check for typo (`support@askailegal.comvb` → should be `support@askailegal.com`)


