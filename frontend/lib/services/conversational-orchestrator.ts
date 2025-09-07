// Dynamic import to avoid Vercel build issues
import { RasaService } from './rasa-service';
import { OpenRouterService } from './openrouter-service';
import { TwilioService } from './twilio-service';
import { APIService } from './api-service';
import { LoggingService } from './logging-service';
import {
  RasaResponse,
  ConversationContext,
  OrchestratorConfig,
  IntentActionMapping,
  OrchestratorResponse,
  ErrorResponse,
  SuccessResponse
} from '@/lib/types/conversational-orchestrator';

export class ConversationalOrchestrator {
  private rasaService: RasaService;
  private openRouterService: OpenRouterService;
  private twilioService: TwilioService;
  private apiService: APIService;
  private loggingService: LoggingService;
  private config: OrchestratorConfig;
  private intentActionMapping: IntentActionMapping;
  private conversationContexts: Map<string, ConversationContext> = new Map();

  constructor(config: OrchestratorConfig, intentActionMapping: IntentActionMapping) {
    this.config = config;
    this.intentActionMapping = intentActionMapping;
    
    this.rasaService = new RasaService(config.rasa);
    this.openRouterService = new OpenRouterService(config.openrouter.apiKey);
    this.twilioService = new TwilioService(config.twilio);
    this.apiService = new APIService(config.apis, intentActionMapping);
    this.loggingService = new LoggingService(config.logging);
  }

  /**
   * Procesa un mensaje genérico (para Telegram, web chat, etc.)
   */
  async processMessage(text: string, context: ConversationContext): Promise<OrchestratorResponse> {
    const startTime = Date.now();
    let logId: string | undefined;

    try {
      // 1. Obtener o crear contexto de conversación
      const conversationContext = this.getOrCreateConversationContext(context.userId, context.sessionId);
      
      // 2. Enviar mensaje a Rasa para detectar intención
      const rasaResponse = await this.rasaService.parseMessage(text, context.userId);
      
      if (!rasaResponse || !rasaResponse.intent) {
        return this.createErrorResponse('RASA_ERROR', 'Failed to get intent from Rasa');
      }

      // 3. Procesar la intención detectada
      const intent = rasaResponse.intent.name;
      const confidence = rasaResponse.intent.confidence;
      
      // 4. Verificar confianza mínima
      if (confidence < this.config.rasa.confidence_threshold) {
        let clarificationResponse: string;
        try {
          clarificationResponse = await this.openRouterService.generateContextualResponse(
            text,
            'low_confidence',
            {},
            null,
            []
          );
        } catch (error) {
          // Fallback response when OpenRouter is not available
          clarificationResponse = "I'm not sure I understand. Could you please rephrase your question? I'm here to help with SoulPath wellness services!";
        }
        
        return this.createSuccessResponse({
          text: clarificationResponse,
          intent: 'low_confidence',
          confidence: confidence,
          entities: rasaResponse.entities || []
        });
      }

      // 5. Ejecutar acción según la intención
      const actionMapping = this.intentActionMapping[intent];
      if (!actionMapping) {
        // Intención no mapeada, usar LLM para respuesta general
        let generalResponse: string;
        try {
          generalResponse = await this.openRouterService.generateContextualResponse(
            text,
            intent,
            rasaResponse.entities || {},
            null,
            []
          );
        } catch (error) {
          // Fallback response when OpenRouter is not available
          generalResponse = this.getFallbackResponse(intent, text);
        }
        
        return this.createSuccessResponse({
          text: generalResponse,
          intent: intent,
          confidence: confidence,
          entities: rasaResponse.entities || []
        });
      }

      // 6. Ejecutar acción específica
      let actionResult: any = null;
      if (actionMapping.apiEndpoint) {
        actionResult = await this.apiService.executeAction(actionMapping.action, rasaResponse.entities || [], context.userId);
      }

      // 7. Generar respuesta final
      let finalResponse: string;
      if (actionMapping.description) {
        finalResponse = actionMapping.description;
        if (actionResult) {
          finalResponse += `\n\n${JSON.stringify(actionResult, null, 2)}`;
        }
      } else {
        try {
          finalResponse = await this.openRouterService.generateContextualResponse(
            text,
            intent,
            rasaResponse.entities || {},
            actionResult,
            []
          );
        } catch (error) {
          // Fallback response when OpenRouter is not available
          finalResponse = this.getFallbackResponse(intent, text);
        }
      }

      // 8. Actualizar contexto de conversación
      this.updateConversationContext(conversationContext, text, finalResponse, intent, rasaResponse.entities || []);

      // 9. Log de la interacción
      if (this.config.logging.enabled) {
        logId = await this.loggingService.logConversation({
          sessionId: context.sessionId,
          userId: context.userId,
          message: text,
          userMessage: text,
          botResponse: finalResponse,
          rasaIntent: intent,
          rasaConfidence: rasaResponse.intent?.confidence || 0.5,
          rasaEntities: rasaResponse.entities || [],
          responseGenerator: actionMapping?.action || 'none',
          bookingStep: null,
          bookingDataSnapshot: null,
          modelVersion: '1.0.0',
          llmResponse: finalResponse,
          rasaResponse: JSON.stringify(rasaResponse),
          intent: intent,
          entities: rasaResponse.entities || [],
          action: actionMapping?.action || 'none',
          apiCalls: actionResult ? [actionResult] : [],
          processingTime: Date.now() - startTime,
          success: true
        });
      }

      return this.createSuccessResponse({
        text: finalResponse,
        intent: intent,
        confidence: confidence,
        entities: rasaResponse.entities || [],
        action: actionMapping.action,
        actionResult: actionResult,
        logId: logId
      });

    } catch (error) {
      console.error('Error processing message:', error);
      
      // Log del error
      if (this.config.logging.enabled) {
        await this.loggingService.logError(
          context.userId,
          error instanceof Error ? error.message : 'Unknown error',
          {
            message: text,
            intent: 'error',
            action: 'error_handling'
          }
        );
      }

      return this.createErrorResponse('PROCESSING_ERROR', 'An error occurred while processing your message');
    }
  }

  /**
   * Procesa un mensaje de WhatsApp completo
   */
  async processWhatsAppMessage(webhookBody: any, signature?: string): Promise<OrchestratorResponse> {
    const startTime = Date.now();
    let logId: string | undefined;

    try {
      // 1. Validar y parsear el webhook de WhatsApp
      const whatsappMessage = this.twilioService.parseWebhook(webhookBody);
      if (!whatsappMessage) {
        return this.createErrorResponse('INVALID_WEBHOOK', 'Invalid WhatsApp webhook data');
      }

      // Validar firma de Twilio si se proporciona
      if (signature && !this.twilioService.validateWebhook(signature, this.config.twilio.webhookUrl, webhookBody)) {
        return this.createErrorResponse('INVALID_SIGNATURE', 'Invalid Twilio signature');
      }

      const userId = whatsappMessage.from;
      const userMessage = whatsappMessage.body;

      // 2. Obtener o crear contexto de conversación
      const context = this.getOrCreateConversationContext(userId, whatsappMessage.messageId);

      // 3. Enviar confirmación de recepción
      await this.twilioService.sendDeliveryConfirmation(userId, whatsappMessage.messageId);

      // 4. Procesar el mensaje con Rasa
      const rasaResponse = await this.rasaService.parseMessage(userMessage, userId);
      
      if (!this.rasaService.isIntentConfident(rasaResponse.intent)) {
        // Intención no confiable, pedir aclaración
        const clarificationResponse = await this.handleAmbiguousIntent(
          userMessage, 
          rasaResponse, 
          context
        );
        
        await this.twilioService.sendMessage(userId, clarificationResponse);
        
        return this.createSuccessResponse({
          message: 'Clarification requested',
          response: clarificationResponse
        });
      }

      // 5. Extraer entidades
      const entities = this.extractEntities(rasaResponse.entities);
      const intent = rasaResponse.intent.name;

      // 6. Ejecutar acción correspondiente
      const apiResults = await this.apiService.executeAction(intent, entities, userId);

      // 7. Generar respuesta con LLM
      const llmResponse = await this.generateLLMResponse(
        userMessage,
        intent,
        entities,
        apiResults,
        context
      );

      // 8. Enviar respuesta final
      const sendResult = await this.twilioService.sendMessage(userId, llmResponse);

      if (!sendResult.success) {
        throw new Error(`Failed to send message: ${sendResult.error}`);
      }

      // 9. Actualizar contexto de conversación
      this.updateConversationContext(context, userMessage, llmResponse, intent, entities);

      // 10. Registrar la interacción
      const processingTime = Date.now() - startTime;
      logId = await this.loggingService.logConversation({
        sessionId: context.sessionId,
        userId,
        message: userMessage,
        userMessage: userMessage,
        botResponse: llmResponse,
        rasaIntent: intent,
        rasaConfidence: rasaResponse.intent?.confidence || 0.5,
        rasaEntities: rasaResponse.entities || [],
        responseGenerator: this.intentActionMapping[intent]?.action || 'unknown',
        bookingStep: null,
        bookingDataSnapshot: null,
        modelVersion: '1.0.0',
        llmResponse,
        rasaResponse: JSON.stringify(rasaResponse),
        intent,
        entities: rasaResponse.entities || [],
        action: this.intentActionMapping[intent]?.action || 'unknown',
        apiCalls: apiResults,
        processingTime,
        success: true
      });

      return this.createSuccessResponse({
        message: 'Message processed successfully',
        response: llmResponse,
        logId,
        processingTime
      });

    } catch (error) {
      console.error('Error processing WhatsApp message:', error);
      
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Intentar enviar mensaje de error al usuario
      try {
        const whatsappMessage = this.twilioService.parseWebhook(webhookBody);
        if (whatsappMessage) {
          await this.twilioService.sendErrorMessage(whatsappMessage.from, 'technical');
        }
      } catch (sendError) {
        console.error('Failed to send error message:', sendError);
      }

      // Registrar el error
      try {
        const whatsappMessage = this.twilioService.parseWebhook(webhookBody);
        if (whatsappMessage) {
          logId = await this.loggingService.logError(whatsappMessage.from, errorMessage, {
            message: whatsappMessage.body
          });
        }
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }

      return this.createErrorResponse('PROCESSING_ERROR', errorMessage, { logId, processingTime });
    }
  }

  /**
   * Maneja intenciones ambiguas o de baja confianza
   */
  private async handleAmbiguousIntent(
    userMessage: string,
    rasaResponse: RasaResponse,
    _context: ConversationContext
  ): Promise<string> {
    const alternativeIntents = this.rasaService.getAlternativeIntents(rasaResponse);
    
    return await this.openRouterService.generateClarificationResponse(
      userMessage,
      alternativeIntents,
      this.extractEntities(rasaResponse.entities)
    );
  }

  /**
   * Genera respuesta usando LLM con contexto completo
   */
  private async generateLLMResponse(
    userMessage: string,
    intent: string,
    entities: Record<string, any>,
    apiResults: any[],
    context: ConversationContext
  ): Promise<string> {
    try {
      // Combinar datos de todas las llamadas a API exitosas
      const apiData = apiResults
        .filter(result => result.success)
        .map(result => result.data)
        .reduce((acc, data) => ({ ...acc, ...data }), {});

      return await this.openRouterService.generateContextualResponse(
        userMessage,
        intent,
        entities,
        apiData,
        context.conversationHistory
      );
    } catch (error) {
      console.error('Error generating LLM response:', error);
      return await this.openRouterService.generateErrorResponse(
        error instanceof Error ? error.message : 'Unknown error',
        userMessage,
        intent
      );
    }
  }

  /**
   * Extrae entidades de la respuesta de Rasa
   */
  private extractEntities(entities: RasaResponse['entities']): Record<string, any> {
    const extracted: Record<string, any> = {};
    
    entities.forEach(entity => {
      if (entity.confidence >= 0.7) {
        extracted[entity.entity] = entity.value;
      }
    });

    return extracted;
  }

  /**
   * Obtiene o crea el contexto de conversación
   */
  private getOrCreateConversationContext(userId: string, sessionId: string): ConversationContext {
    if (!this.conversationContexts.has(userId)) {
      this.conversationContexts.set(userId, {
        userId,
        sessionId,
        conversationHistory: []
      });
    }

    return this.conversationContexts.get(userId)!;
  }

  /**
   * Actualiza el contexto de conversación
   */
  private updateConversationContext(
    context: ConversationContext,
    userMessage: string,
    assistantResponse: string,
    intent: string,
    entities: Record<string, any>
  ): void {
    // Agregar mensaje del usuario
    context.conversationHistory.push({
      role: 'user',
      message: userMessage,
      timestamp: new Date().toISOString()
    });

    // Agregar respuesta del asistente
    context.conversationHistory.push({
      role: 'assistant',
      message: assistantResponse,
      timestamp: new Date().toISOString()
    });

    // Actualizar último intent y entidades
    context.lastIntent = intent;
    context.lastEntities = entities;

    // Mantener solo los últimos 20 mensajes para evitar que el contexto crezca demasiado
    if (context.conversationHistory.length > 20) {
      context.conversationHistory = context.conversationHistory.slice(-20);
    }
  }

  /**
   * Crea una respuesta de error
   */
  private createErrorResponse(code: string, message: string, details?: any): ErrorResponse {
    return {
      success: false,
      error: message,
      code,
      details
    };
  }

  /**
   * Crea una respuesta exitosa
   */
  private createSuccessResponse(data: any): SuccessResponse {
    return {
      success: true,
      data
    };
  }

  /**
   * Provides fallback responses when OpenRouter is not available
   */
  private getFallbackResponse(intent: string, _text: string): string {
    const fallbackResponses: Record<string, string> = {
      'greet': '¡Hola! ¿En qué puedo ayudarte?',
      'goodbye': '¡Hasta luego! 🌟',
      'book_session': 'Para reservar una sesión, contacta con nosotros. ¿Te interesa algún paquete?',
      'ask_packages': 'Tenemos varios paquetes. ¿Cuál te interesa?',
      'ask_pricing': 'Los precios varían. ¿Qué servicio necesitas?',
      'ask_availability': '¿Cuál es tu horario preferido?',
      'thank_you': '¡De nada! 😊',
      'default': '¿En qué puedo ayudarte?'
    };

    return fallbackResponses[intent] || fallbackResponses['default'];
  }

  /**
   * Verifica el estado de salud de todos los servicios
   */
  async healthCheck(): Promise<{
    overall: boolean;
    services: {
      rasa: boolean;
      openrouter: boolean;
      twilio: boolean;
      api: boolean;
      logging: boolean;
    };
  }> {
    const [rasa, openrouter, twilio, api] = await Promise.all([
      this.rasaService.healthCheck(),
      this.openRouterService.healthCheck(),
      this.twilioService.healthCheck(),
      this.apiService.healthCheck()
    ]);

    const logging = this.config.logging.enabled;

    return {
      overall: rasa && openrouter && twilio && api && logging,
      services: {
        rasa,
        openrouter,
        twilio,
        api,
        logging
      }
    };
  }

  /**
   * Obtiene estadísticas de conversación
   */
  async getConversationStats(userId?: string, dateFrom?: string, dateTo?: string) {
    return this.loggingService.getConversationStats(userId, dateFrom, dateTo);
  }

  /**
   * Obtiene logs de conversación
   */
  async getConversationLogs(userId: string, limit?: number, offset?: number) {
    return this.loggingService.getConversationLogs(userId, limit, offset);
  }

  /**
   * Limpia logs antiguos
   */
  async cleanOldLogs(daysToKeep?: number) {
    return this.loggingService.cleanOldLogs(daysToKeep);
  }

  /**
   * Cierra todas las conexiones
   */
  async close(): Promise<void> {
    await this.loggingService.close();
  }
}
