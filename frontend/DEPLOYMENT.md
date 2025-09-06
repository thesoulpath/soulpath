# SoulPath Chatbot Deployment Guide

## Deploying to Render.com

### Prerequisites
1. GitHub repository with your code
2. Render.com account
3. Environment variables configured

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### Step 2: Create Render Service
1. Go to [Render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select your repository

### Step 3: Configure Service Settings
- **Name**: `soulpath-chatbot`
- **Environment**: `Node`
- **Plan**: `Starter` (or higher for production)
- **Build Command**: Leave empty (using render.yaml)
- **Start Command**: Leave empty (using render.yaml)

### Step 4: Set Environment Variables
In Render dashboard, go to Environment tab and add:

```
NODE_ENV=production
PORT=3000
RASA_PORT=5005
NEXT_PUBLIC_BASE_URL=https://your-app-name.onrender.com
OPENROUTER_API_KEY=your_openrouter_api_key
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-app-name.onrender.com
```

### Step 5: Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. Monitor the build logs for any issues

### Step 6: Test Deployment
Once deployed, test your chatbot:
```bash
curl -X POST https://your-app-name.onrender.com/api/chat/simple \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "userId": "test"}'
```

## Alternative: Docker Deployment

If you prefer Docker deployment:

1. Use the provided `Dockerfile`
2. Build and push to Docker Hub
3. Deploy using Docker on Render

## Troubleshooting

### Common Issues:
1. **Rasa model not found**: Ensure the model is trained and committed to git
2. **Port conflicts**: Check that ports 3000 and 5005 are available
3. **Memory issues**: Upgrade to a higher plan if needed
4. **Build timeouts**: Optimize build process or use pre-built images

### Logs:
- Check Render dashboard for build and runtime logs
- Monitor both Next.js and Rasa server logs

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode | Yes |
| `PORT` | Next.js server port | Yes |
| `RASA_PORT` | Rasa server port | Yes |
| `NEXT_PUBLIC_BASE_URL` | Public URL for API calls | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key | Yes |
| `DATABASE_URL` | Database connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes |
| `NEXTAUTH_URL` | NextAuth URL | Yes |
