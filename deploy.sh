#!/bin/bash

# Valyxis Deployment Script
# This script helps set up GitHub and Vercel deployment

echo "🚀 Valyxis Deployment Setup"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Run: git init"
    exit 1
fi

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ GitHub username is required"
    exit 1
fi

echo ""
echo "📦 Setting up GitHub repository..."

# Check if remote already exists
if git remote get-url origin &>/dev/null; then
    echo "⚠️  Remote 'origin' already exists"
    read -p "Do you want to update it? (y/n): " UPDATE_REMOTE
    if [ "$UPDATE_REMOTE" = "y" ]; then
        git remote set-url origin "https://github.com/$GITHUB_USERNAME/valyxis.git"
    fi
else
    git remote add origin "https://github.com/$GITHUB_USERNAME/valyxis.git"
fi

# Set branch to main
git branch -M main

echo ""
echo "✅ Git remote configured!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Create a new repository on GitHub:"
echo "   - Go to: https://github.com/new"
echo "   - Repository name: valyxis"
echo "   - Description: Professional Stock Watch Website"
echo "   - Choose Public or Private"
echo "   - DO NOT initialize with README, .gitignore, or license"
echo "   - Click 'Create repository'"
echo ""
echo "2. After creating the repository, run:"
echo "   git push -u origin main"
echo ""
echo "3. Deploy to Vercel:"
echo "   - Go to: https://vercel.com"
echo "   - Click 'Add New Project'"
echo "   - Import your 'valyxis' repository"
echo "   - Click 'Deploy'"
echo ""
echo "🎉 Your site will be live at: https://valyxis.vercel.app"
echo ""

