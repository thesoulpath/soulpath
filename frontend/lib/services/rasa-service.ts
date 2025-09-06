import axios, { AxiosResponse } from 'axios';
import { RasaResponse, RasaAction, OrchestratorConfig } from '@/lib/types/conversational-orchestrator';

export class RasaService {
  private config: OrchestratorConfig['rasa'];
  private baseUrl: string;

  constructor(config: OrchestratorConfig['rasa']) {
    this.config = config;
    this.baseUrl = config.url;
  }

  /**
   * Envía un mensaje a Rasa para obtener intención y entidades
   */
  async parseMessage(message: string, _senderId: string): Promise<RasaResponse> {
    try {
      const response: AxiosResponse<RasaResponse> = await axios.post(
        `${this.baseUrl}/model/parse`,
        {
          text: message
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error calling Rasa API:', error);
      throw new Error(`Rasa API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Obtiene la acción recomendada por Rasa
   */
  async getAction(message: string, senderId: string): Promise<RasaAction> {
    try {
      const response: AxiosResponse<RasaAction> = await axios.post(
        `${this.baseUrl}/conversations/${senderId}/execute`,
        {
          query: message
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting Rasa action:', error);
      throw new Error(`Rasa action error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verifica si la confianza de la intención es suficiente
   */
  isIntentConfident(intent: RasaResponse['intent']): boolean {
    return intent && intent.confidence >= this.config.confidence_threshold;
  }

  /**
   * Obtiene la entidad más confiable de un tipo específico
   */
  getEntityByType(entities: RasaResponse['entities'], entityType: string): string | null {
    const entity = entities.find(e => e.entity === entityType);
    return entity && entity.confidence >= 0.7 ? entity.value : null;
  }

  /**
   * Obtiene todas las entidades de un tipo específico
   */
  getEntitiesByType(entities: RasaResponse['entities'], entityType: string): Array<{value: string, confidence: number}> {
    return entities
      .filter(e => e.entity === entityType)
      .map(e => ({ value: e.value, confidence: e.confidence }));
  }

  /**
   * Valida si las entidades requeridas están presentes
   */
  validateRequiredEntities(entities: RasaResponse['entities'], requiredEntities: string[]): {
    isValid: boolean;
    missing: string[];
  } {
    const foundEntities = entities.map(e => e.entity);
    const missing = requiredEntities.filter(req => !foundEntities.includes(req));
    
    return {
      isValid: missing.length === 0,
      missing
    };
  }

  /**
   * Obtiene el ranking de intenciones alternativas
   */
  getAlternativeIntents(rasaResponse: RasaResponse): Array<{name: string, confidence: number}> {
    if (!rasaResponse.intent_ranking) {
      return [];
    }
    
    return rasaResponse.intent_ranking
      .filter(intent => intent.name !== rasaResponse.intent.name)
      .slice(0, 3); // Top 3 alternativas
  }

  /**
   * Verifica el estado de salud del servicio Rasa
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('Rasa health check failed:', error);
      return false;
    }
  }
}
