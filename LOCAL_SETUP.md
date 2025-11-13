# Local Development Setup Guide

This guide will help you set up the Ask AI Legal application for local development.

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Supabase account and project
- Stripe account (test mode keys)
- API keys for AI providers (OpenAI, Perplexity, Kimi/Moonshot)

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.local.example .env.local
   ```
   
   Then edit `.env.local` and fill in your actual values (see below for details).

3. **Start the development server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

## Environment Variables Setup

### Required Variables

#### Supabase Configuration
Get these from your Supabase project dashboard:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (keep this secret!)

#### Stripe Configuration
Get these from your Stripe Dashboard (use test mode keys for development):
- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_test_`)
- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` - Your Stripe publishable key (starts with `pk_test_`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Same as above (used in some components)
- `STRIPE_WEBHOOK_SECRET` - Webhook secret for Stripe events (get from Stripe CLI or dashboard)

#### AI/LLM API Keys
At least one AI provider is required:
- `MOONSHOT_API_KEY` or `KIMI_API_KEY` - Preferred AI provider (Kimi/Moonshot)
- `OPENAI_API_KEY` - Optional fallback (OpenAI)
- `PERPLEXITY_API_KEY` - Required for case law research
- `ANTHROPIC_API_KEY` - Optional (Anthropic Claude)

### Optional Variables

#### AWS S3 (for file storage)
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (default: `us-east-1`)
- `AWS_S3_BUCKET_NAME` - S3 bucket name

#### Email/SMTP (for sending emails)
- `SMTP_HOST` - SMTP server host (default: `smtp-relay.brevo.com`)
- `SMTP_PORT` - SMTP port (default: `587`)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password

#### Application Configuration
- `NEXT_PUBLIC_APP_URL` - Application URL (default: `http://localhost:3000`)
- `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` - Google Analytics ID (optional)
- `NEXT_PUBLIC_FACEBOOK_APP_ID` - Facebook App ID (optional)
- `NEXT_PUBLIC_DISABLE_SUBSCRIPTION_GUARD` - Disable subscription checks (default: `false`)

## Stripe Webhook Setup (Local Development)

For local development, you'll need to use Stripe CLI to forward webhooks:

1. **Install Stripe CLI:**
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the webhook secret** from the CLI output and add it to your `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Database Setup

Make sure your Supabase database has all the required tables and migrations applied. Check the `migrations/` directory for SQL migration files.

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, you can:
- Kill the process: `lsof -ti:3000 | xargs kill -9`
- Or use the reset script: `npm run reset-dev`

### Environment Variables Not Loading
- Make sure your `.env.local` file is in the root directory
- Restart your development server after changing environment variables
- Check that variable names match exactly (case-sensitive)

### Supabase Connection Issues
- Verify your Supabase URL and keys are correct
- Check that your Supabase project is active
- Ensure RLS (Row Level Security) policies are configured correctly

### Stripe Issues
- Use test mode keys for local development
- Make sure webhook secret matches the one from Stripe CLI
- Check Stripe dashboard for webhook delivery logs

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run reset-dev` - Kill processes on ports 3000/3001, remove .next, and start dev server

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

