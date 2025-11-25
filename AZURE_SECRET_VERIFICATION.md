# Azure Client Secret Verification

## ✅ How to Verify Your Secret is Added Correctly

1. **Check your `.env.local` file** - Make sure it contains:
   ```bash
   AZURE_CLIENT_SECRET=your_actual_secret_value_here
   ```
   - No quotes around the value
   - No spaces around the `=` sign
   - The value should be on a single line

2. **Restart your development server**:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

3. **Verify the secret is loaded**:
   ```bash
   npx tsx scripts/verify-azure-secret.ts
   ```
   Should show: `✅ Client Secret: Configured`

4. **Test the API endpoint**:
   Visit: `http://localhost:3000/api/test-azure-oauth`
   Should show: `"status": "✅ Ready"`

## Common Issues

### Issue 1: Secret not detected
- **Solution**: Make sure there are no quotes around the value
- ❌ Wrong: `AZURE_CLIENT_SECRET="secret-value"`
- ✅ Correct: `AZURE_CLIENT_SECRET=secret-value`

### Issue 2: Server not picking up changes
- **Solution**: Restart the dev server completely
- Stop the server (Ctrl+C)
- Start again: `npm run dev`

### Issue 3: Wrong variable name
- **Solution**: Use exact name: `AZURE_CLIENT_SECRET`
- Check for typos or extra spaces

## Next Steps After Verification

Once the secret is verified:
1. ✅ All Azure AD credentials configured
2. ⏭️ Add Microsoft OAuth to login page (if needed)
3. ⏭️ Configure redirect URIs in Azure Portal
4. ⏭️ Test the OAuth flow


