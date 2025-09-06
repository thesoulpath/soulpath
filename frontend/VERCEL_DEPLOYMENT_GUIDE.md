# 🚀 Vercel Deployment Guide (Next.js Only)

## **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐
│   Vercel.com    │    │  Render.com     │
│                 │    │                 │
│   Next.js App   │◄──►│   Rasa Server   │
│   (Frontend)    │    │   (Backend AI)  │
│                 │    │                 │
└─────────────────┘    └─────────────────┘
```

- **Vercel**: Next.js frontend only
- **Render.com**: Rasa server only
- **Communication**: Via API calls

## **✅ What's Already Configured**

### **Vercel Environment Variables:**
- ✅ `RASA_URL=https://codebase-x.onrender.com`
- ✅ `OPENROUTER_API_KEY=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`
- ✅ `DATABASE_URL` (Supabase)
- ✅ `REDIS_URL` (Upstash)
- ✅ `NEXTAUTH_SECRET` & `NEXTAUTH_URL`

### **Files Excluded from Vercel:**
- ✅ `.vercelignore` created to exclude Rasa files
- ✅ Docker files excluded
- ✅ Python files excluded

## **🚀 Deploy to Vercel**

### **Method 1: Vercel CLI (Recommended)**
```bash
# Deploy to production
vercel --prod

# Or deploy to preview first
vercel
```

### **Method 2: Vercel Dashboard**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import from GitHub
4. Select your repository
5. Vercel will auto-detect Next.js
6. Click **"Deploy"**

## **🔧 Vercel Configuration**

### **Build Settings (Auto-detected):**
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### **Environment Variables (Already Set):**
```bash
RASA_URL=https://codebase-x.onrender.com
OPENROUTER_API_KEY=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
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
NEXTAUTH_SECRET=Jt1cPA4WZXJm/pW/DwoN/1Uscvz/ozPysNbLafWJENw=
NEXTAUTH_URL=https://your-domain.vercel.app
```

## **📁 What Gets Deployed to Vercel**

### **✅ Included:**
- `app/` - Next.js app directory
- `components/` - React components
- `lib/` - Utility functions
- `public/` - Static assets
- `package.json` - Dependencies
- `next.config.js` - Next.js config
- `prisma/` - Database schema
- `scripts/` - Build scripts

### **❌ Excluded (via .vercelignore):**
- `rasa/` - Rasa server (deployed on Render.com)
- `Dockerfile*` - Docker files
- `render.yaml` - Render.com config
- `*.py` - Python files
- `start-rasa.sh` - Rasa startup script

## **🔗 API Communication**

Your Next.js app will communicate with Rasa via:

```typescript
// app/api/chat/simple/route.ts
const rasaUrl = process.env.RASA_URL; // https://codebase-x.onrender.com
const response = await fetch(`${rasaUrl}/webhooks/rest/webhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: userMessage, sender: 'user' })
});
```

## **🚀 Deploy Now**

```bash
# Quick deploy
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

## **✅ Ready to Deploy!**

Your Next.js app is ready for Vercel deployment with:
- ✅ All environment variables configured
- ✅ Rasa files excluded
- ✅ API communication setup
- ✅ Database and Redis configured

**Deploy with: `vercel --prod`** 🎉
