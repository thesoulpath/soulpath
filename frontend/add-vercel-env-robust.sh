#!/bin/bash

# Robust Vercel Environment Variables Setup Script
# Handles network errors and provides fallback methods

set -e

echo "🚀 Adding Environment Variables to Vercel (Robust Version)..."
echo "============================================================="

# Environment variables to add
RASA_URL="https://codebase-x.onrender.com"
OPENROUTER_API_KEY="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"

# Function to add environment variable with retry
add_env_var() {
    local key=$1
    local value=$2
    local env=$3
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        echo "🔄 Adding $key to $env (attempt $((retry_count + 1))/$max_retries)..."
        
        if echo "$value" | vercel env add "$key" "$env" 2>/dev/null; then
            echo "✅ $key added to $env successfully"
            return 0
        else
            echo "⚠️  Attempt $((retry_count + 1)) failed, retrying..."
            retry_count=$((retry_count + 1))
            sleep 2
        fi
    done
    
    echo "❌ Failed to add $key to $env after $max_retries attempts"
    return 1
}

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
echo ""

# Try to add environment variables
echo "📋 Adding Environment Variables:"
echo "================================"

environments=("production" "preview" "development")
success_count=0
total_attempts=0

for env in "${environments[@]}"; do
    echo ""
    echo "🔧 Adding variables to $env environment:"
    
    # Add RASA_URL
    if add_env_var "RASA_URL" "$RASA_URL" "$env"; then
        success_count=$((success_count + 1))
    fi
    total_attempts=$((total_attempts + 1))
    
    # Add OPENROUTER_API_KEY
    if add_env_var "OPENROUTER_API_KEY" "$OPENROUTER_API_KEY" "$env"; then
        success_count=$((success_count + 1))
    fi
    total_attempts=$((total_attempts + 1))
done

echo ""
echo "📊 Results: $success_count/$total_attempts variables added successfully"

# Show current environment variables
echo ""
echo "📋 Current Environment Variables:"
echo "================================="
if vercel env ls 2>/dev/null; then
    echo "✅ Environment variables listed successfully"
else
    echo "⚠️  Could not list environment variables (network issue)"
fi

# Provide manual instructions if some failed
if [ $success_count -lt $total_attempts ]; then
    echo ""
    echo "⚠️  Some variables failed to add due to network issues."
    echo ""
    echo "🔧 Manual Alternative - Add via Vercel Dashboard:"
    echo "================================================="
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Select your project"
    echo "3. Click Settings → Environment Variables"
    echo "4. Add these variables:"
    echo ""
    echo "   RASA_URL = $RASA_URL"
    echo "   OPENROUTER_API_KEY = $OPENROUTER_API_KEY"
    echo ""
    echo "5. Select all environments (Production, Preview, Development)"
    echo "6. Click Save"
    echo ""
    echo "🔄 Or try running the script again:"
    echo "   ./add-vercel-env-robust.sh"
fi

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
echo "✅ Script completed!"
