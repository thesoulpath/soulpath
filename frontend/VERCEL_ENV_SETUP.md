# Vercel Environment Variables Setup

## 🚀 Quick Setup Guide

### **Step 1: Go to Vercel Dashboard**
1. Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your SoulPath project
3. Click **Settings** tab
4. Click **Environment Variables** in the sidebar

### **Step 2: Add Environment Variables**

Click **"Add New"** for each variable below:

#### **🔴 CRITICAL - Add These First:**

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Production, Preview, Development |
| `REDIS_URL` | `redis://...` | Production, Preview, Development |
| `OPENROUTER_API_KEY` | `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` | Production, Preview, Development |
| `NEXTAUTH_SECRET` | `your-random-secret-here` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Production, Preview, Development |
| `RASA_URL` | `https://codebase-x.onrender.com` | Production, Preview, Development |

#### **🔧 RECOMMENDED - Add These Next:**

| Name | Value | Environment |
|------|-------|-------------|
| `BREVO_API_KEY` | `your-brevo-api-key` | Production, Preview, Development |
| `BREVO_SENDER_EMAIL` | `info@soulpath.com` | Production, Preview, Development |
| `BREVO_SENDER_NAME` | `SoulPath` | Production, Preview, Development |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production, Preview, Development |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Production, Preview, Development |
| `ZOOM_API_KEY` | `your-zoom-api-key` | Production, Preview, Development |
| `ZOOM_API_SECRET` | `your-zoom-secret` | Production, Preview, Development |
| `LIVE_SESSION_PROVIDER` | `zoom` | Production, Preview, Development |

#### **📱 OPTIONAL - WhatsApp Integration:**

| Name | Value | Environment |
|------|-------|-------------|
| `TWILIO_ACCOUNT_SID` | `your-twilio-sid` | Production, Preview, Development |
| `TWILIO_AUTH_TOKEN` | `your-twilio-token` | Production, Preview, Development |
| `TWILIO_PHONE_NUMBER` | `+1234567890` | Production, Preview, Development |

#### **📊 MONITORING - Logging:**

| Name | Value | Environment |
|------|-------|-------------|
| `LOGGING_ENABLED` | `true` | Production, Preview, Development |
| `LOGGING_LEVEL` | `info` | Production, Preview, Development |
| `LOGGING_STORAGE` | `database` | Production, Preview, Development |

#### **🌐 APP CONFIGURATION:**

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | Production, Preview, Development |
| `NEXT_PUBLIC_BASE_URL` | `https://your-domain.vercel.app` | Production, Preview, Development |
| `API_BASE_URL` | `https://your-domain.vercel.app/api` | Production, Preview, Development |

### **Step 3: Generate NextAuth Secret**

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output and use it as your `NEXTAUTH_SECRET` value.

### **Step 4: Redeploy**

After adding all variables:
1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Your app will restart with new environment variables

## 🔑 Where to Get API Keys

### **Required Services:**

1. **Database (PostgreSQL)**
   - [Supabase](https://supabase.com) - Free tier available
   - [PlanetScale](https://planetscale.com) - Free tier available
   - [Railway](https://railway.app) - PostgreSQL hosting

2. **Redis Cache**
   - [Upstash](https://upstash.com) - Redis hosting
   - [Redis Cloud](https://redis.com) - Free tier available

3. **OpenRouter** ✅ **Already provided**
   - API Key: `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`

### **Recommended Services:**

4. **Stripe** (Payment Processing)
   - [stripe.com](https://stripe.com)
   - Get publishable and secret keys

5. **Brevo** (Email Service)
   - [brevo.com](https://brevo.com)
   - Get API key and configure sender

6. **Zoom** (Live Sessions)
   - [zoom.us](https://zoom.us)
   - Create app and get API credentials

## ✅ Checklist

- [ ] Add `DATABASE_URL`
- [ ] Add `REDIS_URL`
- [ ] Add `OPENROUTER_API_KEY` ✅
- [ ] Add `NEXTAUTH_SECRET`
- [ ] Add `NEXTAUTH_URL`
- [ ] Add `RASA_URL` ✅
- [ ] Redeploy application
- [ ] Test chatbot functionality

## 🚨 Important Notes

- **Replace `your-domain.vercel.app`** with your actual Vercel domain
- **Generate a secure `NEXTAUTH_SECRET`** using the openssl command
- **Select all environments** (Production, Preview, Development) for each variable
- **Redeploy after adding variables** to apply changes

## 🆘 Need Help?

If you need help with any specific service setup:
- **Database**: Check Supabase documentation
- **Redis**: Check Upstash documentation  
- **Stripe**: Check Stripe documentation
- **Vercel**: Check Vercel environment variables guide
