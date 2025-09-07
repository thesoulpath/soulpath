# WhatsApp Business API Integration with Rasa

This guide will help you set up direct integration between Meta's WhatsApp Business API and Rasa for your wellness application.

## 🚀 Quick Start

### 1. Prerequisites

- Meta Business Account
- WhatsApp Business Account
- Rasa server running
- Node.js/Next.js application

### 2. Meta Business Setup

#### Step 1: Create a Meta App
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Business" as app type
4. Fill in app details and create

#### Step 2: Add WhatsApp Product
1. In your app dashboard, click "Add Product"
2. Find "WhatsApp" and click "Set up"
3. Follow the setup wizard

#### Step 3: Get Credentials
You'll need these values:
- **Access Token**: From WhatsApp → Getting Started
- **Phone Number ID**: From WhatsApp → Getting Started  
- **Business Account ID**: From WhatsApp → Getting Started
- **Verify Token**: Custom string you create (e.g., "my_verify_token_123")

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cp backend/rasa/whatsapp.env.example backend/rasa/.env
```

Edit `backend/rasa/.env` with your credentials:
```env
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token_here
WHATSAPP_WEBHOOK_URL=https://your-domain.com/webhooks/whatsapp/webhook
```

### 4. Start Rasa with WhatsApp Integration

```bash
cd backend
./start-whatsapp-rasa.sh
```

### 5. Configure Webhook in Meta

1. Go to WhatsApp → Configuration
2. Set webhook URL: `https://your-domain.com/webhooks/whatsapp/webhook`
3. Set verify token: (same as WHATSAPP_VERIFY_TOKEN)
4. Subscribe to `messages` events

## 📱 How It Works

### Message Flow
1. User sends message to WhatsApp Business number
2. Meta sends webhook to your Rasa server
3. Rasa processes message with NLU and dialogue management
4. Rasa sends response back to Meta
5. Meta delivers response to user

### Architecture
```
WhatsApp User → Meta WhatsApp API → Rasa Server → OpenRouter LLM → Response
```

## 🔧 Configuration Files

### Rasa Credentials (`frontend/rasa/credentials.yml`)
```yaml
whatsapp:
  verify_token: "${WHATSAPP_VERIFY_TOKEN}"
  access_token: "${WHATSAPP_ACCESS_TOKEN}"
  phone_number_id: "${WHATSAPP_PHONE_NUMBER_ID}"
  business_account_id: "${WHATSAPP_BUSINESS_ACCOUNT_ID}"
  webhook_url: "${WHATSAPP_WEBHOOK_URL}"
```

### Custom WhatsApp Connector
- `backend/rasa/connectors/whatsapp_connector.py` - Custom Rasa connector
- `backend/rasa/run_whatsapp.py` - Startup script with WhatsApp integration

### Next.js Webhook
- `frontend/app/api/whatsapp-business/webhook/route.ts` - Webhook endpoint

## 🧪 Testing

### 1. Test Webhook Verification
```bash
curl "https://your-domain.com/webhooks/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=test_challenge"
```

### 2. Test Message Processing
Send a message to your WhatsApp Business number and check the logs.

### 3. Check Rasa Server
```bash
curl http://localhost:5005/webhooks/whatsapp/webhook
```

## 🎯 Supported Intents

The system supports these intents for your wellness application:

| Intent | Description | Required Entities |
|--------|-------------|-------------------|
| `saludo` | Greetings and welcome | - |
| `agendar_cita` | Book appointment | `fecha`, `hora`, `email` |
| `consultar_paquetes` | Check packages | - |
| `pagar_servicio` | Process payment | `monto`, `método_pago`, `email` |
| `cancelar_cita` | Cancel appointment | `cita_id`, `email` |
| `consultar_estado` | Check status | `solicitud_id`, `cita_id`, `email` |
| `consultar_historial` | Check history | `email` |
| `consultar_horarios` | Check available times | - |
| `actualizar_perfil` | Update profile | `email` |
| `ayuda` | Get help | - |
| `despedida` | Farewell | - |

## 🔍 Troubleshooting

### Common Issues

1. **Webhook verification fails**
   - Check that `WHATSAPP_VERIFY_TOKEN` matches Meta configuration
   - Ensure webhook URL is accessible publicly

2. **Messages not received**
   - Verify webhook is subscribed to `messages` events
   - Check Rasa server logs for errors

3. **Responses not sent**
   - Verify `WHATSAPP_ACCESS_TOKEN` is valid
   - Check `WHATSAPP_PHONE_NUMBER_ID` is correct

4. **Rasa server won't start**
   - Check all environment variables are set
   - Ensure virtual environment is activated
   - Install missing dependencies: `pip install aiohttp`

### Debug Mode
Start Rasa with debug logging:
```bash
cd backend/rasa
python run_whatsapp.py --debug
```

## 📊 Monitoring

### Logs
- Rasa logs: Check console output
- WhatsApp API logs: Check Meta Business Manager
- Application logs: Check Next.js logs

### Health Check
```bash
curl https://your-domain.com/api/whatsapp-business/webhook
```

## 🔒 Security

- Keep access tokens secure
- Use HTTPS for webhook URLs
- Validate webhook signatures
- Rate limit webhook endpoints

## 📈 Next Steps

1. **Add Rich Media Support**: Images, documents, buttons
2. **Implement Templates**: Pre-approved message templates
3. **Add Analytics**: Track conversation metrics
4. **Multi-language Support**: Spanish/English detection
5. **Voice Messages**: Handle audio messages

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Meta's WhatsApp Business API documentation
3. Check Rasa documentation for custom connectors
4. Review application logs for specific errors

## 📚 Resources

- [Meta WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Rasa Custom Connectors](https://rasa.com/docs/rasa/connectors/custom-connectors/)
- [WhatsApp Business API Reference](https://developers.facebook.com/docs/whatsapp/cloud-api)
