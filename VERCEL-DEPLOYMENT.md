# Vercel Deployment Guide

## ✅ Code Pushed to GitHub

Your code has been successfully pushed to:
**https://github.com/Mran1996/ask-ai-legal-deployment.git**

## Deploy to Vercel

### Option 1: Automatic Deployment (Recommended)

If your GitHub repository is already connected to Vercel:

1. **Vercel will automatically deploy** when you push to the `main` branch
2. Check your Vercel dashboard: https://vercel.com/dashboard
3. Your deployment should appear in a few minutes

### Option 2: Manual Deployment via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click **"Add New Project"** (or select your existing project)
3. Import your GitHub repository: `ask-ai-legal-deployment`
4. Vercel will auto-detect Next.js settings
5. Click **"Deploy"**

### Option 3: Deploy via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## Environment Variables

Make sure these environment variables are set in your Vercel project:

### Required Variables

1. **Supabase**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Stripe**
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`
   - `STRIPE_WEBHOOK_SECRET`

3. **AI/LLM APIs**
   - `OPENAI_API_KEY` (optional)
   - `MOONSHOT_API_KEY` or `KIMI_API_KEY`
   - `PERPLEXITY_API_KEY`
   - `ANTHROPIC_API_KEY` (optional)

4. **Pinecone**
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX_NAME` (optional)

5. **Application**
   - `NEXT_PUBLIC_APP_URL` (your Vercel deployment URL)

### How to Add Environment Variables in Vercel

1. Go to your project in Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable with the appropriate value
4. Select environments (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your project for changes to take effect

## Build Settings

Vercel should auto-detect:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (or `next build`)
- **Output Directory:** `.next`
- **Install Command:** `npm install` (or `pnpm install`)

## Post-Deployment Checklist

- [ ] Verify environment variables are set
- [ ] Check build logs for any errors
- [ ] Test the deployed application
- [ ] Verify API routes are working
- [ ] Check that Stripe webhooks are configured
- [ ] Test document upload functionality
- [ ] Verify AI chat is working

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Ensure all environment variables are set
3. Verify `package.json` has all required dependencies
4. Check for TypeScript errors (though they're ignored in build)

### Environment Variables Not Working

1. Make sure variables are added to the correct environment (Production/Preview)
2. Redeploy after adding new variables
3. Check variable names match exactly (case-sensitive)

### API Routes Not Working

1. Verify API routes are in `app/api/` directory
2. Check Vercel function logs for errors
3. Ensure environment variables are accessible in serverless functions

## Vercel Dashboard

Access your deployments at:
**https://vercel.com/dashboard**

Your project should be listed there with deployment status and logs.

---

**Status:** ✅ Code pushed to GitHub
**Next Step:** Check Vercel dashboard for automatic deployment or deploy manually

