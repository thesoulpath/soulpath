import { PrismaClient } from '@prisma/client';
import { replacePlaceholders } from './placeholders';

const prisma = new PrismaClient();

export interface TemplateData {
  [key: string]: any;
}

export interface TemplateResult {
  subject?: string;
  content: string;
}

export class CommunicationTemplateService {
  /**
   * Get template by key and language
   */
  static async getTemplate(
    templateKey: string, 
    language: string = 'en', 
    data: TemplateData = {}
  ): Promise<TemplateResult | null> {
    try {
      const template = await prisma.communicationTemplate.findFirst({
        where: {
          templateKey,
          isActive: true
        },
        include: {
          translations: {
            where: {
              language
            }
          }
        }
      });

      if (!template || !template.translations.length) {
        console.warn(`Template not found: ${templateKey} (${language})`);
        return null;
      }

      const translation = template.translations[0];
      const processedContent = replacePlaceholders(translation.content, data);
      const processedSubject = translation.subject ? replacePlaceholders(translation.subject, data) : undefined;

      return {
        subject: processedSubject,
        content: processedContent
      };
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  /**
   * Get template by name (alternative to templateKey)
   */
  static async getTemplateByName(
    templateName: string, 
    type: 'email' | 'sms',
    language: string = 'en', 
    data: TemplateData = {}
  ): Promise<TemplateResult | null> {
    try {
      const template = await prisma.communicationTemplate.findFirst({
        where: {
          name: templateName,
          type,
          isActive: true
        },
        include: {
          translations: {
            where: {
              language
            }
          }
        }
      });

      if (!template || !template.translations.length) {
        console.warn(`Template not found by name: ${templateName} (${type}, ${language})`);
        return null;
      }

      const translation = template.translations[0];
      const processedContent = replacePlaceholders(translation.content, data);
      const processedSubject = translation.subject ? replacePlaceholders(translation.subject, data) : undefined;

      return {
        subject: processedSubject,
        content: processedContent
      };
    } catch (error) {
      console.error('Error fetching template by name:', error);
      return null;
    }
  }

  /**
   * Get all templates by type and category
   */
  static async getTemplatesByType(
    type: 'email' | 'sms',
    category?: string,
    language: string = 'en'
  ) {
    try {
      const templates = await prisma.communicationTemplate.findMany({
        where: {
          type,
          isActive: true,
          ...(category && { category })
        },
        include: {
          translations: {
            where: {
              language
            }
          }
        }
      });

      return templates.map(template => ({
        id: template.id,
        templateKey: template.templateKey,
        name: template.name,
        description: template.description,
        category: template.category,
        isDefault: template.isDefault,
        translation: template.translations[0] || null
      }));
    } catch (error) {
      console.error('Error fetching templates by type:', error);
      return [];
    }
  }

  /**
   * Get default template for a specific use case
   */
  static async getDefaultTemplate(
    useCase: 'otp_verification' | 'booking_confirmation' | 'booking_reminder' | 'booking_cancellation',
    type: 'email' | 'sms',
    language: string = 'en',
    data: TemplateData = {}
  ): Promise<TemplateResult | null> {
    // Map use cases to template keys
    const templateKeyMap: Record<string, string> = {
      'otp_verification': 'otp_verification',
      'booking_confirmation': type === 'email' ? 'booking_confirmation' : 'booking_confirmation_sms',
      'booking_reminder': 'booking_reminder',
      'booking_cancellation': 'booking_cancellation'
    };

    const templateKey = templateKeyMap[useCase];
    if (!templateKey) {
      console.warn(`No template key mapped for use case: ${useCase}`);
      return null;
    }

    return this.getTemplate(templateKey, language, data);
  }
}

export default CommunicationTemplateService;

