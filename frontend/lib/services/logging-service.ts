import { ConversationLog, OrchestratorConfig } from '@/lib/types/conversational-orchestrator';
import { PrismaClient } from '@prisma/client';

export class LoggingService {
  private config: OrchestratorConfig['logging'];
  private prisma: PrismaClient;

  constructor(config: OrchestratorConfig['logging']) {
    this.config = config;
    this.prisma = new PrismaClient();
  }

  /**
   * Registra una interacción completa del orquestador
   */
  async logConversation(logData: Omit<ConversationLog, 'id' | 'timestamp'>): Promise<string> {
    if (!this.config.enabled) {
      return 'logging-disabled';
    }

    const logId = this.generateLogId();
    const timestamp = new Date().toISOString();

    const fullLog: ConversationLog = {
      id: logId,
      timestamp,
      ...logData
    };

    try {
      switch (this.config.storage) {
        case 'database':
          await this.logToDatabase(fullLog);
          break;
        case 'file':
          await this.logToFile(fullLog);
          break;
        case 'console':
          this.logToConsole(fullLog);
          break;
      }

      return logId;
    } catch (error) {
      console.error('Error logging conversation:', error);
      // Fallback to console logging
      this.logToConsole(fullLog);
      return logId;
    }
  }

  /**
   * Registra un error específico
   */
  async logError(
    userId: string,
    error: string,
    context: {
      message?: string;
      intent?: string;
      action?: string;
      apiCalls?: any[];
    }
  ): Promise<string> {
    const logData: Omit<ConversationLog, 'id' | 'timestamp'> = {
      sessionId: `error_${Date.now()}`,
      userId,
      message: context.message || 'Error occurred',
      userMessage: context.message || 'Error occurred',
      botResponse: 'Error response generated',
      rasaIntent: context.intent || 'error',
      rasaConfidence: 0,
      rasaEntities: [],
      responseGenerator: context.action || 'error_handling',
      bookingStep: null,
      bookingDataSnapshot: null,
      modelVersion: '1.0.0',
      intent: context.intent || 'error',
      entities: [],
      action: context.action || 'error_handling',
      rasaResponse: 'Error in processing',
      llmResponse: 'Error response generated',
      apiCalls: context.apiCalls || [],
      processingTime: 0,
      success: false,
      error
    };

    return this.logConversation(logData);
  }

  /**
   * Obtiene logs de conversación por usuario
   */
  async getConversationLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ConversationLog[]> {
    if (this.config.storage !== 'database') {
      console.warn('getConversationLogs only available with database storage');
      return [];
    }

    try {
      // Esta consulta asume que tienes una tabla de logs en tu base de datos
      // Necesitarás crear la tabla correspondiente en tu schema de Prisma
      const logs = await this.prisma.$queryRaw`
        SELECT * FROM conversation_logs 
        WHERE user_id = ${userId} 
        ORDER BY timestamp DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;

      return logs as ConversationLog[];
    } catch (error) {
      console.error('Error fetching conversation logs:', error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas de conversación
   */
  async getConversationStats(
    userId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{
    totalConversations: number;
    successfulConversations: number;
    failedConversations: number;
    averageProcessingTime: number;
    topIntents: Array<{intent: string, count: number}>;
    topErrors: Array<{error: string, count: number}>;
  }> {
    if (this.config.storage !== 'database') {
      console.warn('getConversationStats only available with database storage');
      return {
        totalConversations: 0,
        successfulConversations: 0,
        failedConversations: 0,
        averageProcessingTime: 0,
        topIntents: [],
        topErrors: []
      };
    }

    try {
      const whereClause = this.buildWhereClause(userId, dateFrom, dateTo);
      
      const stats = await this.prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_conversations,
          SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_conversations,
          SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failed_conversations,
          AVG(processing_time) as average_processing_time
        FROM conversation_logs 
        ${whereClause}
      `;

      const topIntents = await this.prisma.$queryRaw`
        SELECT intent, COUNT(*) as count
        FROM conversation_logs 
        ${whereClause}
        GROUP BY intent
        ORDER BY count DESC
        LIMIT 10
      `;

      const topErrors = await this.prisma.$queryRaw`
        SELECT error, COUNT(*) as count
        FROM conversation_logs 
        WHERE success = false AND error IS NOT NULL
        ${userId ? `AND user_id = ${userId}` : ''}
        ${dateFrom ? `AND timestamp >= ${dateFrom}` : ''}
        ${dateTo ? `AND timestamp <= ${dateTo}` : ''}
        GROUP BY error
        ORDER BY count DESC
        LIMIT 10
      `;

      return {
        totalConversations: Number((stats as any)[0]?.total_conversations || 0),
        successfulConversations: Number((stats as any)[0]?.successful_conversations || 0),
        failedConversations: Number((stats as any)[0]?.failed_conversations || 0),
        averageProcessingTime: Number((stats as any)[0]?.average_processing_time || 0),
        topIntents: topIntents as Array<{intent: string, count: number}>,
        topErrors: topErrors as Array<{error: string, count: number}>
      };
    } catch (error) {
      console.error('Error fetching conversation stats:', error);
      return {
        totalConversations: 0,
        successfulConversations: 0,
        failedConversations: 0,
        averageProcessingTime: 0,
        topIntents: [],
        topErrors: []
      };
    }
  }

  /**
   * Limpia logs antiguos
   */
  async cleanOldLogs(daysToKeep: number = 30): Promise<number> {
    if (this.config.storage !== 'database') {
      console.warn('cleanOldLogs only available with database storage');
      return 0;
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.prisma.$executeRaw`
        DELETE FROM conversation_logs 
        WHERE timestamp < ${cutoffDate.toISOString()}
      `;

      return result;
    } catch (error) {
      console.error('Error cleaning old logs:', error);
      return 0;
    }
  }

  /**
   * Registra en la base de datos
   */
  private async logToDatabase(log: ConversationLog): Promise<void> {
    try {
      // For Telegram users (numeric chat IDs), always set userId to null since they don't exist in users table
      // This avoids foreign key constraint issues
      const isTelegramUser = log.userId && /^\d+$/.test(log.userId);
      const userId = isTelegramUser ? null : log.userId;

      await this.prisma.conversationLog.create({
        data: {
          sessionId: log.sessionId || `session_${Date.now()}`,
          userId: userId,
          userMessage: log.message,
          botResponse: log.llmResponse || log.rasaResponse || 'No response generated',
          rasaIntent: log.intent,
          rasaConfidence: log.confidence || 0.5,
          rasaEntities: log.entities || [],
          responseGenerator: log.action || 'unknown',
          bookingStep: log.bookingStep || null,
          bookingDataSnapshot: log.bookingData || null,
          modelVersion: log.modelVersion || '1.0.0'
        }
      });
      
      console.log('✅ Conversation log saved to database successfully');
    } catch (error) {
      console.error('Error saving conversation log to database:', error);
      // Fallback to console logging instead of throwing
      console.log('📝 [FALLBACK LOG]', {
        id: log.id,
        timestamp: log.timestamp,
        userId: log.userId,
        message: log.message,
        intent: log.intent,
        action: log.action
      });
    }
  }

  /**
   * Registra en archivo
   */
  private async logToFile(log: ConversationLog): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, `conversations-${new Date().toISOString().split('T')[0]}.jsonl`);
    
    // Crear directorio si no existe
    await fs.mkdir(logDir, { recursive: true });
    
    // Escribir log en formato JSONL
    const logLine = JSON.stringify(log) + '\n';
    await fs.appendFile(logFile, logLine);
  }

  /**
   * Registra en consola
   */
  private logToConsole(log: ConversationLog): void {
    const logLevel = this.config.level;
    
    if (logLevel === 'debug' || logLevel === 'info') {
      console.log(`[CONVERSATION LOG] ${JSON.stringify(log, null, 2)}`);
    } else if (logLevel === 'warn' && !log.success) {
      console.warn(`[CONVERSATION WARNING] ${JSON.stringify(log, null, 2)}`);
    } else if (logLevel === 'error' && !log.success) {
      console.error(`[CONVERSATION ERROR] ${JSON.stringify(log, null, 2)}`);
    }
  }

  /**
   * Genera un ID único para el log
   */
  private generateLogId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Construye la cláusula WHERE para consultas SQL
   */
  private buildWhereClause(userId?: string, dateFrom?: string, dateTo?: string): string {
    const conditions = [];
    
    if (userId) {
      conditions.push(`user_id = '${userId}'`);
    }
    
    if (dateFrom) {
      conditions.push(`timestamp >= '${dateFrom}'`);
    }
    
    if (dateTo) {
      conditions.push(`timestamp <= '${dateTo}'`);
    }
    
    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  /**
   * Cierra la conexión a la base de datos
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
