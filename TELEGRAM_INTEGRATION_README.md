# Telegram Bot Integration

This document provides a complete guide for integrating Telegram bot functionality into the SoulPath wellness platform.

## 🎯 Overview

The Telegram integration allows users to interact with the SoulPath conversational AI through Telegram, providing a seamless chat experience for booking sessions, viewing packages, and getting support.

## 🏗️ Architecture

```
Telegram User
    ↓
Telegram Bot API
    ↓
Webhook (/api/telegram/webhook)
    ↓
Conversational Orchestrator
    ├── Rasa Service (Intent Detection)
    ├── OpenRouter Service (LLM Responses)
    ├── API Service (Internal APIs)
    └── Logging Service (Audit Trail)
    ↓
Response to Telegram
```

## 📁 Files Created/Modified

### Backend (Rasa)
- `backend/rasa/connectors/telegram_connector.py` - Telegram connector for Rasa
- `backend/rasa/credentials.yml` - Updated with Telegram configuration
- `backend/setup-telegram-bot.py` - Bot setup and webhook configuration script

### Frontend (Next.js)
- `frontend/app/api/telegram/webhook/route.ts` - Telegram webhook endpoint
- `frontend/lib/services/telegram-service.ts` - Telegram API service
- `frontend/app/api/admin/telegram-config/route.ts` - Admin API for Telegram config
- `frontend/components/TelegramConfigManagement.tsx` - Admin UI component
- `frontend/app/(admin)/admin/telegram-config/page.tsx` - Admin page
- `frontend/scripts/create-telegram-config-table.sql` - Database migration

## 🚀 Setup Instructions

### 1. Create Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the prompts to create your bot
4. Save the bot token (format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Database Setup

Run the database migration to create the Telegram configuration table:

```sql
-- Execute the SQL script
\i frontend/scripts/create-telegram-config-table.sql
```

### 3. Environment Variables

Add the following environment variables to your deployment:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig
TELEGRAM_WEBHOOK_URL=https://your-domain.vercel.app/api/telegram/webhook

# Existing variables (ensure these are set)
RASA_URL=https://your-rasa-server.com
OPENROUTER_API_KEY=your-openrouter-key
```

### 4. Configure Webhook

#### Option A: Using the Setup Script
```bash
cd backend
python setup-telegram-bot.py
```

#### Option B: Manual Configuration
1. Go to your admin dashboard
2. Navigate to Telegram Configuration
3. Enter your bot token
4. Set your webhook URL
5. Test the connection
6. Save the configuration

### 5. Deploy and Test

1. Deploy your application
2. Ensure the webhook URL is accessible
3. Send a test message to your bot
4. Check the logs for any errors

## 🔧 Configuration

### Bot Token
- Get from @BotFather on Telegram
- Format: `{bot_id}:{bot_token}`
- Keep secure and never expose in client-side code

### Webhook URL
- Must be HTTPS
- Format: `https://your-domain.com/api/telegram/webhook`
- Must be publicly accessible

### Rasa Integration
The Telegram connector is configured in `credentials.yml`:

```yaml
telegram:
  bot_token: "8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig"
  webhook_url: "https://your-domain.vercel.app/api/telegram/webhook"
```

## 📱 Features

### Message Types Supported
- **Text Messages**: Regular chat messages
- **Callback Queries**: Button interactions
- **Commands**: Bot commands (e.g., `/start`, `/help`)

### Response Types
- **Text Responses**: Simple text messages
- **Inline Keyboards**: Interactive buttons
- **Images**: Photo sharing
- **Documents**: File attachments

### Admin Features
- **Bot Configuration**: Set token and webhook
- **Connection Testing**: Verify bot connectivity
- **Webhook Management**: Set/delete webhooks
- **Status Monitoring**: Check bot health
- **Audit Logging**: Track configuration changes

## 🔍 Testing

### 1. Connection Test
```bash
curl -X GET "https://api.telegram.org/bot{TOKEN}/getMe"
```

### 2. Webhook Test
```bash
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/telegram/webhook"}'
```

### 3. Send Test Message
```bash
curl -X POST "https://api.telegram.org/bot{TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "CHAT_ID", "text": "Hello from SoulPath!"}'
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Webhook Not Working
- **Check URL**: Ensure webhook URL is HTTPS and accessible
- **Check Logs**: Look for webhook errors in Telegram API
- **Verify Endpoint**: Test webhook endpoint manually

#### 2. Bot Not Responding
- **Check Token**: Verify bot token is correct
- **Check Webhook**: Ensure webhook is set and working
- **Check Logs**: Review application logs for errors

#### 3. Permission Errors
- **Check Bot Permissions**: Ensure bot has necessary permissions
- **Check Admin Access**: Verify admin dashboard access
- **Check Database**: Ensure database tables exist

### Debug Commands

```bash
# Check bot info
curl "https://api.telegram.org/bot{TOKEN}/getMe"

# Check webhook info
curl "https://api.telegram.org/bot{TOKEN}/getWebhookInfo"

# Delete webhook (for testing)
curl -X POST "https://api.telegram.org/bot{TOKEN}/deleteWebhook"
```

## 📊 Monitoring

### Health Checks
- Bot connectivity status
- Webhook configuration status
- Last webhook error (if any)
- Message processing statistics

### Logs
- Webhook requests and responses
- Bot interactions
- Error messages and stack traces
- Performance metrics

## 🔒 Security

### Best Practices
- **Secure Token Storage**: Store bot token securely
- **HTTPS Only**: Use HTTPS for all webhook URLs
- **Input Validation**: Validate all incoming messages
- **Rate Limiting**: Implement rate limiting for webhook
- **Audit Logging**: Log all configuration changes

### Token Security
- Never expose bot token in client-side code
- Use environment variables for token storage
- Rotate tokens periodically
- Monitor token usage

## 🚀 Deployment

### Production Checklist
- [ ] Bot token configured securely
- [ ] Webhook URL set and accessible
- [ ] Database tables created
- [ ] Environment variables set
- [ ] SSL certificate valid
- [ ] Monitoring configured
- [ ] Error handling tested
- [ ] Performance tested

### Scaling Considerations
- **Webhook Load**: Handle multiple concurrent webhooks
- **Database Performance**: Optimize database queries
- **Rate Limiting**: Implement proper rate limiting
- **Caching**: Cache frequently accessed data
- **Monitoring**: Set up comprehensive monitoring

## 📚 API Reference

### Telegram Bot API
- [Official Documentation](https://core.telegram.org/bots/api)
- [Webhook Guide](https://core.telegram.org/bots/webhooks)
- [Bot Commands](https://core.telegram.org/bots/commands)

### Internal APIs
- `GET /api/admin/telegram-config` - Get configuration
- `POST /api/admin/telegram-config` - Update configuration
- `DELETE /api/admin/telegram-config` - Delete configuration
- `POST /api/telegram/webhook` - Webhook endpoint

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the logs
3. Test with the provided scripts
4. Contact the development team

## 📝 Changelog

### Version 1.0.0
- Initial Telegram bot integration
- Webhook support
- Admin dashboard configuration
- Rasa connector implementation
- Comprehensive testing and documentation
