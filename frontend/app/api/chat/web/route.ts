import { NextRequest, NextResponse } from 'next/server';
import { ConversationalOrchestrator } from '@/lib/services/conversational-orchestrator';
import { OrchestratorConfig, IntentActionMapping } from '@/lib/types/conversational-orchestrator';

// Configuración del orquestador (igual que para WhatsApp)
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
    enabled: process.env.LOGGING_ENABLED === 'true',
    level: (process.env.LOGGING_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    storage: (process.env.LOGGING_STORAGE as 'database' | 'file' | 'console') || 'console'
  },
  apis: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
    timeout: parseInt(process.env.API_TIMEOUT || '10000'),
    retries: parseInt(process.env.API_RETRIES || '3')
  }
};

// Mapeo de intenciones a acciones (igual que para WhatsApp)
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

// Instancia del orquestador (singleton para chat web)
let webOrchestrator: ConversationalOrchestrator | null = null;

function getWebOrchestrator(): ConversationalOrchestrator {
  if (!webOrchestrator) {
    webOrchestrator = new ConversationalOrchestrator(orchestratorConfig, intentActionMapping);
  }
  return webOrchestrator;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, language = 'es', timestamp } = body;

    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    console.log('🌐 Web chat message received:', {
      userId,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      language,
      timestamp
    });

    const orchestrator = getWebOrchestrator();

    // Procesar el mensaje con el orquestador
    // Para el chat web, simulamos un mensaje de WhatsApp
    const mockWebhook = {
      Body: message,
      From: `web:${userId}`,
      To: `web:assistant`,
      MessageSid: `web_${Date.now()}`,
      Timestamp: timestamp || new Date().toISOString(),
      ProfileName: 'Web User',
      // Agregamos información adicional para el contexto web
      Language: language,
      Channel: 'web',
      UserAgent: request.headers.get('user-agent') || 'unknown'
    };

    const result = await orchestrator.processWhatsAppMessage(mockWebhook);

    if (result.success) {
      console.log('✅ Web chat message processed successfully:', {
        logId: result.data.logId,
        processingTime: result.data.processingTime,
        responseLength: result.data.response?.length || 0
      });

      return NextResponse.json({
        success: true,
        data: {
          response: result.data.response,
          logId: result.data.logId,
          processingTime: result.data.processingTime,
          timestamp: new Date().toISOString(),
          language
        }
      });
    } else {
      console.error('❌ Web chat message processing failed:', result);

      // Return a user-friendly error message
      const errorResponse = language === 'es'
        ? 'Lo siento, hubo un problema al procesar tu mensaje. Por favor intenta de nuevo en unos momentos.'
        : 'Sorry, there was a problem processing your message. Please try again in a moment.';

      return NextResponse.json({
        success: false,
        error: result.error || 'Processing failed',
        data: {
          response: errorResponse,
          timestamp: new Date().toISOString(),
          language
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Web chat API error:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const orchestrator = getWebOrchestrator();

    switch (action) {
      case 'health':
        const healthCheck = await orchestrator.healthCheck();
        return NextResponse.json({
          success: true,
          data: {
            ...healthCheck,
            channel: 'web',
            timestamp: new Date().toISOString()
          }
        });

      case 'config':
        return NextResponse.json({
          success: true,
          data: {
            config: {
              rasa: {
                url: orchestratorConfig.rasa.url,
                confidence_threshold: orchestratorConfig.rasa.confidence_threshold
              },
              openrouter: {
                baseUrl: orchestratorConfig.openrouter.baseUrl,
                model: orchestratorConfig.openrouter.model,
                temperature: orchestratorConfig.openrouter.temperature
              },
              logging: {
                enabled: orchestratorConfig.logging.enabled,
                level: orchestratorConfig.logging.level,
                storage: orchestratorConfig.logging.storage
              },
              channel: 'web'
            },
            supportedIntents: Object.keys(intentActionMapping),
            timestamp: new Date().toISOString()
          }
        });

      case 'examples':
        const examples = {
          es: [
            'Hola, ¿cómo estás?',
            '¿Qué paquetes tienen disponibles?',
            'Quiero agendar una cita para mañana a las 3pm',
            '¿Cuál es el estado de mi solicitud 12345?',
            'Quiero pagar $50 por mi paquete con tarjeta de crédito',
            '¿Qué horarios tienen disponibles para esta semana?',
            'Necesito cancelar mi cita del viernes',
            '¿Cómo funciona el sistema de citas?'
          ],
          en: [
            'Hello, how are you?',
            'What packages do you have available?',
            'I want to schedule an appointment for tomorrow at 3pm',
            'What is the status of my request 12345?',
            'I want to pay $50 for my package with credit card',
            'What schedules are available for this week?',
            'I need to cancel my Friday appointment',
            'How does the appointment system work?'
          ]
        };

        return NextResponse.json({
          success: true,
          data: {
            examples,
            intents: Object.keys(intentActionMapping).map(intent => ({
              name: intent,
              description: intentActionMapping[intent].description,
              requiredEntities: intentActionMapping[intent].requiredEntities,
              optionalEntities: intentActionMapping[intent].optionalEntities
            })),
            timestamp: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json({
          success: true,
          message: 'Web Chat API',
          availableActions: ['health', 'config', 'examples'],
          usage: {
            POST: 'Send {message, userId, language?, timestamp?} to process a message',
            GET: 'Use ?action=health|config|examples for information'
          },
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('❌ Web chat GET API error:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
