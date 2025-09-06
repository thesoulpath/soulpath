# 🚀 Quick Vercel Environment Setup

## **Automated Scripts to Add RASA_URL and OPENROUTER_API_KEY**

### **Option 1: Bash Script (Recommended)**
```bash
./add-vercel-env.sh
```

### **Option 2: Node.js Script**
```bash
node add-vercel-env.js
```

## **What These Scripts Do:**

✅ **Automatically adds:**
- `RASA_URL=https://codebase-x.onrender.com`
- `OPENROUTER_API_KEY=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`

✅ **To all environments:**
- Production
- Preview  
- Development

## **Prerequisites:**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Make sure you're in your project directory:**
   ```bash
   cd /path/to/your/project
   ```

## **Run the Script:**

```bash
# Make executable (if not already)
chmod +x add-vercel-env.sh

# Run the script
./add-vercel-env.sh
```

## **Expected Output:**
```
🚀 Adding Environment Variables to Vercel...
==============================================

✅ Vercel CLI ready

📋 Adding Environment Variables:
================================
🔗 Adding RASA_URL...
✅ RASA_URL added to all environments
🔑 Adding OPENROUTER_API_KEY...
✅ OPENROUTER_API_KEY added to all environments

📊 Current Environment Variables:
=================================
[Shows your current env vars]

🎉 Success! Environment variables added to Vercel
```

## **Next Steps After Running Script:**

1. **Add remaining critical variables in Vercel dashboard:**
   - `DATABASE_URL` (from Supabase/PlanetScale)
   - `REDIS_URL` (from Upstash/Redis Cloud)
   - `NEXTAUTH_SECRET` (generate with: `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (your Vercel domain)

2. **Redeploy your application:**
   ```bash
   vercel --prod
   ```

## **Manual Alternative:**

If scripts don't work, add manually in Vercel dashboard:
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Settings → Environment Variables
4. Add each variable with the values above

## **Troubleshooting:**

- **"Not logged in"**: Run `vercel login`
- **"Vercel CLI not found"**: Run `npm install -g vercel`
- **"Permission denied"**: Run `chmod +x add-vercel-env.sh`

✅ **Ready to deploy!**
