import { NextRequest, NextResponse } from 'next/server';
import { ConversationalOrchestrator } from '@/lib/services/conversational-orchestrator';
import { OrchestratorConfig, IntentActionMapping } from '@/lib/types/conversational-orchestrator';

// Configuración del orquestador (misma que en webhook)
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
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
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

// Instancia del orquestador (singleton)
let orchestrator: ConversationalOrchestrator | null = null;

function getOrchestrator(): ConversationalOrchestrator {
  if (!orchestrator) {
    orchestrator = new ConversationalOrchestrator(orchestratorConfig, intentActionMapping);
  }
  return orchestrator;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const orchestrator = getOrchestrator();

    switch (action) {
      case 'health':
        const healthCheck = await orchestrator.healthCheck();
        return NextResponse.json({
          success: true,
          data: healthCheck,
          timestamp: new Date().toISOString()
        });

      case 'stats':
        const userId = searchParams.get('userId');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        
        const stats = await orchestrator.getConversationStats(
          userId || undefined,
          dateFrom || undefined,
          dateTo || undefined
        );
        
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });

      case 'logs':
        const logUserId = searchParams.get('userId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        
        if (!logUserId) {
          return NextResponse.json({
            success: false,
            error: 'userId is required for logs action'
          }, { status: 400 });
        }
        
        const logs = await orchestrator.getConversationLogs(logUserId, limit, offset);
        
        return NextResponse.json({
          success: true,
          data: logs,
          pagination: {
            limit,
            offset,
            total: logs.length
          },
          timestamp: new Date().toISOString()
        });

      case 'config':
        return NextResponse.json({
          success: true,
          data: {
            config: orchestratorConfig,
            intentActionMapping
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: true,
          message: 'Conversational Orchestrator API',
          availableActions: ['health', 'stats', 'logs', 'config'],
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('Orchestrator API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const orchestrator = getOrchestrator();

    switch (action) {
      case 'clean-logs':
        const daysToKeep = data?.daysToKeep || 30;
        const cleanedCount = await orchestrator.cleanOldLogs(daysToKeep);
        
        return NextResponse.json({
          success: true,
          data: {
            cleanedCount,
            daysToKeep
          },
          message: `Cleaned ${cleanedCount} old log entries`
        });

      case 'test-message':
        const { message, userId } = data;
        
        if (!message || !userId) {
          return NextResponse.json({
            success: false,
            error: 'message and userId are required for test-message action'
          }, { status: 400 });
        }

        // Simular un webhook de WhatsApp para testing
        const mockWebhook = {
          Body: message,
          From: `whatsapp:${userId}`,
          To: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          MessageSid: `test_${Date.now()}`,
          Timestamp: new Date().toISOString(),
          ProfileName: 'Test User'
        };

        const result = await orchestrator.processWhatsAppMessage(mockWebhook);
        
        return NextResponse.json({
          success: true,
          data: result,
          message: 'Test message processed'
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          availableActions: ['clean-logs', 'test-message']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Orchestrator POST API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
