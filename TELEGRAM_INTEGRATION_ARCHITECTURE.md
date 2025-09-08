# 🤖 Telegram Integration Architecture

## Overview

This document explains how the Telegram bot integration works in the SOULPATH wellness platform. The system uses a **hybrid architecture** that combines Next.js webhooks with Rasa conversational AI to provide intelligent responses to users.

## 🏗️ Architecture Diagram

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌─────────────┐
│   Telegram      │───▶│    ngrok     │───▶│   Next.js       │───▶│    Rasa     │
│   Bot API       │    │   Tunnel     │    │   Webhook       │    │   Server    │
│                 │    │              │    │                 │    │             │
└─────────────────┘    └──────────────┘    └─────────────────┘    └─────────────┘
                                │                    │                    │
                                │                    ▼                    │
                                │            ┌─────────────────┐         │
                                │            │   OpenRouter    │         │
                                │            │   Fallback      │         │
                                │            └─────────────────┘         │
                                │                    ▲                  │
                                └────────────────────┼──────────────────┘
                                                     │
                                            ┌─────────────────┐
                                            │   Response      │
                                            │   Back to       │
                                            │   Telegram      │
                                            └─────────────────┘
```

## 🔧 Key Components

### 1. **Telegram Bot API**
- **Bot Token**: `8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig`
- **Bot Username**: `@SoulPathAi_bot`
- **Webhook URL**: `https://ngrok-url/api/telegram/webhook`

### 2. **ngrok Tunnel**
- **Purpose**: Exposes local Next.js server to the internet
- **Port**: 3000 (Next.js development server)
- **URL**: `https://04a33bc3e13a.ngrok-free.app` (changes on restart)

### 3. **Next.js Webhook Handler**
- **File**: `frontend/app/api/telegram/webhook/route.ts`
- **Endpoint**: `/api/telegram/webhook`
- **Methods**: `GET` (health check), `POST` (message processing)

### 4. **Rasa Server**
- **Port**: 5005
- **Purpose**: Conversational AI processing
- **Integration**: Via REST API calls from Next.js

### 5. **OpenRouter Fallback**
- **Purpose**: AI responses when Rasa fails
- **Model**: `meta-llama/llama-3.3-8b-instruct:free`

## 📋 Configuration Files

### `backend/rasa/credentials.yml`
```yaml
# Telegram Bot API configuration - handled by custom Next.js webhook
# telegram:
#   access_token: "8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig"
#   verify: "SoulPathAi_bot"
```

**Important**: The Telegram section is **commented out** because we use a custom Next.js webhook instead of Rasa's built-in Telegram connector.

### `frontend/app/api/telegram/webhook/route.ts`
This file contains the main webhook handler that:
- Receives Telegram webhook calls
- Processes messages and callback queries
- Routes to Rasa or OpenRouter based on message content
- Sends responses back to Telegram

## 🚀 How It Works

### 1. **Message Flow**
1. User sends message to `@SoulPathAi_bot`
2. Telegram sends webhook to `https://ngrok-url/api/telegram/webhook`
3. ngrok forwards request to local Next.js server (port 3000)
4. Next.js webhook handler processes the message
5. Handler determines if it's a package request or general message
6. For package requests: Calls hybrid chat API
7. For general messages: Calls Rasa server via REST API
8. If Rasa fails: Falls back to OpenRouter
9. Response is sent back to Telegram

### 2. **Package Request Detection**
```typescript
const isPackageRequest = lowerText.includes('paquetes') || lowerText.includes('packages') || 
                        lowerText.includes('lista') || lowerText.includes('list') ||
                        lowerText.includes('mostrar') || lowerText.includes('show') ||
                        lowerText.includes('ver') || lowerText.includes('see') ||
                        lowerText.includes('dame') || lowerText.includes('give me');
```

### 3. **Response Handling**
- **Success**: Sends response text to Telegram
- **Failure**: Logs error and sends fallback message
- **Callback Queries**: Handles button interactions

## 🛠️ Setup Instructions

### 1. **Start Rasa Server**
```bash
cd backend/rasa
./rasa_env/bin/rasa run --enable-api --cors "*" --port 5005 --model models/latest.tar.gz
```

### 2. **Start Next.js Server**
```bash
cd frontend
npm run dev
```

### 3. **Start ngrok Tunnel**
```bash
ngrok http 3000
```

### 4. **Configure Telegram Webhook**
```bash
curl -X POST "https://api.telegram.org/bot8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_NGROK_URL/api/telegram/webhook"}'
```

## 🔍 Troubleshooting

### Common Issues

1. **404 Not Found on Webhook**
   - Check if Next.js server is running on port 3000
   - Verify ngrok is tunneling to port 3000, not 5005
   - Ensure webhook URL points to `/api/telegram/webhook`

2. **Rasa Server Not Responding**
   - Check if Rasa is running on port 5005
   - Verify credentials.yml has Telegram section commented out
   - Test Rasa directly: `curl http://localhost:5005/version`

3. **ngrok Tunnel Issues**
   - Restart ngrok if URL changes
   - Update Telegram webhook URL when ngrok restarts
   - Check ngrok dashboard at `http://127.0.0.1:4040`

### Debug Commands

```bash
# Check Rasa server
curl http://localhost:5005/version

# Check Next.js webhook
curl http://localhost:3000/api/telegram/webhook

# Check Telegram webhook status
curl "https://api.telegram.org/bot8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig/getWebhookInfo"

# Test webhook locally
curl -X POST "http://localhost:3000/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d '{"update_id": 1, "message": {"message_id": 1, "from": {"id": 123456789, "is_bot": false, "first_name": "Test"}, "chat": {"id": 123456789, "type": "private"}, "date": 1640995200, "text": "hello"}}'
```

## 📊 Monitoring

### Health Checks
- **Next.js**: `GET /api/telegram/webhook` returns `{"status": "ok"}`
- **Rasa**: `GET /version` returns version info
- **Telegram**: Webhook info shows pending updates

### Logs
- **Next.js**: Console logs show message processing
- **Rasa**: Server logs show AI processing
- **ngrok**: Dashboard shows request/response details

## 🔄 Why This Architecture?

### Advantages
1. **Flexibility**: Next.js can handle complex business logic
2. **Fallback**: Multiple AI providers (Rasa + OpenRouter)
3. **Scalability**: Easy to add new channels (WhatsApp, etc.)
4. **Maintainability**: Clear separation of concerns

### Why Not Rasa Telegram Connector?
1. **Limited Control**: Rasa's connector is basic
2. **No Fallback**: Can't easily switch AI providers
3. **Complex Setup**: Harder to debug and maintain
4. **Business Logic**: Can't integrate with Next.js APIs easily

## 🚨 Important Notes

1. **ngrok URL Changes**: Every time ngrok restarts, the URL changes
2. **Port Conflicts**: Make sure ports 3000 and 5005 are available
3. **Environment Variables**: Set up proper env vars for production
4. **Security**: Add authentication for production webhooks
5. **Rate Limiting**: Implement rate limiting for production use

## 📝 Future Improvements

1. **Database Integration**: Store conversation history
2. **User Authentication**: Link Telegram users to platform accounts
3. **Analytics**: Track conversation metrics
4. **Multi-language**: Support more languages
5. **Voice Messages**: Handle voice message inputs
6. **File Sharing**: Support image/document sharing

## 🔗 Related Files

- `frontend/app/api/telegram/webhook/route.ts` - Main webhook handler
- `frontend/app/api/chat/hybrid/route.ts` - Hybrid chat API
- `backend/rasa/credentials.yml` - Rasa configuration
- `backend/rasa/actions.py` - Rasa custom actions
- `frontend/lib/services/conversational-orchestrator.ts` - Chat orchestrator

---

**Last Updated**: September 7, 2025  
**Version**: 1.0  
**Status**: ✅ Working
