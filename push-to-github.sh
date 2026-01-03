#!/bin/bash

# Script to push Valyxis to GitHub using Personal Access Token

GITHUB_USERNAME="steponaskaciulis-max"
REPO_NAME="valyxis"

echo "🚀 Valyxis GitHub Push Helper"
echo ""

# Check if token is provided as argument
if [ -z "$1" ]; then
    echo "GitHub no longer accepts passwords. You need a Personal Access Token."
    echo ""
    echo "📝 Quick Steps:"
    echo ""
    echo "1. Create a Personal Access Token:"
    echo "   - Go to: https://github.com/settings/tokens"
    echo "   - Click 'Generate new token' → 'Generate new token (classic)'"
    echo "   - Name it: 'Valyxis Deployment'"
    echo "   - Select scopes: ✅ repo (all)"
    echo "   - Click 'Generate token'"
    echo "   - ⚠️  COPY THE TOKEN (you won't see it again!)"
    echo ""
    echo "2. Run this script with your token:"
    echo "   ./push-to-github.sh YOUR_TOKEN_HERE"
    echo ""
    echo "Or set it as environment variable:"
    echo "   export GITHUB_TOKEN=your_token_here"
    echo "   ./push-to-github.sh"
    exit 0
fi

# Use provided token or environment variable
GITHUB_TOKEN=${1:-$GITHUB_TOKEN}

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ No GitHub token provided"
    exit 1
fi

echo "📦 Step 1: Creating GitHub repository (if it doesn't exist)..."

# Check if repo exists
REPO_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/$GITHUB_USERNAME/$REPO_NAME")

if [ "$REPO_EXISTS" = "404" ]; then
    echo "Creating repository..."
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/user/repos \
        -d "{\"name\":\"$REPO_NAME\",\"description\":\"Professional Stock Watch Website - Real-time stock tracking with interactive charts\",\"private\":false}")
    
    if echo "$RESPONSE" | grep -q "\"id\""; then
        echo "✅ Repository created successfully!"
    else
        echo "⚠️  Could not create repository. It may already exist or there was an error."
        echo "Response: $RESPONSE"
    fi
elif [ "$REPO_EXISTS" = "200" ]; then
    echo "✅ Repository already exists"
else
    echo "⚠️  Could not check repository status. Continuing anyway..."
fi

echo ""
echo "📤 Step 2: Setting up git remote..."

# Remove existing remote if it exists
git remote remove origin 2>/dev/null

# Add remote with token
git remote add origin "https://${GITHUB_TOKEN}@github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Ensure we're on main branch
git branch -M main

echo ""
echo "📤 Step 3: Pushing to GitHub..."

# Push to GitHub
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🌐 Repository URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo ""
    echo "🔒 Security Note: Your token was used in the git remote URL."
    echo "   Consider removing it and using credential helper:"
    echo "   git remote set-url origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    echo "   git config --global credential.helper osxkeychain"
    echo ""
    echo "Next step: Deploy to Vercel at https://vercel.com"
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "   1. Your token has 'repo' permissions"
    echo "   2. The repository exists on GitHub"
    echo "   3. You have write access to the repository"
fi

