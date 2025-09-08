# 🚀 Rasa Model Deployment to Render (Non-Docker)

This guide provides step-by-step instructions for deploying your Rasa wellness chatbot to Render without using Docker.

## 📋 Prerequisites

- Render account with billing enabled (for persistent services)
- Trained Rasa model in `models/` directory
- GitHub repository with all Rasa files

## 🏗️ Deployment Architecture

```
Render Services:
├── rasa-server (Web Service)
│   ├── Rasa Core + NLU
│   ├── REST API endpoints
│   └── Model serving
│
└── rasa-actions (Web Service)
    ├── Custom actions
    ├── API integrations
    └── Business logic
```

## 🚀 Step-by-Step Deployment

### 1. Create Rasa Server Service

1. **Go to Render Dashboard** → New → Web Service
2. **Connect Repository**: Select your GitHub repo
3. **Service Configuration**:
   - **Name**: `rasa-server` or `soulpath-rasa`
   - **Runtime**: Python 3
   - **Build Command**:
     ```bash
     pip install -r backend/rasa/requirements.txt
     ```
   - **Start Command**:
     ```bash
     cd backend/rasa && python -m rasa run --enable-api --cors "*" --port $PORT --credentials credentials.yml --endpoints endpoints.yml
     ```

### 2. Create Rasa Actions Service

1. **Go to Render Dashboard** → New → Web Service
2. **Connect Repository**: Select the same GitHub repo
3. **Service Configuration**:
   - **Name**: `rasa-actions` or `soulpath-actions`
   - **Runtime**: Python 3
   - **Build Command**:
     ```bash
     pip install -r backend/rasa/requirements.txt
     ```
   - **Start Command**:
     ```bash
     cd backend/rasa && python -m rasa run actions --port $PORT
     ```

### 3. Configure Environment Variables

#### For Rasa Server Service:
```env
PORT=5005
ACTION_ENDPOINT_URL=https://your-actions-service.onrender.com/webhook
RASA_MODEL_SERVER=null
PYTHONPATH=/opt/render/project/src
LOG_LEVEL=INFO
```

#### For Rasa Actions Service:
```env
PORT=5055
PYTHONPATH=/opt/render/project/src
LOG_LEVEL=INFO
```

### 4. Service Dependencies

1. **Deploy Actions Service First**
2. **Get Actions Service URL** from Render dashboard
3. **Update Rasa Server** environment variables with the Actions service URL

## 🔧 Configuration Files

### Files Created for Render:
- ✅ `render.yaml` - Service configuration
- ✅ `requirements.txt` - Python dependencies
- ✅ `runtime.txt` - Python version specification
- ✅ `start.sh` - Startup script
- ✅ `Procfile` - Process definitions
- ✅ `env.example` - Environment variables template

### Modified Files:
- ✅ `endpoints.yml` - Updated with environment variables
- ✅ `credentials.yml` - Ready for production

## 🌐 Networking Configuration

### Internal Communication:
```yaml
# endpoints.yml
action_endpoint:
  url: "${ACTION_ENDPOINT_URL:http://localhost:5055/webhook}"
```

### External Access:
- **Rasa Server**: `https://your-rasa-service.onrender.com`
- **Actions Server**: `https://your-actions-service.onrender.com`
- **API Endpoints**: `/webhooks/rest/webhook`
- **Health Check**: `/`

## 🧪 Testing Deployment

### 1. Health Check
```bash
curl https://your-rasa-service.onrender.com/
# Should return: {"version": "3.6.21", ...}
```

### 2. API Test
```bash
curl -X POST https://your-rasa-service.onrender.com/webhooks/rest/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola"}'
```

### 3. Actions Test
```bash
curl https://your-actions-service.onrender.com/health
# Should return: {"status": "ok"}
```

## 🔄 Updating Deployment

### Model Updates:
1. Train new model locally
2. Save to `models/` directory
3. Commit and push to GitHub
4. Render auto-deploys with new model

### Code Updates:
1. Push changes to GitHub
2. Render auto-deploys
3. Monitor logs in Render dashboard

## 📊 Monitoring & Logs

### Render Dashboard:
- **Service Status**: Real-time health
- **Logs**: Build and runtime logs
- **Metrics**: CPU, memory, requests
- **Alerts**: Configure for failures

### Custom Logging:
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

## 🛠️ Troubleshooting

### Common Issues:

#### 1. Port Already in Use
- Render assigns random ports via `$PORT`
- Don't hardcode ports in code

#### 2. Actions Server Connection
- Ensure `ACTION_ENDPOINT_URL` is correct
- Check Actions service is running
- Verify cross-service networking

#### 3. Model Loading Issues
- Ensure model file is in `models/` directory
- Check file permissions
- Verify model compatibility

#### 4. Memory Issues
- Monitor memory usage in Render dashboard
- Consider upgrading service plan
- Optimize model size if needed

### Debug Commands:
```bash
# Check service status
curl https://your-service.onrender.com/

# Test API endpoints
curl -X POST https://your-service.onrender.com/webhooks/rest/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Check logs in Render dashboard
# View under "Logs" tab of your service
```

## 🔒 Security Considerations

### Environment Variables:
- Store sensitive data in environment variables
- Never commit secrets to repository
- Use Render's secret management

### Network Security:
- Use HTTPS for all external communications
- Configure CORS appropriately
- Implement rate limiting if needed

## 📈 Scaling

### Horizontal Scaling:
- Deploy multiple instances
- Use load balancer
- Implement session affinity if needed

### Performance Optimization:
- Monitor response times
- Optimize model size
- Use caching for frequent queries
- Implement connection pooling

## 🎯 Production Checklist

- [ ] Services deployed successfully
- [ ] Environment variables configured
- [ ] Cross-service communication working
- [ ] Health checks passing
- [ ] Model loading correctly
- [ ] API endpoints responding
- [ ] Logging configured
- [ ] Monitoring alerts set up
- [ ] Backup strategy in place

## 📞 Support

For issues:
1. Check Render service logs
2. Review this deployment guide
3. Test locally first
4. Contact Render support if needed

---

**Deployment successful!** 🎉 Your Rasa wellness chatbot is now live on Render.
