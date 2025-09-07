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

// Instancia del orquestador
let orchestrator: ConversationalOrchestrator | null = null;

function getOrchestrator(): ConversationalOrchestrator {
  if (!orchestrator) {
    orchestrator = new ConversationalOrchestrator(orchestratorConfig, intentActionMapping);
  }
  return orchestrator;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, testType } = body;

    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }

    const testUserId = userId || `test_${Date.now()}`;
    const orchestrator = getOrchestrator();

    // Simular un webhook de WhatsApp
    const mockWebhook = {
      Body: message,
      From: `whatsapp:${testUserId}`,
      To: `whatsapp:${process.env.TWILIO_PHONE_NUMBER || '+1234567890'}`,
      MessageSid: `test_${Date.now()}`,
      Timestamp: new Date().toISOString(),
      ProfileName: 'Test User'
    };

    const startTime = Date.now();
    const result = await orchestrator.processWhatsAppMessage(mockWebhook);
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        processingTime,
        testType: testType || 'full',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Test orchestrator error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      code: 'TEST_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'health';

    const orchestrator = getOrchestrator();

    switch (testType) {
      case 'health':
        const healthCheck = await orchestrator.healthCheck();
        return NextResponse.json({
          success: true,
          data: {
            health: healthCheck,
            config: {
              rasa: {
                url: orchestratorConfig.rasa.url,
                confidence_threshold: orchestratorConfig.rasa.confidence_threshold
              },
              openrouter: {
                baseUrl: orchestratorConfig.openrouter.baseUrl,
                model: orchestratorConfig.openrouter.model
              },
              twilio: {
                phoneNumber: orchestratorConfig.twilio.phoneNumber
              },
              logging: {
                enabled: orchestratorConfig.logging.enabled,
                level: orchestratorConfig.logging.level,
                storage: orchestratorConfig.logging.storage
              }
            }
          },
          timestamp: new Date().toISOString()
        });

      case 'examples':
        return NextResponse.json({
          success: true,
          data: {
            testMessages: [
              {
                intent: 'saludo',
                message: 'Hola, ¿cómo estás?',
                description: 'Mensaje de saludo básico'
              },
              {
                intent: 'consultar_paquetes',
                message: '¿Qué paquetes tienen disponibles?',
                description: 'Consulta de paquetes'
              },
              {
                intent: 'agendar_cita',
                message: 'Quiero agendar una cita para mañana a las 3pm',
                description: 'Agendar cita con fecha y hora'
              },
              {
                intent: 'consulta_estado',
                message: '¿Cuál es el estado de mi solicitud 12345?',
                description: 'Consulta de estado con ID'
              },
              {
                intent: 'pagar_servicio',
                message: 'Quiero pagar $50 por mi paquete con tarjeta de crédito',
                description: 'Pago con método específico'
              },
              {
                intent: 'consultar_horarios',
                message: '¿Qué horarios tienen disponibles para esta semana?',
                description: 'Consulta de horarios disponibles'
              },
              {
                intent: 'cancelar_cita',
                message: 'Necesito cancelar mi cita del viernes',
                description: 'Cancelación de cita'
              },
              {
                intent: 'ayuda',
                message: '¿Cómo funciona el sistema de citas?',
                description: 'Solicitud de ayuda'
              }
            ],
            intents: Object.keys(intentActionMapping),
            entities: [
              'solicitud_id', 'cita_id', 'email', 'fecha', 'hora', 'tipo_sesion',
              'paquete_id', 'monto', 'método_pago', 'moneda', 'nombre', 'teléfono',
              'fecha_nacimiento', 'lugar_nacimiento', 'tamaño_grupo', 'notas'
            ]
          },
          timestamp: new Date().toISOString()
        });

      case 'stats':
        const stats = await orchestrator.getConversationStats();
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: true,
          message: 'Orchestrator Test API',
          availableTests: ['health', 'examples', 'stats'],
          usage: {
            GET: 'Use ?type=health|examples|stats',
            POST: 'Send {message, userId?, testType?} to test message processing'
          },
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('Test API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test API error',
      code: 'TEST_API_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
