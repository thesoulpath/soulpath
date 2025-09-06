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
    this.openRouterService = new OpenRouterService(config.openrouter);
    this.twilioService = new TwilioService(config.twilio);
    this.apiService = new APIService(config.apis, intentActionMapping);
    this.loggingService = new LoggingService(config.logging);
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
        userId,
        message: userMessage,
        intent,
        entities: rasaResponse.entities,
        action: this.intentActionMapping[intent]?.action || 'unknown',
        rasaResponse: JSON.stringify(rasaResponse),
        llmResponse,
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
