# 🚀 Complete Setup Guide: GitHub + Vercel Deployment

## Step 1: Create GitHub Repository

1. **Go to GitHub**: https://github.com/new
2. **Repository Settings**:
   - **Repository name**: `valyxis`
   - **Description**: `Professional Stock Watch Website - Real-time stock tracking with interactive charts`
   - **Visibility**: Choose Public or Private
   - **⚠️ IMPORTANT**: Do NOT check "Add a README file", "Add .gitignore", or "Choose a license" (we already have these)
3. **Click "Create repository"**

## Step 2: Push Code to GitHub

After creating the repository, run these commands in your terminal:

```bash
cd /Users/sk/Desktop/Cursor1/valyxis

# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/valyxis.git

# Ensure you're on main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

**Note**: You'll be prompted for your GitHub credentials. Use a Personal Access Token if you have 2FA enabled.

## Step 3: Deploy to Vercel

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with your GitHub account
3. **Import Project**:
   - Click "Add New..." → "Project"
   - Find and select your `valyxis` repository
   - Click "Import"
4. **Configure Project** (usually auto-detected):
   - **Framework Preset**: `Other` (or leave default)
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: Leave empty (no build needed)
   - **Output Directory**: Leave empty (serves from root)
   - **Install Command**: Leave empty
5. **Deploy**:
   - Click "Deploy" button
   - Wait 1-2 minutes
   - ✅ Your site is live!

## Step 4: Get Your Live URL

After deployment, Vercel will provide you with a URL like:
- `https://valyxis.vercel.app`
- Or `https://valyxis-YOUR_USERNAME.vercel.app`

You can also set up a custom domain in Vercel settings.

## Optional: Get Alpha Vantage API Key

For better performance and higher rate limits:

1. **Get Free API Key**: https://www.alphavantage.co/support/#api-key
2. **Update Code**:
   - Edit `app.js`
   - Find line ~484: `const apiKey = 'demo';`
   - Replace `'demo'` with your API key: `const apiKey = 'YOUR_API_KEY';`
3. **Commit and Push**:
   ```bash
   git add app.js
   git commit -m "Add Alpha Vantage API key"
   git push
   ```
4. **Vercel will auto-deploy** the changes

## Troubleshooting

### GitHub Push Issues
- If you get authentication errors, use a Personal Access Token instead of password
- Create token: https://github.com/settings/tokens
- Use token as password when prompted

### Vercel Deployment Issues
- Make sure `vercel.json` is in the root directory
- Check that `index.html` exists in the root
- Review Vercel build logs for errors

### API Rate Limits
- The demo API key has very limited rate limits (5 calls/minute)
- Get your own free API key for 5 calls/minute (500 calls/day)
- For production, consider upgrading or using multiple API keys

## What's Included

✅ Complete stock watch website
✅ Real-time stock data integration
✅ Interactive charts with Chart.js
✅ Watchlist management
✅ Auto-refresh functionality
✅ Dark, professional UI
✅ Responsive design
✅ All required stock metrics
✅ Spark charts for quick visualization

## Next Steps

1. ✅ Create GitHub repository
2. ✅ Push code to GitHub
3. ✅ Deploy to Vercel
4. ✅ Get API key (optional but recommended)
5. 🎉 Share your live website!

