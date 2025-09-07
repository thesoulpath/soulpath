import { NextRequest, NextResponse } from 'next/server';
import { ConversationalOrchestrator } from '@/lib/services/conversational-orchestrator';
import { OrchestratorConfig, IntentActionMapping } from '@/lib/types/conversational-orchestrator';

// Configuración del orquestador
const orchestratorConfig: OrchestratorConfig = {
  rasa: {
    url: process.env.RASA_URL || 'http://localhost:5005',
    model: process.env.RASA_MODEL || 'rasa',
    confidence_threshold: parseFloat(process.env.RASA_CONFIDENCE_THRESHOLD || '0.7')
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-8b-instruct:free',
    temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || '1000')
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    webhookUrl: process.env.TWILIO_WEBHOOK_URL || ''
  },
  logging: {
    enabled: process.env.LOGGING_ENABLED !== 'false', // Enable by default unless explicitly disabled
    level: (process.env.LOGGING_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    storage: (process.env.LOGGING_STORAGE as 'database' | 'file' | 'console') || 'database'
  },
  apis: {
    baseUrl: process.env.API_BASE_URL || `${process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`}/api`,
    timeout: parseInt(process.env.API_TIMEOUT || '10000'),
    retries: parseInt(process.env.API_RETRIES || '3')
  }
};

// Mapeo de intenciones a acciones
const intentActionMapping: IntentActionMapping = {
  'greet': {
    action: 'greet_user',
    apiEndpoint: undefined,
    description: undefined
  },
  'book_session': {
    action: 'book_session',
    apiEndpoint: '/bookings',
    description: 'Te ayudo a reservar una sesión. ¿Qué tipo de sesión te interesa?'
  },
  'view_packages': {
    action: 'view_packages',
    apiEndpoint: '/packages',
    description: 'Aquí tienes nuestros paquetes disponibles:'
  },
  'check_balance': {
    action: 'check_balance',
    apiEndpoint: '/user/balance',
    description: 'Tu saldo actual es:'
  },
  'contact_support': {
    action: 'contact_support',
    apiEndpoint: undefined,
    description: 'Para contactar soporte, puedes escribirnos a support@soulpath.lat o usar nuestro chat en vivo.'
  },
  'goodbye': {
    action: 'goodbye',
    apiEndpoint: undefined,
    description: '¡Hasta luego! Que tengas un excelente día. 🙏'
  }
};

// Instancia del orquestador
let orchestrator: ConversationalOrchestrator | null = null;

function getTelegramOrchestrator(): ConversationalOrchestrator {
  if (!orchestrator) {
    orchestrator = new ConversationalOrchestrator(orchestratorConfig, intentActionMapping);
  }
  return orchestrator;
}

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 GET /api/telegram/webhook - Health check');
    return NextResponse.json({ 
      status: 'ok', 
      channel: 'telegram',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Telegram webhook GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📱 Telegram webhook received');
    
    const body = await request.json();
    console.log('📨 Telegram webhook body:', JSON.stringify(body, null, 2));

    // Verificar que es una actualización válida de Telegram
    if (!body.update_id) {
      console.log('⚠️ Invalid Telegram update - missing update_id');
      return NextResponse.json({ status: 'ok' });
    }

    const message = body.message;
    const callbackQuery = body.callback_query;

    if (message) {
      // Procesar mensaje de texto
      const chatId = message.chat?.id;
      const text = message.text;
      const userInfo = message.from;

      if (!chatId || !text) {
        console.log('⚠️ Invalid message - missing chat_id or text');
        return NextResponse.json({ status: 'ok' });
      }

      console.log(`💬 Processing message from ${userInfo?.first_name || 'Unknown'}: ${text}`);

      // Crear contexto de conversación
      const conversationContext = {
        userId: chatId.toString(),
        sessionId: `telegram_${chatId}_${message.chat?.id}`,
        conversationHistory: []
      };

      // Procesar con el orquestador
      const orchestrator = getTelegramOrchestrator();
      const response = await orchestrator.processMessage(text, conversationContext);

      // Enviar respuesta a Telegram
      if (response && 'success' in response && response.success && response.data && response.data.text) {
        await sendTelegramMessage(chatId.toString(), response.data.text);
        console.log(`✅ Response sent to Telegram: ${response.data.text}`);
      } else {
        console.log('⚠️ No response text found:', response);
      }

    } else if (callbackQuery) {
      // Procesar callback query (botones)
      const chatId = callbackQuery.message?.chat?.id;
      const data = callbackQuery.data;
      const userInfo = callbackQuery.from;

      if (!chatId || !data) {
        console.log('⚠️ Invalid callback query - missing chat_id or data');
        return NextResponse.json({ status: 'ok' });
      }

      console.log(`🔘 Processing callback from ${userInfo?.first_name || 'Unknown'}: ${data}`);

      // Crear contexto de conversación para callback
      const conversationContext = {
        userId: chatId.toString(),
        sessionId: `telegram_${chatId}_${callbackQuery.message?.chat?.id}`,
        conversationHistory: []
      };

      // Procesar con el orquestador
      const orchestrator = getTelegramOrchestrator();
      const response = await orchestrator.processMessage(data, conversationContext);

      // Enviar respuesta a Telegram
      if (response && 'success' in response && response.success && response.data && response.data.text) {
        await sendTelegramMessage(chatId.toString(), response.data.text);
        console.log(`✅ Callback response sent to Telegram: ${response.data.text}`);
      } else {
        console.log('⚠️ No callback response text found:', response);
      }

      // Responder al callback query para quitar el "loading" del botón
      await answerCallbackQuery(callbackQuery.id);
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('❌ Telegram webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig';
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to send Telegram message: ${response.status} - ${errorText}`);
    } else {
      console.log(`✅ Telegram message sent successfully to ${chatId}`);
    }
  } catch (error) {
    console.error('❌ Error sending Telegram message:', error);
  }
}

async function answerCallbackQuery(callbackQueryId: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig';
  const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_query_id: callbackQueryId
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to answer callback query: ${response.status} - ${errorText}`);
    } else {
      console.log(`✅ Callback query answered successfully`);
    }
  } catch (error) {
    console.error('❌ Error answering callback query:', error);
  }
}
