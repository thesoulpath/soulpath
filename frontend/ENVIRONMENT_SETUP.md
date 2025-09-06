# 🚀 Environment Setup Guide

## Redis Configuration for Localhost & Vercel

### 📍 **Local Development (.env.local)**

Create a `.env.local` file in your project root with the following Redis configuration:

```env
# Redis Cloud Configuration
REDIS_URL="redis://default:ZJWP2BAecQigeygptCB4onqGyPYJovlH@redis-12183.c16.us-east-1-3.ec2.redns.redis-cloud.com:12183"

# Alternative configurations:
# REDISCLOUD_URL="redis://default:ZJWP2BAecQigeygptCB4onqGyPYJovlH@redis-12183.c16.us-east-1-3.ec2.redns.redis-cloud.com:12183"
# REDIS_URL="redis://localhost:6379"  # For local Redis server
```

### 🌐 **Vercel Deployment**

#### **Step 1: Access Vercel Dashboard**
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `full-page-scroll-website`

#### **Step 2: Add Environment Variables**
1. Click on the **"Settings"** tab
2. Click on **"Environment Variables"**
3. Add the following variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `REDIS_URL` | `redis://default:ZJWP2BAecQigeygptCB4onqGyPYJovlH@redis-12183.c16.us-east-1-3.ec2.redns.redis-cloud.com:12183` | Production |
| `DATABASE_URL` | Your PostgreSQL connection string | Production |
| `DIRECT_URL` | Your PostgreSQL direct connection string | Production |
| `JWT_SECRET` | Your JWT secret key | Production |
| `NEXTAUTH_SECRET` | Your NextAuth secret | Production |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Production |

#### **Step 3: Redeploy**
1. After adding environment variables, Vercel will automatically trigger a new deployment
2. Or manually trigger a deployment from the dashboard

### 🔧 **Alternative Methods to Add Vercel Environment Variables**

#### **Method 1: Vercel CLI**
```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Link to your project
vercel link

# Add environment variables
vercel env add REDIS_URL
# Enter: redis://default:ZJWP2BAecQigeygptCB4onqGyPYJovlH@redis-12183.c16.us-east-1-3.ec2.redns.redis-cloud.com:12183

# Pull environment variables to local .env file
vercel env pull .env.local
```

#### **Method 2: Using vercel.json**
Create a `vercel.json` file in your project root:

```json
{
  "env": {
    "REDIS_URL": "redis://default:ZJWP2BAecQigeygptCB4onqGyPYJovlH@redis-12183.c16.us-east-1-3.ec2.redns.redis-cloud.com:12183"
  }
}
```

### 🧪 **Testing Your Redis Setup**

#### **Test Local Redis Connection:**
```bash
# Test with your Redis Cloud URL
npm run redis:check

# Or test specific Redis endpoint
curl http://localhost:3000/api/redis
```

#### **Test Vercel Redis Connection:**
```bash
# After deployment, test the live endpoint
curl https://your-domain.vercel.app/api/redis
```

### 📋 **Complete Environment Variables List**

For a full production setup, add these environment variables to Vercel:

```env
# Database
DATABASE_URL="your_postgresql_connection_string"
DIRECT_URL="your_postgresql_direct_connection_string"

# Redis (Required for performance)
REDIS_URL="redis://default:ZJWP2BAecQigeygptCB4onqGyPYJovlH@redis-12183.c16.us-east-1-3.ec2.redns.redis-cloud.com:12183"

# Authentication
JWT_SECRET="your_secure_jwt_secret"
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Email (Optional)
BREVO_API_KEY="your_brevo_api_key"
SMTP_HOST="your_smtp_host"
SMTP_PORT="587"
SMTP_USER="your_smtp_user"
SMTP_PASS="your_smtp_password"

# Payments (Optional)
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"

# Analytics (Optional)
GA_TRACKING_ID="your_google_analytics_id"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
```

### 🚀 **Quick Setup Commands**

```bash
# 1. Create local environment file
cp .env.example .env.local

# 2. Add Redis URL to .env.local
echo 'REDIS_URL="redis://default:ZJWP2BAecQigeygptCB4onqGyPYJovlH@redis-12183.c16.us-east-1-3.ec2.redns.redis-cloud.com:12183"' >> .env.local

# 3. Test local setup
npm run redis:check

# 4. Deploy to Vercel
vercel --prod
```

### 🔒 **Security Best Practices**

1. **Never commit `.env` files** to version control
2. **Use different secrets** for development and production
3. **Rotate Redis credentials** regularly
4. **Monitor Redis usage** through Redis Cloud dashboard
5. **Enable Redis TLS** for enhanced security

### 📊 **Monitoring Redis Performance**

After setup, monitor your Redis performance:

```bash
# Check Redis connection
npm run redis:check

# Monitor API performance
npm run perf:monitor

# Test Redis API endpoints
curl http://localhost:3000/api/redis-test
```

### 🎯 **Next Steps**

1. ✅ Set up Redis in `.env.local`
2. ✅ Add Redis to Vercel environment variables
3. ✅ Test Redis connection locally
4. ✅ Deploy to Vercel with Redis
5. ✅ Monitor performance metrics

Your Full-Page Scroll Website is now optimized with Redis caching for both local development and production deployment! 🚀
