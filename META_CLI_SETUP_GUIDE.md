# Meta CLI Setup Guide for WhatsApp Business API

This guide shows you how to configure WhatsApp Business API integration using our custom Meta CLI setup tools.

## 🚀 Quick Start

### 1. Run the Meta CLI Setup

```bash
cd backend
./meta-cli-setup.sh setup
```

This will guide you through the entire setup process interactively.

### 2. Test the Integration

```bash
./meta-cli-setup.sh test
```

### 3. Start Rasa with WhatsApp

```bash
./meta-cli-setup.sh start
```

## 📋 Prerequisites

Before running the setup, ensure you have:

1. **Meta Business Account** - Create at [business.facebook.com](https://business.facebook.com)
2. **Meta Developer Account** - Create at [developers.facebook.com](https://developers.facebook.com)
3. **WhatsApp Business Account** - Set up through Meta Business Manager
4. **Public Webhook URL** - Your server must be accessible from the internet

## 🔧 Setup Process

### Step 1: Create Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Business" as app type
4. Fill in app details:
   - **App Name**: Your wellness app name
   - **App Contact Email**: Your email
   - **App Purpose**: Business
5. Click "Create App"

### Step 2: Add WhatsApp Product

1. In your app dashboard, click "Add Product"
2. Find "WhatsApp" and click "Set up"
3. Follow the setup wizard
4. Note down your credentials:
   - **App ID**
   - **App Secret**
   - **Access Token**

### Step 3: Configure WhatsApp Business Account

1. Go to [Meta Business Manager](https://business.facebook.com/)
2. Navigate to WhatsApp Business Accounts
3. Create or select your WhatsApp Business Account
4. Add a phone number for your business
5. Note down:
   - **Business Account ID**
   - **Phone Number ID**

### Step 4: Run Meta CLI Setup

```bash
cd backend
./meta-cli-setup.sh setup
```

The script will:
- ✅ Check Python installation
- ✅ Install required dependencies
- ✅ Guide you through credential input
- ✅ Test Meta Graph API connection
- ✅ Fetch your WhatsApp Business Accounts
- ✅ Fetch your phone numbers
- ✅ Set up webhook subscription
- ✅ Generate configuration files

## 🎯 Available Commands

### Setup Commands

```bash
# Run complete setup wizard
./meta-cli-setup.sh setup

# Test the integration
./meta-cli-setup.sh test

# Start Rasa with WhatsApp
./meta-cli-setup.sh start

# Show help
./meta-cli-setup.sh help
```

### Python Setup Script

You can also use the Python script directly:

```bash
# Interactive setup
python setup-meta-whatsapp.py --interactive

# Test with existing credentials
python setup-meta-whatsapp.py --credentials rasa/.env

# Send test message
python setup-meta-whatsapp.py --credentials rasa/.env --test-message +1234567890
```

## 📁 Generated Files

After running the setup, these files will be created/updated:

- `rasa/.env` - Environment variables with your credentials
- `rasa/credentials.yml` - Rasa credentials configuration
- `whatsapp-credentials.env` - Backup credentials file

## 🔍 Configuration Details

### Environment Variables

The setup script configures these variables:

```env
# Meta App Credentials
META_ACCESS_TOKEN=your_access_token_here
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here

# WhatsApp Business API Credentials
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
WHATSAPP_VERIFY_TOKEN=your_verify_token_here
WHATSAPP_WEBHOOK_URL=https://your-domain.com/webhooks/whatsapp/webhook
```

### Rasa Configuration

The script automatically updates `rasa/credentials.yml`:

```yaml
whatsapp:
  verify_token: "${WHATSAPP_VERIFY_TOKEN}"
  access_token: "${WHATSAPP_ACCESS_TOKEN}"
  phone_number_id: "${WHATSAPP_PHONE_NUMBER_ID}"
  business_account_id: "${WHATSAPP_BUSINESS_ACCOUNT_ID}"
  webhook_url: "${WHATSAPP_WEBHOOK_URL}"
```

## 🧪 Testing

### 1. Test Webhook Verification

```bash
curl "https://your-domain.com/webhooks/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=test_challenge"
```

Expected response: `test_challenge`

### 2. Test Message Sending

```bash
python setup-meta-whatsapp.py --credentials rasa/.env --test-message +1234567890
```

### 3. Test Full Integration

```bash
./meta-cli-setup.sh test
```

## 🔧 Troubleshooting

### Common Issues

1. **"Python not found"**
   ```bash
   # Install Python 3.7+
   # macOS
   brew install python3
   
   # Ubuntu/Debian
   sudo apt update && sudo apt install python3 python3-pip
   ```

2. **"Meta API connection failed"**
   - Check your access token is valid
   - Ensure your app has WhatsApp product enabled
   - Verify your app is not in development mode restrictions

3. **"No WhatsApp Business Accounts found"**
   - Create a WhatsApp Business Account in Meta Business Manager
   - Link it to your Meta App
   - Add a phone number to the business account

4. **"Webhook setup failed"**
   - Ensure your webhook URL is publicly accessible
   - Check that your server is running
   - Verify the webhook URL uses HTTPS

5. **"Test message failed"**
   - Check your phone number ID is correct
   - Ensure your WhatsApp Business Account is approved
   - Verify the recipient number is valid

### Debug Mode

Run with debug logging:

```bash
cd rasa
python run_whatsapp.py --debug
```

### Check Logs

```bash
# Rasa logs
tail -f rasa/logs/rasa.log

# Application logs
tail -f frontend/logs/app.log
```

## 📊 Monitoring

### Health Checks

```bash
# Check Rasa server
curl http://localhost:5005/webhooks/whatsapp/webhook

# Check webhook endpoint
curl https://your-domain.com/api/whatsapp-business/webhook
```

### Meta Business Manager

Monitor your WhatsApp Business Account:
1. Go to [Meta Business Manager](https://business.facebook.com/)
2. Navigate to WhatsApp Business Accounts
3. Check message delivery and webhook status

## 🔒 Security Best Practices

1. **Keep Credentials Secure**
   - Never commit `.env` files to version control
   - Use environment variables in production
   - Rotate access tokens regularly

2. **Webhook Security**
   - Use HTTPS for webhook URLs
   - Validate webhook signatures
   - Implement rate limiting

3. **Access Control**
   - Limit API access to necessary permissions
   - Use app-specific access tokens
   - Monitor API usage

## 📈 Next Steps

After successful setup:

1. **Customize Intents** - Update your Rasa domain with wellness-specific intents
2. **Add Rich Media** - Implement image, document, and button support
3. **Set Up Templates** - Create approved message templates
4. **Add Analytics** - Track conversation metrics
5. **Multi-language** - Add Spanish/English support

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review Meta's WhatsApp Business API documentation
3. Check Rasa logs for specific errors
4. Verify all credentials are correct

## 📚 Resources

- [Meta WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Rasa Custom Connectors](https://rasa.com/docs/rasa/connectors/custom-connectors/)
- [WhatsApp Business API Reference](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Meta Business Manager](https://business.facebook.com/)

## 🎉 Success!

Once setup is complete, your wellness application will be able to:

- ✅ Receive WhatsApp messages from users
- ✅ Process messages with Rasa NLU
- ✅ Generate intelligent responses with OpenRouter
- ✅ Send responses back to WhatsApp
- ✅ Handle all your wellness intents (booking, payments, etc.)

Your WhatsApp Business API integration is now ready to serve your wellness customers! 🌟
