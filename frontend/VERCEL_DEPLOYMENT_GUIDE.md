# Vercel Deployment Guide

This guide will help you deploy the wellness monorepo frontend to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm install -g vercel`
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)

## Required Environment Variables

Before deploying, you'll need to set up these environment variables in Vercel:

### Database
- `DATABASE_URL` - Your PostgreSQL database connection string

### Authentication
- `JWT_SECRET` - Secret key for JWT tokens (generate with `openssl rand -base64 32`)
- `NEXTAUTH_SECRET` - NextAuth.js secret (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your Vercel domain (e.g., `https://your-app.vercel.app`)

### External APIs (Optional)
- `OPENROUTER_API_KEY` - For AI chat functionality
- `OPENROUTER_BASE_URL` - Default: `https://openrouter.ai/api/v1`
- `OPENROUTER_MODEL` - Default: `meta-llama/llama-3.3-8b-instruct:free`
- `OPENROUTER_TEMPERATURE` - Default: `0.7`
- `OPENROUTER_MAX_TOKENS` - Default: `1000`

### Rasa Integration (Optional)
- `RASA_URL` - Your Rasa server URL
- `RASA_MODEL` - Default: `rasa`
- `RASA_CONFIDENCE_THRESHOLD` - Default: `0.7`

### Twilio Integration (Optional)
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number
- `TWILIO_WEBHOOK_URL` - Webhook URL for Twilio

### Redis (Optional)
- `REDIS_URL` - Redis connection string for caching

## Deployment Methods

### Method 1: Using Vercel CLI (Recommended)

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the deployment script**:
   ```bash
   npm run vercel:setup
   ```
   This will:
   - Install Vercel CLI if not present
   - Link your project to Vercel
   - Set up environment variables
   - Deploy to production

4. **Manual deployment** (if script doesn't work):
   ```bash
   # Link project to Vercel
   vercel link
   
   # Add environment variables
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   
   # Deploy to production
   vercel --prod
   ```

### Method 2: Using Vercel Dashboard

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository
   - Select the `frontend` folder as the root directory

2. **Configure Build Settings**:
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Set Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all required variables listed above

4. **Deploy**:
   - Click "Deploy" button
   - Vercel will automatically build and deploy your app

## Post-Deployment Steps

1. **Test the deployment**:
   - Visit your Vercel URL
   - Test all major functionality
   - Check API endpoints

2. **Set up custom domain** (optional):
   - Go to Project Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

3. **Monitor performance**:
   - Use Vercel Analytics
   - Check function logs in the dashboard
   - Monitor API response times

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript compilation passes
   - Check for missing environment variables

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` is correct
   - Ensure database allows connections from Vercel IPs
   - Check if SSL is required

3. **API Route Issues**:
   - Check function timeout settings
   - Verify environment variables are set
   - Check Vercel function logs

### Useful Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Pull environment variables
vercel env pull .env.local

# Redeploy
vercel --prod

# Check function logs
vercel logs --follow
```

## Environment-Specific Configuration

### Development
- Uses local environment variables from `.env.local`
- Hot reloading enabled
- Debug logging enabled

### Production
- Uses Vercel environment variables
- Optimized builds
- Error tracking enabled
- Performance monitoring

## Security Considerations

1. **Environment Variables**:
   - Never commit secrets to Git
   - Use Vercel's environment variable system
   - Rotate secrets regularly

2. **Database Security**:
   - Use connection pooling
   - Enable SSL connections
   - Restrict database access

3. **API Security**:
   - Implement rate limiting
   - Validate all inputs
   - Use HTTPS only

## Monitoring and Maintenance

1. **Performance Monitoring**:
   - Use Vercel Analytics
   - Monitor Core Web Vitals
   - Track API response times

2. **Error Tracking**:
   - Check Vercel function logs
   - Set up error notifications
   - Monitor database performance

3. **Regular Updates**:
   - Keep dependencies updated
   - Monitor security advisories
   - Test deployments in staging

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Project Issues**: Check the repository issues

---

**Note**: This deployment guide assumes you have a working Next.js application with proper environment configuration. Make sure to test locally before deploying to production.