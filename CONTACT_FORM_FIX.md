# Contact Form Fix - SMTP Authentication

## Issues Found

1. ✅ **Fixed**: Email typo in `SMTP_TO` (`support@askailegal.comvb` → `support@askailegal.com`)
2. ⚠️ **Needs Fix**: SMTP authentication failing - likely using regular password instead of App Password

## What's Connected

✅ **Azure OAuth** - For user authentication (signing in with Microsoft)
- Application ID: `04f15a46-272c-4541-833a-686134dd3417`
- Tenant ID: `055d353e-2569-4380-9ebb-981a10856266`
- Status: ✅ Configured

✅ **SMTP** - For sending contact form emails
- Host: `smtp.office365.com`
- Port: `587`
- User: `support@askailegal.com`
- Status: ⚠️ Authentication failing

## How to Fix SMTP Authentication

The contact form uses **SMTP** (not Azure OAuth) to send emails. You need an **Outlook App Password**.

### Step 1: Create App Password

1. Go to: https://account.microsoft.com/security
2. Sign in with `support@askailegal.com`
3. Click **"Advanced security options"**
4. Scroll to **"App passwords"**
5. Click **"Create a new app password"**
6. **Copy the 16-character password** (you'll only see it once!)

**Note**: Two-factor authentication must be enabled first.

### Step 2: Update .env.local

Open `.env.local` and update:

```bash
SMTP_PASS=your_16_character_app_password_here
```

**Important**:
- ✅ Use the **App Password** (16 characters, no spaces)
- ❌ Do NOT use your regular Outlook password
- ✅ No quotes around the password

### Step 3: Restart Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 4: Test

1. Visit: http://localhost:3000/contact
2. Submit a test message
3. Check `support@askailegal.com` inbox

## Test SMTP Connection

Run this to verify SMTP is working:

```bash
npx tsx scripts/test-smtp-connection.ts
```

## Summary

- ✅ Email address typo fixed
- ⚠️ Need to use App Password for SMTP authentication
- ✅ Azure OAuth is separate and working correctly
- ✅ Contact form is configured to send to `support@askailegal.com`


