# 🚀 Local Telegram Bot Setup Guide

## Quick Setup for Testing with Real Telegram Users

### Step 1: Start Your Next.js App
```bash
cd frontend
npm run dev
```
Your app should be running on `http://localhost:3000`

### Step 2: Install and Start ngrok
```bash
# If not already installed
brew install ngrok/ngrok/ngrok

# Start ngrok tunnel
ngrok http 3000
```

### Step 3: Get Your ngrok URL
After starting ngrok, you'll see output like:
```
Session Status                online
Account                       your-account
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
Forwarding                    http://abc123.ngrok.io -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

### Step 4: Set Up Telegram Webhook
```bash
cd backend
python setup-telegram-local.py
```

When prompted, enter your webhook URL:
```
https://abc123.ngrok.io/api/telegram/webhook
```

### Step 5: Test the Bot
1. Open Telegram and search for `@SoulPathAi_bot`
2. Send a message like "Hello" or "Hi"
3. Check your Next.js console for webhook logs
4. The bot should respond with AI-generated messages

## 🔧 Manual Webhook Setup (Alternative)

If the script doesn't work, you can set the webhook manually:

```bash
curl -X POST "https://api.telegram.org/bot8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_NGROK_URL.ngrok.io/api/telegram/webhook"}'
```

Replace `YOUR_NGROK_URL` with your actual ngrok URL.

## 🧪 Testing Commands

### Test Bot Connection
```bash
curl "https://api.telegram.org/bot8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig/getMe"
```

### Check Webhook Status
```bash
curl "https://api.telegram.org/bot8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig/getWebhookInfo"
```

### Send Test Message
```bash
curl -X POST "https://api.telegram.org/bot8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "YOUR_CHAT_ID", "text": "Hello from SoulPath!"}'
```

## 🐛 Troubleshooting

### ngrok Not Working
1. Make sure port 3000 is not blocked
2. Try a different port: `ngrok http 3001`
3. Check if ngrok is authenticated: `ngrok config check`

### Webhook Not Receiving Messages
1. Verify webhook URL is HTTPS
2. Check Next.js app is running
3. Look at ngrok web interface: `http://localhost:4040`
4. Check Next.js console for errors

### Bot Not Responding
1. Verify webhook is set correctly
2. Check bot token is correct
3. Ensure Rasa server is running (if using Rasa integration)
4. Check environment variables

## 📱 Bot Features to Test

1. **Basic Greeting**: Send "Hello" or "Hi"
2. **Session Booking**: Send "I want to book a session"
3. **Package Inquiry**: Send "What packages do you have?"
4. **Support Request**: Send "I need help"
5. **Goodbye**: Send "Bye" or "Goodbye"

## 🔄 Stopping the Setup

To stop the webhook and clean up:
```bash
curl -X POST "https://api.telegram.org/bot8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig/deleteWebhook"
```

## 📊 Monitoring

- **ngrok Web Interface**: `http://localhost:4040`
- **Next.js Console**: Check for webhook logs
- **Telegram Bot**: Test with real messages

## 🎉 Success Indicators

✅ ngrok shows "online" status  
✅ Webhook returns 200 OK  
✅ Bot responds to messages  
✅ Next.js console shows webhook logs  
✅ Messages are processed by the orchestrator  

---

**Your Bot**: @SoulPathAi_bot  
**Bot Token**: 8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig  
**Status**: ✅ Connected and ready for testing
