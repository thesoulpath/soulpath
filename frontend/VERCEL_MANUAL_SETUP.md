# 🔧 Manual Vercel Environment Setup

## **Quick Manual Method (Recommended for Network Issues)**

Since you're experiencing network issues with Vercel CLI, here's the **fastest manual method**:

### **Step 1: Go to Vercel Dashboard**
1. Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your **SoulPath** project
3. Click **Settings** → **Environment Variables**

### **Step 2: Add These Variables**

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `RASA_URL` | `https://codebase-x.onrender.com` | **Production, Preview, Development** |
| `OPENROUTER_API_KEY` | `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` | **Production, Preview, Development** |

### **Step 3: Add Other Critical Variables**

| Variable Name | Value | How to Get |
|---------------|-------|------------|
| `DATABASE_URL` | `postgresql://...` | **Supabase/PlanetScale** |
| `REDIS_URL` | `redis://...` | **Upstash/Redis Cloud** |
| `NEXTAUTH_SECRET` | `Jt1cPA4WZXJm/pW/DwoN/1Uscvz/ozPysNbLafWJENw=` | **Generated for you** |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | **Your Vercel domain** |

### **Step 4: Redeploy**
1. Go to **Deployments** tab
2. Click **"Redeploy"** on latest deployment
3. Your app will restart with new variables

---

## **Alternative: Try Robust Script**

If you want to try the automated approach again:

```bash
./add-vercel-env-robust.sh
```

This script includes:
- ✅ **Retry logic** for network errors
- ✅ **Error handling** for EPIPE issues
- ✅ **Fallback instructions** if automated method fails
- ✅ **Progress tracking** for each attempt

---

## **Troubleshooting Network Issues**

### **Common Solutions:**

1. **Check Internet Connection:**
   ```bash
   ping api.vercel.com
   ```

2. **Try Different Network:**
   - Switch to mobile hotspot
   - Try different WiFi network

3. **Clear Vercel Cache:**
   ```bash
   vercel logout
   vercel login
   ```

4. **Update Vercel CLI:**
   ```bash
   npm install -g vercel@latest
   ```

5. **Use Manual Method:**
   - Go to Vercel dashboard
   - Add variables manually (fastest option)

---

## **Quick Copy-Paste Values**

### **For RASA_URL:**
```
https://codebase-x.onrender.com
```

### **For OPENROUTER_API_KEY:**
```
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
```

### **For NEXTAUTH_SECRET:**
```
Jt1cPA4WZXJm/pW/DwoN/1Uscvz/ozPysNbLafWJENw=
```

---

## **✅ Ready to Deploy!**

Once you've added the variables:
1. **Redeploy** your application
2. **Test** the chatbot functionality
3. **Verify** Rasa server connection

**The manual method is often faster and more reliable than CLI scripts!** 🚀
