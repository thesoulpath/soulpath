import { prisma } from './prisma';
import { CommunicationTemplateService } from './communication/template-service';

export interface LabsMobileConfig {
  username: string;
  tokenApi: string;
  senderName?: string;
}

export interface LabsMobileResponse {
  subid?: string;
  code: string;
  message: string;
}

export interface LabsMobileBalanceResponse {
  code: number;
  credits: string;
}

export interface LabsMobilePricesResponse {
  [countryCode: string]: {
    isocode: string;
    prefix: string;
    name: string;
    credits: number;
  };
}

export class LabsMobileSmsService {
  private config: LabsMobileConfig | null = null;
  private baseUrl = 'https://api.labsmobile.com/json';

  constructor() {
    this.loadConfig();
  }

  private async loadConfig() {
    try {
      // Try to load from communication_config table first (unified communication settings)
      const commConfig = await prisma.communicationConfig.findFirst({
        where: { sms_enabled: true }
      });

      if (commConfig && commConfig.labsmobile_username && commConfig.labsmobile_token) {
        this.config = {
          username: commConfig.labsmobile_username,
          tokenApi: commConfig.labsmobile_token,
          senderName: commConfig.sms_sender_name || undefined
        };
        return;
      }

      // Fallback to separate SMS configuration table
      const smsConfig = await prisma.smsConfiguration.findFirst({
        where: { isActive: true, provider: 'labsmobile' }
      });

      if (smsConfig) {
        this.config = {
          username: smsConfig.username,
          tokenApi: smsConfig.tokenApi,
          senderName: smsConfig.senderName || undefined
        };
      }
    } catch (error) {
      console.error('Failed to load SMS configuration:', error);
    }
  }

  private getAuthHeader(): string {
    if (!this.config) {
      throw new Error('SMS configuration not found');
    }
    return Buffer.from(`${this.config.username}:${this.config.tokenApi}`).toString('base64');
  }

  private async makeRequest<T>(endpoint: string, method: 'GET' | 'POST', body?: any): Promise<T> {
    if (!this.config) {
      throw new Error('SMS configuration not found');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Basic ${this.getAuthHeader()}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('LabsMobile API request failed:', error);
      throw error;
    }
  }

  /**
   * Send SMS message
   */
  async sendSms(phoneNumber: string, message: string): Promise<LabsMobileResponse> {
    const body = {
      message,
      tpoa: this.config?.senderName || 'SoulPath',
      recipient: [
        {
          msisdn: phoneNumber
        }
      ]
    };

    return this.makeRequest<LabsMobileResponse>('/send', 'POST', body);
  }

  /**
   * Send OTP SMS using template
   */
  async sendOtpSms(phoneNumber: string, otpCode: string, language: string = 'en'): Promise<LabsMobileResponse> {
    try {
      // Try to get template first
      const template = await CommunicationTemplateService.getTemplate('otp_verification', language, {
        otpCode,
        expiryTime: '10 minutes'
      });

      if (template) {
        return this.sendSms(phoneNumber, template.content);
      }

      // Fallback to default message if template not found
      const defaultMessage = language === 'es' 
        ? `Su código de verificación de SoulPath es: ${otpCode}. Este código expira en 10 minutos.`
        : `Your SoulPath verification code is: ${otpCode}. This code expires in 10 minutes.`;
      
      return this.sendSms(phoneNumber, defaultMessage);
    } catch (error) {
      console.error('Error sending OTP SMS with template:', error);
      // Fallback to default message
      const defaultMessage = `Your SoulPath verification code is: ${otpCode}. This code expires in 10 minutes.`;
      return this.sendSms(phoneNumber, defaultMessage);
    }
  }

  /**
   * Send SMS using template name
   */
  async sendSmsWithTemplate(
    phoneNumber: string, 
    templateName: string, 
    data: Record<string, any> = {}, 
    language: string = 'en'
  ): Promise<LabsMobileResponse> {
    try {
      const template = await CommunicationTemplateService.getTemplateByName(
        templateName, 
        'sms', 
        language, 
        data
      );

      if (template) {
        return this.sendSms(phoneNumber, template.content);
      }

      throw new Error(`Template not found: ${templateName}`);
    } catch (error) {
      console.error('Error sending SMS with template:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<LabsMobileBalanceResponse> {
    return this.makeRequest<LabsMobileBalanceResponse>('/balance', 'GET');
  }

  /**
   * Get SMS prices for specific countries
   */
  async getPrices(_countries: string[] = ['ES', 'CO', 'US', 'MX']): Promise<LabsMobilePricesResponse> {
    return this.makeRequest<LabsMobilePricesResponse>('/prices', 'GET');
  }

  /**
   * Send scheduled SMS
   */
  async sendScheduledSms(subid: string, command: 'send' | 'cancel' = 'send'): Promise<LabsMobileResponse> {
    const body = {
      cmd: command,
      subid
    };

    return this.makeRequest<LabsMobileResponse>('/scheduled', 'POST', body);
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phoneNumber: string, countryCode: string): boolean {
    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // More flexible validation for local phone numbers
    const localValidations: Record<string, RegExp> = {
      'US': /^\d{10}$/, // 10 digits for US (5551234567)
      'CO': /^\d{10}$/, // 10 digits for Colombia (3001234567)
      'MX': /^\d{10}$/, // 10 digits for Mexico (5512345678)
      'ES': /^\d{9}$/,  // 9 digits for Spain (612345678)
      'CA': /^\d{10}$/, // 10 digits for Canada (5551234567)
      'BR': /^\d{10,11}$/, // 10-11 digits for Brazil (11987654321)
      'AR': /^\d{10,11}$/, // 10-11 digits for Argentina (91123456789)
      'CL': /^\d{8,9}$/,  // 8-9 digits for Chile (912345678)
      'PE': /^\d{7,9}$/,  // 7-9 digits for Peru (flexible: 1234567, 12345678, 912345678)
    };

    const validation = localValidations[countryCode];
    if (!validation) {
      // Default validation: 7-15 digits for unknown countries
      return /^\d{7,15}$/.test(cleanNumber);
    }

    const isValid = validation.test(cleanNumber);
    
    // Debug logging
    console.log(`Phone validation for ${countryCode}: "${cleanNumber}" (${cleanNumber.length} digits) - ${isValid ? 'VALID' : 'INVALID'}`);
    
    return isValid;
  }

  /**
   * Format phone number for LabsMobile API
   */
  static formatPhoneNumber(phoneNumber: string, countryCode: string): string {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    const countryPrefixes: Record<string, string> = {
      'US': '1',
      'CO': '57',
      'MX': '52',
      'ES': '34',
      'CA': '1',
      'BR': '55',
      'AR': '54',
      'CL': '56',
      'PE': '51',
    };

    const prefix = countryPrefixes[countryCode];
    if (prefix && !cleanNumber.startsWith(prefix)) {
      return prefix + cleanNumber;
    }

    return cleanNumber;
  }

  /**
   * Generate random OTP code
   */
  static generateOtpCode(length: number = 6): string {
    const digits = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return result;
  }
}

// Export singleton instance
export const labsMobileSmsService = new LabsMobileSmsService();
