#!/bin/bash

# Script to create GitHub repository for Valyxis
# Usage: ./create-github-repo.sh [GITHUB_TOKEN]

GITHUB_USERNAME="steponaskaciulis-max"
REPO_NAME="valyxis"
REPO_DESCRIPTION="Professional Stock Watch Website - Real-time stock tracking with interactive charts"

if [ -z "$1" ]; then
    echo "📝 GitHub Repository Creation"
    echo ""
    echo "Option 1: Create via Web (Recommended)"
    echo "1. Go to: https://github.com/new"
    echo "2. Repository name: $REPO_NAME"
    echo "3. Description: $REPO_DESCRIPTION"
    echo "4. Choose Public or Private"
    echo "5. DO NOT initialize with README, .gitignore, or license"
    echo "6. Click 'Create repository'"
    echo ""
    echo "Then run:"
    echo "  git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    echo "  git branch -M main"
    echo "  git push -u origin main"
    echo ""
    echo "Option 2: Create via API (requires GitHub token)"
    echo "  ./create-github-repo.sh YOUR_GITHUB_TOKEN"
    echo ""
    echo "Get a token from: https://github.com/settings/tokens"
    exit 0
fi

GITHUB_TOKEN=$1

echo "🚀 Creating GitHub repository..."

# Create repository via GitHub API
RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"$REPO_DESCRIPTION\",\"private\":false}")

# Check if repository was created
if echo "$RESPONSE" | grep -q "already exists"; then
    echo "⚠️  Repository already exists. Continuing..."
elif echo "$RESPONSE" | grep -q "Bad credentials"; then
    echo "❌ Invalid GitHub token. Please check your token."
    exit 1
elif echo "$RESPONSE" | grep -q "\"id\""; then
    echo "✅ Repository created successfully!"
else
    echo "⚠️  Could not create repository. You may need to create it manually."
    echo "Response: $RESPONSE"
fi

# Add remote and push
echo ""
echo "📤 Setting up git remote and pushing..."

git remote remove origin 2>/dev/null
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
git branch -M main

echo ""
echo "Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🌐 Repository URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo ""
    echo "Next step: Deploy to Vercel"
    echo "1. Go to: https://vercel.com"
    echo "2. Import your $REPO_NAME repository"
    echo "3. Click Deploy"
else
    echo ""
    echo "⚠️  Push failed. You may need to:"
    echo "1. Create the repository manually on GitHub"
    echo "2. Then run: git push -u origin main"
fi

