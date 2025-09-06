import twilio from 'twilio';
import { WhatsAppMessage, OrchestratorConfig } from '@/lib/types/conversational-orchestrator';

export class TwilioService {
  private client: twilio.Twilio;
  private config: OrchestratorConfig['twilio'];
  private phoneNumber: string;

  constructor(config: OrchestratorConfig['twilio']) {
    this.config = config;
    this.phoneNumber = config.phoneNumber;
    
    // Only initialize Twilio if credentials are available
    if (config.accountSid && config.authToken) {
      this.client = twilio(config.accountSid, config.authToken);
    } else {
      console.warn('Twilio credentials not configured, WhatsApp messaging disabled');
      this.client = null as any;
    }
  }

  /**
   * Envía un mensaje de texto a WhatsApp
   */
  async sendMessage(to: string, message: string): Promise<{success: boolean, messageId?: string, error?: string}> {
    try {
      if (!this.client) {
        return {
          success: false,
          error: 'Twilio not configured'
        };
      }

      const response = await this.client.messages.create({
        body: message,
        from: `whatsapp:${this.phoneNumber}`,
        to: `whatsapp:${to}`
      });

      return {
        success: true,
        messageId: response.sid
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Envía un mensaje con media (imagen, documento, etc.)
   */
  async sendMediaMessage(
    to: string, 
    message: string, 
    mediaUrl: string, 
    _mediaType: 'image' | 'document' | 'audio' | 'video' = 'image'
  ): Promise<{success: boolean, messageId?: string, error?: string}> {
    try {
      const response = await this.client.messages.create({
        body: message,
        from: `whatsapp:${this.phoneNumber}`,
        to: `whatsapp:${to}`,
        mediaUrl: [mediaUrl]
      });

      return {
        success: true,
        messageId: response.sid
      };
    } catch (error) {
      console.error('Error sending WhatsApp media message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Procesa un webhook de WhatsApp y extrae el mensaje
   */
  parseWebhook(body: any): WhatsAppMessage | null {
    try {
      // Twilio envía los datos del webhook en el body
      const message = body.Body;
      const from = body.From;
      const to = body.To;
      const messageId = body.MessageSid;
      const timestamp = body.Timestamp;
      const profileName = body.ProfileName;

      if (!message || !from || !to || !messageId) {
        console.error('Missing required fields in webhook:', body);
        return null;
      }

      return {
        from: from.replace('whatsapp:', ''),
        to: to.replace('whatsapp:', ''),
        body: message,
        messageId,
        timestamp,
        profileName
      };
    } catch (error) {
      console.error('Error parsing WhatsApp webhook:', error);
      return null;
    }
  }

  /**
   * Valida que el webhook proviene de Twilio
   */
  validateWebhook(signature: string, url: string, params: any): boolean {
    try {
      return twilio.validateRequest(this.config.authToken, signature, url, params);
    } catch (error) {
      console.error('Error validating Twilio webhook:', error);
      return false;
    }
  }

  /**
   * Envía un mensaje de confirmación de recepción
   */
  async sendDeliveryConfirmation(to: string, _originalMessageId: string): Promise<void> {
    try {
      await this.sendMessage(to, '✅ Mensaje recibido. Te ayudo en un momento...');
    } catch (error) {
      console.error('Error sending delivery confirmation:', error);
    }
  }

  /**
   * Envía un mensaje de error genérico
   */
  async sendErrorMessage(to: string, errorType: 'technical' | 'validation' | 'timeout' = 'technical'): Promise<void> {
    const errorMessages = {
      technical: '⚠️ Disculpa, hay un problema técnico temporal. Por favor intenta de nuevo en unos minutos.',
      validation: '❓ No pude entender tu mensaje. ¿Podrías ser más específico?',
      timeout: '⏰ La consulta está tomando más tiempo del esperado. Te responderé pronto.'
    };

    try {
      await this.sendMessage(to, errorMessages[errorType]);
    } catch (error) {
      console.error('Error sending error message:', error);
    }
  }

  /**
   * Envía un mensaje de bienvenida
   */
  async sendWelcomeMessage(to: string, userName?: string): Promise<void> {
    const welcomeMessage = `🌟 ¡Hola${userName ? ` ${userName}` : ''}! 

Bienvenido a nuestro servicio de consultas astrológicas. Estoy aquí para ayudarte con:

• 📅 Agendar citas
• 📦 Consultar paquetes disponibles  
• 💳 Información de pagos
• 📊 Estado de tus solicitudes
• ❓ Cualquier consulta

¿En qué puedo ayudarte hoy?`;

    try {
      await this.sendMessage(to, welcomeMessage);
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  }

  /**
   * Envía un mensaje de despedida
   */
  async sendGoodbyeMessage(to: string): Promise<void> {
    const goodbyeMessage = `👋 ¡Gracias por contactarnos! 

Si tienes más preguntas, no dudes en escribirnos. 

¡Que tengas un excelente día! ✨`;

    try {
      await this.sendMessage(to, goodbyeMessage);
    } catch (error) {
      console.error('Error sending goodbye message:', error);
    }
  }

  /**
   * Obtiene información de un mensaje específico
   */
  async getMessageInfo(messageId: string): Promise<any> {
    try {
      const message = await this.client.messages(messageId).fetch();
      return {
        sid: message.sid,
        status: message.status,
        direction: message.direction,
        from: message.from,
        to: message.to,
        body: message.body,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error) {
      console.error('Error fetching message info:', error);
      throw error;
    }
  }

  /**
   * Verifica el estado de salud del servicio Twilio
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Verificar que podemos hacer una llamada básica a la API
      await this.client.api.accounts(this.config.accountSid).fetch();
      return true;
    } catch (error) {
      console.error('Twilio health check failed:', error);
      return false;
    }
  }

  /**
   * Formatea un número de teléfono para WhatsApp
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remover caracteres no numéricos
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Si no tiene código de país, asumir +1 (US/Canada)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // Si ya tiene código de país
    if (cleaned.length > 10) {
      return `+${cleaned}`;
    }
    
    // Si es muy corto, devolver como está
    return phoneNumber;
  }

  /**
   * Valida si un número de teléfono es válido para WhatsApp
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
}
