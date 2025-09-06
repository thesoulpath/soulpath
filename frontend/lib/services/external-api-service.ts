import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export interface ExternalAPIConfig {
  id?: string;
  name: string;
  provider: string;
  category: string;
  apiKey?: string;
  apiSecret?: string;
  apiUrl?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  config?: any;
  isActive: boolean;
  testMode: boolean;
  description?: string;
  version?: string;
  rateLimit?: number;
  timeout?: number;
  lastTestedAt?: Date;
  lastTestResult?: any;
  healthStatus?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface APIConfigAudit {
  configId: string;
  action: 'create' | 'update' | 'delete' | 'test';
  oldValues?: any;
  newValues?: any;
  performedBy: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ExternalAPIService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Crear una nueva configuración de API externa
   */
  async createConfig(
    configData: ExternalAPIConfig,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ExternalAPIConfig> {
    try {
      // Encriptar credenciales sensibles
      const processedData = await this.processCredentials(configData, 'encrypt');

      const config = await this.prisma.externalAPIConfig.create({
        data: {
          name: processedData.name || '',
          provider: processedData.provider || '',
          category: processedData.category || '',
          apiKey: processedData.apiKey || '',
          apiSecret: processedData.apiSecret || '',
          apiUrl: processedData.apiUrl || '',
          description: processedData.description || '',
          isActive: processedData.isActive ?? true,
          timeout: processedData.timeout || 30000,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Registrar auditoría
      await this.createAuditLog({
        configId: config.id,
        action: 'create',
        newValues: config,
        performedBy: userId,
        ipAddress,
        userAgent,
      });

      return this.formatConfig(config);
    } catch (error) {
      console.error('Error creating API config:', error);
      throw new Error('Failed to create API configuration');
    }
  }

  /**
   * Obtener todas las configuraciones de API
   */
  async getAllConfigs(): Promise<ExternalAPIConfig[]> {
    try {
      const configs = await this.prisma.externalAPIConfig.findMany({
        orderBy: { updatedAt: 'desc' },
      });

      return configs.map(config => this.formatConfig(config));
    } catch (error) {
      console.error('Error fetching API configs:', error);
      throw new Error('Failed to fetch API configurations');
    }
  }

  /**
   * Obtener configuración por ID
   */
  async getConfigById(id: string): Promise<ExternalAPIConfig | null> {
    try {
      const config = await this.prisma.externalAPIConfig.findUnique({
        where: { id },
      });

      return config ? this.formatConfig(config) : null;
    } catch (error) {
      console.error('Error fetching API config:', error);
      throw new Error('Failed to fetch API configuration');
    }
  }

  /**
   * Obtener configuración por nombre
   */
  async getConfigByName(name: string): Promise<ExternalAPIConfig | null> {
    try {
      const config = await this.prisma.externalAPIConfig.findUnique({
        where: { name },
      });

      return config ? this.formatConfig(config) : null;
    } catch (error) {
      console.error('Error fetching API config by name:', error);
      throw new Error('Failed to fetch API configuration');
    }
  }

  /**
   * Actualizar configuración de API
   */
  async updateConfig(
    id: string,
    updateData: Partial<ExternalAPIConfig>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ExternalAPIConfig> {
    try {
      // Obtener configuración actual para auditoría
      const currentConfig = await this.prisma.externalAPIConfig.findUnique({
        where: { id },
      });

      if (!currentConfig) {
        throw new Error('Configuration not found');
      }

      // Procesar credenciales
      const processedData = await this.processCredentials(updateData, 'encrypt');

      const updatedConfig = await this.prisma.externalAPIConfig.update({
        where: { id },
        data: {
          ...processedData,
          updatedBy: userId,
        },
      });

      // Registrar auditoría
      await this.createAuditLog({
        configId: id,
        action: 'update',
        oldValues: this.formatConfig(currentConfig),
        newValues: this.formatConfig(updatedConfig),
        performedBy: userId,
        ipAddress,
        userAgent,
      });

      return this.formatConfig(updatedConfig);
    } catch (error) {
      console.error('Error updating API config:', error);
      throw new Error('Failed to update API configuration');
    }
  }

  /**
   * Eliminar configuración de API
   */
  async deleteConfig(
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Obtener configuración actual para auditoría
      const currentConfig = await this.prisma.externalAPIConfig.findUnique({
        where: { id },
      });

      if (!currentConfig) {
        throw new Error('Configuration not found');
      }

      await this.prisma.externalAPIConfig.delete({
        where: { id },
      });

      // Registrar auditoría
      await this.createAuditLog({
        configId: id,
        action: 'delete',
        oldValues: this.formatConfig(currentConfig),
        performedBy: userId,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error('Error deleting API config:', error);
      throw new Error('Failed to delete API configuration');
    }
  }

  /**
   * Probar configuración de API
   */
  async testConfig(
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const config = await this.prisma.externalAPIConfig.findUnique({
        where: { id },
      });

      if (!config) {
        throw new Error('Configuration not found');
      }

      const result = await this.performAPITest(config);

      // Actualizar estado de la configuración
      await this.prisma.externalAPIConfig.update({
        where: { id },
        data: {
          lastTestedAt: new Date(),
          lastTestResult: result.message,
          healthStatus: result.success ? 'healthy' : 'unhealthy',
        },
      });

      // Registrar auditoría
      await this.createAuditLog({
        configId: id,
        action: 'test',
        performedBy: userId,
        ipAddress,
        userAgent,
      });

      return result;
    } catch (error) {
      console.error('Error testing API config:', error);
      return {
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Obtener logs de auditoría
   */
  async getAuditLogs(
    configId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<APIConfigAudit[]> {
    try {
      const where = configId ? { configId } : {};

      const logs = await this.prisma.aPIConfigAudit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return logs.map(log => ({
        ...log,
        action: log.action as 'create' | 'update' | 'delete' | 'test',
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined
      }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw new Error('Failed to fetch audit logs');
    }
  }

  /**
   * Procesar credenciales (encriptar/desencriptar)
   */
  private async processCredentials(
    data: Partial<ExternalAPIConfig>,
    action: 'encrypt' | 'decrypt'
  ): Promise<Partial<ExternalAPIConfig>> {
    const processed: any = { ...data };

    // Campos sensibles que requieren encriptación
    const sensitiveFields = ['apiKey', 'apiSecret', 'webhookSecret'];

    for (const field of sensitiveFields) {
      if (processed[field]) {
        if (action === 'encrypt') {
          // En un entorno real, usarías una clave de encriptación fuerte
          // Por simplicidad, aquí usamos un hash simple, pero en producción
          // deberías usar encriptación simétrica (AES) con una clave maestra
          processed[field] = await bcrypt.hash(processed[field] as string, 12);
        }
        // Para desencriptar, necesitarías el valor original o una implementación de desencriptación
      }
    }

    return processed;
  }

  /**
   * Formatear configuración para respuesta (desencriptar valores sensibles si es necesario)
   */
  private formatConfig(config: any): ExternalAPIConfig {
    // En un entorno real, aquí desencriptarías los valores sensibles
    // Para esta implementación, simplemente devolvemos la configuración sin desencriptar
    // ya que las claves encriptadas se usarían directamente en las llamadas a APIs

    return {
      id: config.id,
      name: config.name,
      provider: config.provider,
      category: config.category,
      apiUrl: config.apiUrl,
      webhookUrl: config.webhookUrl,
      config: config.config,
      isActive: config.isActive,
      testMode: config.testMode,
      description: config.description,
      version: config.version,
      rateLimit: config.rateLimit,
      timeout: config.timeout,
      lastTestedAt: config.lastTestedAt,
      lastTestResult: config.lastTestResult,
      healthStatus: config.healthStatus,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      createdBy: config.createdBy,
      updatedBy: config.updatedBy,
    };
  }

  /**
   * Realizar prueba de API específica según el proveedor
   */
  private async performAPITest(config: any): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      switch (config.name.toLowerCase()) {
        case 'openrouter':
          return await this.testOpenRouter(config);
        case 'twilio':
          return await this.testTwilio(config);
        case 'telegram':
          return await this.testTelegram(config);
        default:
          return {
            success: false,
            message: `Test not implemented for provider: ${config.provider}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Probar conexión con OpenRouter
   */
  private async testOpenRouter(config: any): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);
      
      const response = await fetch(`${config.apiUrl || 'https://openrouter.ai/api/v1'}/models`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'OpenRouter connection successful',
          details: { modelsCount: data.data?.length || 0 },
        };
      } else {
        return {
          success: false,
          message: `OpenRouter API error: ${response.status} ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `OpenRouter connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Probar conexión con Twilio
   */
  private async testTwilio(config: any): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // Usar la API de Twilio para verificar credenciales
      const auth = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);
      
      const response = await fetch('https://api.twilio.com/2010-04-01/Accounts.json', {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'Twilio connection successful',
          details: { accountSid: data.accounts?.[0]?.sid },
        };
      } else {
        return {
          success: false,
          message: `Twilio API error: ${response.status} ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Twilio connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Probar conexión con Telegram
   */
  private async testTelegram(config: any): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);
      
      const response = await fetch(`https://api.telegram.org/bot${config.apiKey}/getMe`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          return {
            success: true,
            message: 'Telegram connection successful',
            details: { botName: data.result?.first_name },
          };
        } else {
          return {
            success: false,
            message: `Telegram API error: ${data.description || 'Unknown error'}`,
          };
        }
      } else {
        return {
          success: false,
          message: `Telegram HTTP error: ${response.status} ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Telegram connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Crear registro de auditoría
   */
  private async createAuditLog(auditData: APIConfigAudit): Promise<void> {
    try {
      await this.prisma.aPIConfigAudit.create({
        data: auditData,
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      // No lanzamos error para no interrumpir la operación principal
    }
  }

  /**
   * Cerrar conexión con la base de datos
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

