import axios, { AxiosResponse } from 'axios';
import { LLMRequest, LLMResponse, OrchestratorConfig, PromptMessage, SystemPrompt, UserPrompt } from '@/lib/types/conversational-orchestrator';

export class OpenRouterService {
  private config: OrchestratorConfig['openrouter'];
  private baseUrl: string;

  constructor(config: OrchestratorConfig['openrouter']) {
    this.config = config;
    this.baseUrl = config.baseUrl;
  }

  /**
   * Genera una respuesta usando el LLM a través de OpenRouter
   */
  async generateResponse(
    messages: PromptMessage[],
    _context?: {
      intent?: string;
      entities?: Record<string, any>;
      apiData?: any;
      conversationHistory?: Array<{role: string, message: string, timestamp: string}>;
    }
  ): Promise<string> {
    try {
      const request: LLMRequest = {
        messages: messages as any,
        model: this.config.model,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      };

      const response: AxiosResponse<LLMResponse> = await axios.post(
        `${this.baseUrl}/chat/completions`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://your-app.com', // Reemplazar con tu dominio
            'X-Title': 'Conversational Orchestrator' // Nombre de tu aplicación
          },
          timeout: 30000
        }
      );

      if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      }

      throw new Error('No response generated from LLM');
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      throw new Error(`OpenRouter API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Genera una respuesta contextual basada en datos de API
   */
  async generateContextualResponse(
    userMessage: string,
    intent: string,
    entities: Record<string, any>,
    apiData: any,
    conversationHistory: Array<{role: string, message: string, timestamp: string}> = []
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(intent, entities, apiData);
    const userPrompt = this.buildUserPrompt(userMessage, intent, entities, apiData);
    const historyPrompts = this.buildHistoryPrompts(conversationHistory);

    const messages: PromptMessage[] = [
      systemPrompt,
      ...historyPrompts,
      userPrompt
    ];

    return this.generateResponse(messages, { intent, entities, apiData, conversationHistory });
  }

  /**
   * Construye el prompt del sistema basado en la intención y datos
   */
  private buildSystemPrompt(
    intent: string,
    entities: Record<string, any>,
    apiData: any
  ): SystemPrompt {
    const basePrompt = `Eres un asistente conversacional especializado en servicios de astrología y consultas espirituales. 
    Tu objetivo es proporcionar respuestas útiles, precisas y conversacionales basadas en la información disponible.

    REGLAS IMPORTANTES:
    1. NUNCA inventes información que no esté disponible en los datos proporcionados
    2. Si no tienes información suficiente, pide aclaraciones de manera natural
    3. Mantén un tono profesional pero cálido, apropiado para WhatsApp
    4. Usa emojis de manera moderada y apropiada
    5. Responde en el idioma del usuario (español o inglés)
    6. Si la información es sensible, sé discreto pero útil

    CONTEXTO ACTUAL:
    - Intención detectada: ${intent}
    - Entidades extraídas: ${JSON.stringify(entities)}
    - Datos de API disponibles: ${JSON.stringify(apiData, null, 2)}

    INSTRUCCIONES ESPECÍFICAS:`;

    let specificInstructions = '';

    switch (intent) {
      case 'consulta_estado':
        specificInstructions = `
        El usuario está consultando el estado de algo. Usa los datos de la API para proporcionar información precisa sobre el estado actual.
        Si el estado no está claro, explica qué información necesitas para ayudar mejor.`;
        break;
      case 'agendar_cita':
        specificInstructions = `
        El usuario quiere agendar una cita. Usa la información de horarios disponibles y paquetes para ayudar con la reserva.
        Si hay conflictos o información faltante, pide aclaraciones específicas.`;
        break;
      case 'consultar_paquetes':
        specificInstructions = `
        El usuario está consultando sobre paquetes disponibles. Presenta la información de manera clara y atractiva,
        destacando beneficios y precios. Si hay descuentos o promociones, menciónalas.`;
        break;
      case 'pagar_servicio':
        specificInstructions = `
        El usuario quiere realizar un pago. Proporciona información clara sobre métodos de pago disponibles,
        montos y pasos a seguir. Sé específico sobre confirmaciones y recibos.`;
        break;
      case 'cancelar_cita':
        specificInstructions = `
        El usuario quiere cancelar una cita. Confirma los detalles de la cancelación y explica cualquier política relevante.
        Si hay opciones de reprogramación, menciónalas.`;
        break;
      default:
        specificInstructions = `
        El usuario tiene una consulta general. Proporciona una respuesta útil basada en la información disponible.
        Si necesitas más información para ayudar mejor, pide aclaraciones específicas.`;
    }

    return {
      role: 'system',
      content: basePrompt + specificInstructions
    };
  }

  /**
   * Construye el prompt del usuario
   */
  private buildUserPrompt(
    userMessage: string,
    _intent: string,
    _entities: Record<string, any>,
    _apiData: any
  ): UserPrompt {
    return {
      role: 'user',
      content: userMessage
    };
  }

  /**
   * Construye los prompts del historial de conversación
   */
  private buildHistoryPrompts(
    conversationHistory: Array<{role: string, message: string, timestamp: string}>
  ): PromptMessage[] {
    return conversationHistory
      .slice(-6) // Últimas 6 interacciones para mantener contexto
      .map(entry => ({
        role: entry.role as 'user' | 'assistant',
        content: entry.message
      }));
  }

  /**
   * Genera una respuesta de error amigable
   */
  async generateErrorResponse(
    error: string,
    userMessage: string,
    intent?: string
  ): Promise<string> {
    const messages: PromptMessage[] = [
      {
        role: 'system',
        content: `Eres un asistente que debe manejar errores de manera amigable. 
        El usuario envió: "${userMessage}"
        Hubo un error técnico: ${error}
        Intención detectada: ${intent || 'desconocida'}
        
        Responde de manera empática, explica que hay un problema técnico temporal y ofrece alternativas o sugiere intentar más tarde.`
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    return this.generateResponse(messages);
  }

  /**
   * Genera una respuesta para intenciones ambiguas
   */
  async generateClarificationResponse(
    userMessage: string,
    possibleIntents: Array<{name: string, confidence: number}>,
    entities: Record<string, any>
  ): Promise<string> {
    const messages: PromptMessage[] = [
      {
        role: 'system',
        content: `El usuario envió un mensaje que puede interpretarse de varias maneras. 
        Intenciones posibles: ${JSON.stringify(possibleIntents)}
        Entidades detectadas: ${JSON.stringify(entities)}
        
        Pide aclaración de manera natural y ofrece opciones específicas para ayudar al usuario.`
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    return this.generateResponse(messages);
  }

  /**
   * Verifica el estado de salud del servicio OpenRouter
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        timeout: 10000
      });
      return response.status === 200;
    } catch (error) {
      console.error('OpenRouter health check failed:', error);
      return false;
    }
  }
}
