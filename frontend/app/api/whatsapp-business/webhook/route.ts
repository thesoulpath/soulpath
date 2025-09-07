import { NextRequest, NextResponse } from 'next/server';
import { ConversationalOrchestrator } from '@/lib/services/conversational-orchestrator';
import { OrchestratorConfig, IntentActionMapping } from '@/lib/types/conversational-orchestrator';

// Configuración del orquestador para WhatsApp Business API
const orchestratorConfig: OrchestratorConfig = {
  rasa: {
    url: process.env.RASA_URL || 'http://localhost:5005',
    model: process.env.RASA_MODEL || 'rasa',
    confidence_threshold: parseFloat(process.env.RASA_CONFIDENCE_THRESHOLD || '0.7')
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free',
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
    enabled: process.env.LOGGING_ENABLED === 'true',
    level: (process.env.LOGGING_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    storage: (process.env.LOGGING_STORAGE as 'database' | 'file' | 'console') || 'console'
  },
  apis: {
    baseUrl: process.env.API_BASE_URL || `${process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`}/api`,
    timeout: parseInt(process.env.API_TIMEOUT || '10000'),
    retries: parseInt(process.env.API_RETRIES || '3')
  }
};

// Mapeo de intenciones a acciones
const intentActionMapping: IntentActionMapping = {
  'consulta_estado': {
    action: 'consultar_estado',
    apiEndpoint: '/admin/bookings',
    requiredEntities: ['solicitud_id', 'cita_id', 'email'],
    optionalEntities: ['tipo_consulta'],
    description: 'Consultar el estado de una solicitud o cita'
  },
  'agendar_cita': {
    action: 'agendar_cita',
    apiEndpoint: '/booking',
    requiredEntities: ['fecha', 'hora', 'email'],
    optionalEntities: ['tipo_sesion', 'paquete_id', 'tamaño_grupo', 'notas'],
    description: 'Agendar una nueva cita'
  },
  'consultar_paquetes': {
    action: 'consultar_paquetes',
    apiEndpoint: '/packages',
    requiredEntities: [],
    optionalEntities: ['tipo_paquete', 'moneda', 'duración'],
    description: 'Consultar paquetes disponibles'
  },
  'pagar_servicio': {
    action: 'pagar_servicio',
    apiEndpoint: '/client/purchase',
    requiredEntities: ['monto', 'método_pago', 'email'],
    optionalEntities: ['cita_id', 'paquete_id', 'moneda', 'notas'],
    description: 'Procesar un pago'
  },
  'cancelar_cita': {
    action: 'cancelar_cita',
    apiEndpoint: '/client/bookings',
    requiredEntities: ['cita_id', 'email'],
    optionalEntities: ['motivo'],
    description: 'Cancelar una cita existente'
  },
  'consultar_historial': {
    action: 'consultar_historial',
    apiEndpoint: '/client/purchase-history',
    requiredEntities: ['email'],
    optionalEntities: ['tipo_historial', 'fecha_desde', 'fecha_hasta'],
    description: 'Consultar historial del usuario'
  },
  'consultar_horarios': {
    action: 'consultar_horarios',
    apiEndpoint: '/schedule-slots',
    requiredEntities: [],
    optionalEntities: ['fecha', 'duración', 'tipo_sesion'],
    description: 'Consultar horarios disponibles'
  },
  'actualizar_perfil': {
    action: 'actualizar_perfil',
    apiEndpoint: '/client/me',
    requiredEntities: ['email'],
    optionalEntities: ['nombre', 'teléfono', 'fecha_nacimiento', 'lugar_nacimiento'],
    description: 'Actualizar información del perfil'
  },
  'saludo': {
    action: 'saludo',
    requiredEntities: [],
    optionalEntities: ['nombre'],
    description: 'Manejar saludos y bienvenidas'
  },
  'despedida': {
    action: 'despedida',
    requiredEntities: [],
    optionalEntities: [],
    description: 'Manejar despedidas'
  },
  'ayuda': {
    action: 'ayuda',
    requiredEntities: [],
    optionalEntities: ['tema_ayuda'],
    description: 'Proporcionar ayuda y soporte'
  }
};

// Instancia del orquestador (singleton)
let orchestrator: ConversationalOrchestrator | null = null;

function getOrchestrator(): ConversationalOrchestrator {
  if (!orchestrator) {
    orchestrator = new ConversationalOrchestrator(orchestratorConfig, intentActionMapping);
  }
  return orchestrator;
}

// Función para enviar mensaje a WhatsApp Business API
async function sendWhatsAppMessage(phoneNumberId: string, accessToken: string, to: string, message: string) {
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  
  const payload = {
    messaging_product: "whatsapp",
    to: to,
    type: "text",
    text: {
      body: message
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WhatsApp API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Verificación del webhook de WhatsApp
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('WhatsApp webhook verified successfully');
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.error('WhatsApp webhook verification failed');
      return new NextResponse('Forbidden', { status: 403 });
    }

  } catch (error) {
    console.error('Webhook verification error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('WhatsApp Business API webhook received:', {
      body: body,
      timestamp: new Date().toISOString()
    });

    // Verificar que es un mensaje de WhatsApp
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      
      for (const entry of entries) {
        const changes = entry.changes || [];
        
        for (const change of changes) {
          if (change.field === 'messages') {
            const messages = change.value.messages || [];
            
            for (const message of messages) {
              if (message.type === 'text') {
                const from = message.from;
                const text = message.text.body;
                
                console.log(`Processing WhatsApp message from ${from}: ${text}`);
                
                // Procesar el mensaje con el orquestador
                const orchestrator = getOrchestrator();
                const result = await orchestrator.processMessage(text, from);
                
                if (result.success && result.data.response) {
                  // Enviar respuesta a WhatsApp
                  await sendWhatsAppMessage(
                    process.env.WHATSAPP_PHONE_NUMBER_ID || '',
                    process.env.WHATSAPP_ACCESS_TOKEN || '',
                    from,
                    result.data.response
                  );
                  
                  console.log('WhatsApp response sent successfully');
                } else {
                  console.error('Failed to process message:', result);
                  
                  // Enviar mensaje de error genérico
                  await sendWhatsAppMessage(
                    process.env.WHATSAPP_PHONE_NUMBER_ID || '',
                    process.env.WHATSAPP_ACCESS_TOKEN || '',
                    from,
                    'Lo siento, no pude procesar tu mensaje. Por favor intenta de nuevo.'
                  );
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });

  } catch (error) {
    console.error('WhatsApp webhook processing error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
