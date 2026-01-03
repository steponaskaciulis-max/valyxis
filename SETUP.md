# Valyxis Setup Instructions

## GitHub Repository Setup

To create the GitHub repository and push the code:

1. Go to https://github.com/new
2. Repository name: `valyxis`
3. Description: "Professional Stock Watch Website"
4. Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

Then run these commands in the valyxis directory:

```bash
cd /Users/sk/Desktop/Cursor1/valyxis
git remote add origin https://github.com/YOUR_USERNAME/valyxis.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Vercel Deployment

After pushing to GitHub:

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your `valyxis` repository
4. Vercel will auto-detect the settings
5. Click "Deploy"

The site will be live at `https://valyxis.vercel.app` (or your custom domain).

## API Key Setup (Optional but Recommended)

For better performance and higher rate limits:

1. Get a free API key from https://www.alphavantage.co/support/#api-key
2. Edit `app.js` and replace `'demo'` with your API key on line ~280
3. Commit and push the changes

