# Perplexity API Connection Test Guide

This guide will help you verify that your Perplexity API key is properly configured and working.

## Quick Test (Browser)

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser and navigate to:**
   ```
   http://localhost:3000/api/test-perplexity
   ```

3. **Check the response:**
   - ✅ **Success**: You'll see a JSON response with `"success": true` and test results
   - ❌ **Error**: You'll see error details and instructions on how to fix it

## What Was Fixed

I've corrected several issues in the Perplexity API integration:

1. **Fixed incorrect API endpoints:**
   - ❌ Old: `https://api.perplexity.ai/search` (doesn't exist)
   - ✅ New: `https://api.perplexity.ai/chat/completions` (correct endpoint)

2. **Updated API calls in:**
   - `lib/perplexity.ts` - Case law search function
   - `app/api/get-case-law/route.ts` - Case law API endpoint
   - `utils/getCaseLaw.ts` - Case law utility function

3. **Standardized model usage:**
   - All functions now use `sonar-pro` model (best for real-time internet search)
   - Consistent error handling and response parsing

## Configuration

Make sure you have `PERPLEXITY_API_KEY` in your `.env.local` file:

```env
PERPLEXITY_API_KEY=pplx-your-api-key-here
```

**Get your API key from:** https://www.perplexity.ai/settings/api

## How Internet Search Works

1. **User triggers search:**
   - User asks about case law or legal information
   - User enables "search mode" in the chat interface
   - User message includes `[Please search the internet for current information about]`

2. **AI calls research tool:**
   - The AI model (Kimi or OpenAI) recognizes the need for internet search
   - It calls the `research` tool with the user's question

3. **Perplexity API search:**
   - The `runPerplexity()` function in `app/api/step1-chat/route.ts` is called
   - It sends the query to Perplexity's `sonar-pro` model
   - Returns search results with citations

4. **Response to user:**
   - The AI incorporates the search results into its response
   - Citations are included when available

## Testing the Integration

### Method 1: Browser Test Endpoint
Visit: `http://localhost:3000/api/test-perplexity`

### Method 2: Test Script (Command Line)
```bash
# Install tsx if not already installed
npm install -g tsx

# Run the test script
npx tsx scripts/test-perplexity.ts
```

### Method 3: Test in the App
1. Start the app: `npm run dev`
2. Navigate to the AI assistant chat
3. Ask a question that requires internet search, such as:
   - "What is the current status of eviction laws in Washington State?"
   - "Find recent case law about landlord-tenant disputes"
   - "What are the latest updates to Washington State housing laws?"

## Common Issues

### ❌ "PERPLEXITY_API_KEY is not configured"
**Solution:** Add your API key to `.env.local`:
```env
PERPLEXITY_API_KEY=pplx-your-key-here
```

### ❌ "Authentication failed - Invalid API key"
**Solution:** 
- Check that your API key starts with `pplx-`
- Verify the key is correct at https://www.perplexity.ai/settings/api
- Make sure you copied the entire key

### ❌ "Rate limit exceeded"
**Solution:** 
- Wait a few minutes and try again
- Check your Perplexity account usage limits

### ❌ "Payment required"
**Solution:** 
- Check your Perplexity account billing
- Visit: https://www.perplexity.ai/settings/billing

### ❌ "Request timed out"
**Solution:**
- Check your internet connection
- The API may be experiencing high traffic - try again later

## Verification Checklist

- [ ] `PERPLEXITY_API_KEY` is set in `.env.local`
- [ ] API key starts with `pplx-`
- [ ] Test endpoint returns success: `/api/test-perplexity`
- [ ] Internet search works in the chat interface
- [ ] Search results include citations when available

## Files Modified

- ✅ `lib/perplexity.ts` - Fixed API endpoint and response parsing
- ✅ `app/api/get-case-law/route.ts` - Fixed API endpoint and error handling
- ✅ `utils/getCaseLaw.ts` - Fixed API endpoint and response format
- ✅ `app/api/step1-chat/route.ts` - Already correct (used as reference)
- ✅ `app/api/test-perplexity/route.ts` - New test endpoint created

## Next Steps

Once the test endpoint shows success, your internet search functionality should work correctly in the app. Try asking legal questions that require current information to verify the integration.


