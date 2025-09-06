# 🔴 Redis Setup Guide: Multiple Approaches

## Choose Your Preferred Method

### **Method 1: Vercel Dashboard (Easiest)** 🏆
### **Method 2: Vercel CLI (Automated)**
### **Method 3: Environment File Upload**
### **Method 4: Manual Script**

---

## 🏆 **Method 1: Vercel Dashboard (Recommended)**

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `full-page-scroll-website` project

### Step 2: Add Environment Variables
1. Click **Settings** tab
2. Click **Environment Variables**
3. Click **Add New**
4. Add these variables:

```
Name: REDIS_URL
Value: redis://default:ZJWP2BAecQigeygptCB4onqGyPYJovlH@redis-12183.c16.us-east-1-3.ec2.redns.redis-cloud.com:12183
Environment: Production
```

### Step 3: Add Additional Variables
Add these optional but recommended variables:

```
Name: DATABASE_URL
Value: your_postgresql_connection_string
Environment: Production

Name: JWT_SECRET
Value: generate_random_secure_string
Environment: Production

Name: NEXTAUTH_SECRET
Value: generate_random_secure_string
Environment: Production

Name: NEXTAUTH_URL
Value: https://your-domain.vercel.app
Environment: Production
```

### Step 4: Redeploy
Vercel will automatically redeploy with new environment variables.

---

## 🤖 **Method 2: Vercel CLI (Automated)**

### Quick Setup
```bash
# Link your project to Vercel
npm run vercel:link

# Add Redis URL
npm run vercel:env:add

# When prompted, enter:
# redis://default:ZJWP2BAecQigeygptCB4onqGyPYJovlH@redis-12183.c16.us-east-1-3.ec2.redns.redis-cloud.com:12183

# Deploy with Redis
npm run vercel:setup
```

### Manual CLI Commands
```bash
# Install Vercel CLI
npm install -g vercel

# Link project
vercel link

# Add Redis URL
vercel env add REDIS_URL
# Enter: redis://default:ZJWP2BAecQigeygptCB4onqGyPYJovlH@redis-12183.c16.us-east-1-3.ec2.redns.redis-cloud.com:12183

# Add other variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add NEXTAUTH_SECRET

# Deploy
vercel --prod
```

---

## 📁 **Method 3: Environment File Upload**

### Step 1: Create Environment File
Copy the content from `vercel-env-template.txt` and create a `.env` file:

```bash
# Copy template content to clipboard
cat vercel-env-template.txt
```

### Step 2: Upload to Vercel Dashboard
1. Go to Vercel Dashboard > Settings > Environment Variables
2. Click **Import** (if available) or add manually
3. Paste your environment variables

### Step 3: Manual Addition
If import doesn't work, add variables one by one in the dashboard.

---

## ⚙️ **Method 4: Custom Deployment Script**

### Use the Automated Script
```bash
# Make script executable
chmod +x vercel-deploy.sh

# Run deployment script
npm run vercel:setup

# Or run directly
./vercel-deploy.sh
```

### What the Script Does
- ✅ Installs Vercel CLI if needed
- ✅ Links project to Vercel
- ✅ Adds Redis environment variable
- ✅ Generates secure JWT secrets
- ✅ Deploys to production
- ✅ Provides testing commands

---

## 🏠 **Local Development Setup**

### Create `.env.local` File
```bash
# Create local environment file
touch .env.local

# Add Redis configuration
echo 'REDIS_URL="redis://default:ZJWP2BAecQigeygptCB4onqGyPYJovlH@redis-12183.c16.us-east-1-3.ec2.redns.redis-cloud.com:12183"' >> .env.local

# Add other local variables
echo 'DATABASE_URL="postgresql://localhost:5432/full_page_scroll_website"' >> .env.local
echo 'JWT_SECRET="local-development-secret"' >> .env.local
echo 'NEXTAUTH_SECRET="local-nextauth-secret"' >> .env.local
echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env.local
```

### Test Local Setup
```bash
# Test Redis connection
npm run redis:check

# Start development server
npm run dev

# Test Redis API
curl http://localhost:3000/api/redis
```

---

## 🧪 **Testing Your Setup**

### Test Commands
```bash
# Test Redis connection
npm run redis:check

# Test Redis API endpoints
npm run redis:test

# Monitor performance
npm run perf:monitor

# Clear cache if needed
npm run cache:clear
```

### API Endpoints to Test
```bash
# Get Redis value
curl http://localhost:3000/api/redis

# Test Redis operations
curl http://localhost:3000/api/redis-test

# Monitor performance
curl http://localhost:3000/api/performance

# Test dashboard with caching
curl http://localhost:3000/api/client/dashboard-stats
```

---

## 🔧 **Troubleshooting**

### Redis Connection Issues
```bash
# Check Redis connection
npm run redis:check

# Test with specific URL
REDIS_URL="redis://default:ZJWP2BAecQigeygptCB4onqGyPYJovlH@redis-12183.c16.us-east-1-3.ec2.redns.redis-cloud.com:12183" npm run redis:check
```

### Vercel Deployment Issues
```bash
# Check environment variables
npm run vercel:env:pull

# Redeploy manually
vercel --prod

# Check deployment logs
vercel logs
```

### Common Issues
1. **Redis connection timeout**: Check firewall settings
2. **Environment variables not applied**: Wait for redeployment
3. **Local `.env.local` not working**: Restart development server
4. **Vercel CLI not found**: Install with `npm install -g vercel`

---

## 📊 **Performance Monitoring**

### After Setup, Monitor:
```bash
# Check Redis performance
curl http://localhost:3000/api/redis-test

# Monitor API performance
curl http://localhost:3000/api/performance

# Test cache effectiveness
curl http://localhost:3000/api/client/dashboard-stats
```

### Performance Metrics
- ✅ API Response Times: Sub-100ms for cached requests
- ✅ Cache Hit Rate: Should be >80% for dashboard data
- ✅ Redis Connection: <500ms connection time
- ✅ Database Queries: 50-70% faster with optimizations

---

## 🎯 **Quick Start Summary**

### For Local Development:
```bash
# 1. Create .env.local
echo 'REDIS_URL="redis://default:ZJWP2BAecQigeygptCB4onqGyPYJovlH@redis-12183.c16.us-east-1-3.ec2.redns.redis-cloud.com:12183"' > .env.local

# 2. Test setup
npm run redis:check

# 3. Start development
npm run dev
```

### For Vercel Production:
```bash
# 1. Link project
npm run vercel:link

# 2. Add Redis
npm run vercel:env:add

# 3. Deploy
npm run vercel:setup
```

### Test Everything Works:
```bash
# Local test
curl http://localhost:3000/api/redis

# Production test (after deployment)
curl https://your-domain.vercel.app/api/redis
```

---

## 🚀 **Next Steps**

1. ✅ Choose your preferred method above
2. ✅ Set up Redis for localhost and Vercel
3. ✅ Test the connection
4. ✅ Deploy with performance optimizations
5. ✅ Monitor performance metrics

Your Full-Page Scroll Website now has Redis caching configured for both local development and production deployment! 🚀✨

**Need help?** Check the troubleshooting section or run `npm run redis:check` to diagnose issues.
