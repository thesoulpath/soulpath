#!/bin/bash

# Vercel Deployment Script with Redis Configuration
# This script helps deploy your application with Redis environment variables

echo "🚀 Deploying Full-Page Scroll Website with Redis..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if project is linked to Vercel
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 Linking project to Vercel..."
    vercel link
fi

# Set Redis environment variable for production
echo "⚙️  Setting up Redis environment variables..."

# Method 1: Using Vercel CLI
vercel env add REDIS_URL --environment production << EOF
redis://default:ZJWP2BAecQigeygptCB4onqGyPYJovlH@redis-12183.c16.us-east-1-3.ec2.redns.redis-cloud.com:12183
EOF

# Optional: Add other important environment variables
echo "📝 Setting up additional environment variables..."

# JWT Secret (generate a new one for production)
JWT_SECRET=$(openssl rand -base64 32)
vercel env add JWT_SECRET --environment production << EOF
$JWT_SECRET
EOF

# NextAuth Configuration
vercel env add NEXTAUTH_SECRET --environment production << EOF
$(openssl rand -base64 32)
EOF

# Ask for domain to set NEXTAUTH_URL
read -p "Enter your Vercel domain (e.g., my-app.vercel.app): " VERCEL_DOMAIN
if [ ! -z "$VERCEL_DOMAIN" ]; then
    vercel env add NEXTAUTH_URL --environment production << EOF
https://$VERCEL_DOMAIN
EOF
fi

echo "🔄 Deploying to production..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Visit https://$VERCEL_DOMAIN"
echo "2. Test Redis connection: curl https://$VERCEL_DOMAIN/api/redis"
echo "3. Monitor performance: curl https://$VERCEL_DOMAIN/api/performance"
echo ""
echo "🔧 Useful commands:"
echo "• npm run redis:check     - Test Redis connection"
echo "• npm run perf:monitor    - Monitor performance"
echo "• vercel env ls           - List environment variables"
