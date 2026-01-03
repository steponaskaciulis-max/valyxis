# 🔑 Get GitHub Token (30 seconds)

GitHub requires a Personal Access Token instead of passwords. Here's how to get one:

## Quick Steps:

1. **Go to**: https://github.com/settings/tokens/new
   - Or: GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token

2. **Fill in**:
   - **Note**: `Valyxis Deployment`
   - **Expiration**: Choose 90 days or No expiration
   - **Scopes**: Check ✅ **repo** (this selects all repo permissions)

3. **Click**: "Generate token" (scroll to bottom)

4. **COPY THE TOKEN** - You'll see it only once! It looks like: `ghp_xxxxxxxxxxxxxxxxxxxx`

5. **Run this command**:
   ```bash
   cd /Users/sk/Desktop/Cursor1/valyxis
   ./push-to-github.sh YOUR_TOKEN_HERE
   ```

That's it! The script will:
- ✅ Create the GitHub repository
- ✅ Push all your code
- ✅ Set everything up

Then you can deploy to Vercel!

