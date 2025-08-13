#!/bin/bash

# 🚀 HostTrack Deployment Script
# This script helps prepare your project for Vercel + Railway deployment

echo "🚀 HostTrack Deployment Preparation"
echo "=================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check git status
echo "📋 Checking git status..."
git status --porcelain

if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo "⚠️  You have uncommitted changes. Please commit them first:"
    echo "   git add ."
    echo "   git commit -m 'Prepare for deployment'"
    echo ""
    read -p "Press Enter to continue after committing changes..."
fi

# Check if remote origin is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No remote origin found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/yourusername/hosttrack.git"
    exit 1
fi

echo ""
echo "✅ Repository ready for deployment!"
echo ""
echo "🌐 Next steps:"
echo "1. Deploy backend to Railway:"
echo "   - Go to railway.app"
echo "   - Connect your GitHub repository"
echo "   - Set root directory to 'backend'"
echo "   - Add environment variables"
echo ""
echo "2. Deploy frontend to Vercel:"
echo "   - Go to vercel.com"
echo "   - Import your GitHub repository"
echo "   - Set root directory to 'web'"
echo "   - Add REACT_APP_API_URL environment variable"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
echo "�� Ready to deploy!"
