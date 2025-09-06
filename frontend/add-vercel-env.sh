#!/bin/bash

# Vercel Environment Variables Setup Script
# This script adds RASA_URL and OPENROUTER_API_KEY to Vercel

set -e

echo "🚀 Adding Environment Variables to Vercel..."
echo "=============================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please login first:"
    echo "   vercel login"
    exit 1
fi

echo "✅ Vercel CLI ready"

# Environment variables to add
RASA_URL="https://codebase-x.onrender.com"
OPENROUTER_API_KEY="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"

echo ""
echo "📋 Adding Environment Variables:"
echo "================================"

# Add RASA_URL
echo "🔗 Adding RASA_URL..."
vercel env add RASA_URL production <<< "$RASA_URL"
vercel env add RASA_URL preview <<< "$RASA_URL"
vercel env add RASA_URL development <<< "$RASA_URL"
echo "✅ RASA_URL added to all environments"

# Add OPENROUTER_API_KEY
echo "🔑 Adding OPENROUTER_API_KEY..."
vercel env add OPENROUTER_API_KEY production <<< "$OPENROUTER_API_KEY"
vercel env add OPENROUTER_API_KEY preview <<< "$OPENROUTER_API_KEY"
vercel env add OPENROUTER_API_KEY development <<< "$OPENROUTER_API_KEY"
echo "✅ OPENROUTER_API_KEY added to all environments"

echo ""
echo "📊 Current Environment Variables:"
echo "================================="
vercel env ls

echo ""
echo "🎉 Success! Environment variables added to Vercel"
echo ""
echo "📋 Next Steps:"
echo "1. Add other required variables manually in Vercel dashboard:"
echo "   - DATABASE_URL (from Supabase/PlanetScale)"
echo "   - REDIS_URL (from Upstash/Redis Cloud)"
echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
echo "   - NEXTAUTH_URL (your Vercel domain)"
echo ""
echo "2. Redeploy your application:"
echo "   vercel --prod"
echo ""
echo "3. Or trigger redeploy from Vercel dashboard"
echo ""
echo "✅ Ready to deploy!"
