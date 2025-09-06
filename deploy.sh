#!/bin/bash

# Wellness Platform Deployment Script
# This script helps deploy the monorepo to their respective platforms

echo "🚀 Wellness Platform Deployment Script"
echo "======================================"

# Function to deploy backend to Render
deploy_backend() {
    echo "📦 Deploying Rasa backend to Render..."
    cd backend
    echo "Backend files ready for Render deployment:"
    echo "- render.yaml (deployment config)"
    echo "- rasa/ (Rasa application)"
    echo "- start-rasa.sh (startup script)"
    echo ""
    echo "To deploy to Render:"
    echo "1. Push this repository to GitHub"
    echo "2. Connect your GitHub repo to Render"
    echo "3. Render will automatically detect render.yaml and deploy"
    cd ..
}

# Function to deploy frontend to Vercel
deploy_frontend() {
    echo "🌐 Deploying Next.js frontend to Vercel..."
    cd frontend
    echo "Frontend files ready for Vercel deployment:"
    echo "- vercel.json (deployment config)"
    echo "- package.json (with deploy script)"
    echo "- All Next.js application files"
    echo ""
    echo "To deploy to Vercel:"
    echo "1. Install Vercel CLI: npm i -g vercel"
    echo "2. Run: vercel --prod"
    echo "3. Or connect your GitHub repo to Vercel dashboard"
    cd ..
}

# Main menu
echo "Select deployment option:"
echo "1) Deploy Backend (Render)"
echo "2) Deploy Frontend (Vercel)"
echo "3) Deploy Both"
echo "4) Show deployment info"
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        deploy_backend
        ;;
    2)
        deploy_frontend
        ;;
    3)
        deploy_backend
        echo ""
        deploy_frontend
        ;;
    4)
        echo "📋 Deployment Information:"
        echo ""
        deploy_backend
        echo ""
        deploy_frontend
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment setup complete!"
echo "Check the README.md for detailed instructions."
