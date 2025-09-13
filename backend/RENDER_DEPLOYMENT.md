# Rasa Server Docker Deployment on Render

This guide explains how to deploy the Rasa server to Render using Docker.

## 🚀 Quick Start

### Prerequisites

1. **GitHub/GitLab Repository**: Your code should be in a Git repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Trained Rasa Model**: Ensure you have a trained model in the `models/` directory

### Deployment Steps

1. **Push your code to Git**:
   ```bash
   git add .
   git commit -m "Add Docker configuration for Render deployment"
   git push origin main
   ```

2. **Create a new Web Service on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your repository

3. **Configure the service**:
   - **Name**: `rasa-server` (or your preferred name)
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile.rasa`
   - **Docker Context**: `.`
   - **Plan**: `Starter` (free tier)

4. **Set Environment Variables**:
   ```
   PORT=5005
   PYTHONUNBUFFERED=1
   TF_CPP_MIN_LOG_LEVEL=2
   OMP_NUM_THREADS=1
   MKL_NUM_THREADS=1
   NUMEXPR_NUM_THREADS=1
   OPENBLAS_NUM_THREADS=1
   ```

5. **Deploy**: Click "Create Web Service"

## 🔧 Configuration Files

### Dockerfile.rasa
- Optimized for Render's environment
- Uses Python 3.10-slim base image
- Includes all necessary dependencies
- Memory-optimized for cloud deployment

### render.yaml
- Defines both Rasa server and actions server
- Uses Docker runtime
- Includes health checks
- Optimized for Render's infrastructure

### docker-compose.yml
- For local testing and development
- Includes nginx reverse proxy
- Easy local development setup

## 🧪 Local Testing

Before deploying to Render, test locally:

```bash
# Build and test the Docker image
cd backend
./deploy-to-render.sh

# Or use docker-compose for full stack
docker-compose up --build
```

## 📡 API Endpoints

Once deployed, your Rasa server will be available at:

- **Main API**: `https://your-app-name.onrender.com`
- **Webhooks**: `https://your-app-name.onrender.com/webhooks/rest/`
- **Health Check**: `https://your-app-name.onrender.com/webhooks/rest/`

## 🔗 Webhook Configuration

Update your webhook URLs in `credentials.yml`:

```yaml
telegram:
  access_token: "YOUR_BOT_TOKEN"
  verify: "YOUR_BOT_USERNAME"
  webhook_url: "https://your-app-name.onrender.com/webhooks/telegram/webhook"
```

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails**: Check that all dependencies are in `requirements.txt`
2. **Memory Issues**: The Dockerfile is optimized for memory usage
3. **Model Training**: Ensure you have a trained model in the `models/` directory
4. **Port Issues**: Render automatically sets the `PORT` environment variable

### Logs

Check Render logs for debugging:
- Go to your service dashboard
- Click on "Logs" tab
- Look for error messages or warnings

### Health Checks

The service includes health checks:
- Endpoint: `/webhooks/rest/`
- Interval: 30 seconds
- Timeout: 10 seconds

## 📊 Monitoring

Render provides built-in monitoring:
- **Uptime**: Service availability
- **Response Time**: API response times
- **Logs**: Real-time log streaming
- **Metrics**: Resource usage

## 🔄 Updates

To update your deployment:
1. Push changes to your Git repository
2. Render automatically rebuilds and redeploys
3. Monitor logs for any issues

## 💰 Cost Optimization

- **Starter Plan**: Free tier with limitations
- **Memory Usage**: Optimized for minimal memory footprint
- **CPU Usage**: Single-threaded configuration for efficiency

## 🛡️ Security

- **Non-root User**: Container runs as non-root user
- **Minimal Dependencies**: Only necessary packages included
- **Health Checks**: Automatic health monitoring
- **Environment Variables**: Sensitive data via environment variables

## 📝 Notes

- The deployment includes both Rasa server and actions server
- Models are trained during deployment if not present
- The service is optimized for Render's infrastructure
- All logs are available in the Render dashboard

## 🆘 Support

If you encounter issues:
1. Check the Render logs
2. Verify your configuration files
3. Test locally with Docker
4. Check the Rasa documentation
5. Contact Render support if needed
