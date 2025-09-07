import { prisma } from '@/lib/prisma';
import OpenRouterService from './openrouter-service';

interface TrainingDataPoint {
  text: string;
  intent: string;
  entities: Array<{
    entity: string;
    value: string;
    start: number;
    end: number;
  }>;
}

interface ModelPerformance {
  modelVersion: string;
  evaluationResults: {
    accuracy: number;
    precision: Record<string, number>;
    recall: Record<string, number>;
    f1Score: Record<string, number>;
  };
  bookingSuccessRate: number;
  avgConversationTurns: number;
}

export class MLPipelineService {
  private prisma: typeof prisma;
  private openRouter: OpenRouterService;

  constructor(prismaInstance: typeof prisma, openRouter: OpenRouterService) {
    this.prisma = prismaInstance;
    this.openRouter = openRouter;
  }

  /**
   * Generate new training data from conversation logs
   */
  async generateTrainingData(options: {
    minConfidence?: number;
    includeNegativeFeedback?: boolean;
    includeFallbackCases?: boolean;
    limit?: number;
  } = {}): Promise<TrainingDataPoint[]> {
    const {
      minConfidence = 0.6,
      includeNegativeFeedback = true,
      includeFallbackCases = true,
      limit = 100
    } = options;

    // Find interesting conversation logs
    const logs = await this.prisma.conversationLog.findMany({
      where: {
        OR: [
          // Low confidence predictions
          { rasaConfidence: { lt: minConfidence } },
          // Negative feedback cases
          ...(includeNegativeFeedback ? [{
            feedback: {
              some: { rating: 1 }
            }
          }] : []),
          // Fallback cases
          ...(includeFallbackCases ? [{
            responseGenerator: 'openrouter'
          }] : [])
        ]
      },
      include: {
        feedback: true
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    const trainingData: TrainingDataPoint[] = [];

    for (const log of logs) {
      try {
        // Generate variations using OpenRouter
        const variations = await this.openRouter.generateTrainingVariations(
          log.userMessage,
          log.rasaIntent || 'nlu_fallback'
        );

        for (const variation of variations) {
          // Extract entities from the variation
          const entityExtraction = await this.openRouter.extractEntitiesFromFallback({
            userMessage: variation,
            conversationHistory: [],
            requiredEntities: ['person_name', 'email_address', 'phone_number', 'birth_date', 'birth_time', 'birth_place', 'question_text', 'language_preference']
          });

          const entities = Object.entries(entityExtraction.entities)
            .filter(([_, value]) => value && typeof value === 'string')
            .map(([entity, value]) => ({
              entity,
              value: value as string,
              start: variation.indexOf(value as string),
              end: variation.indexOf(value as string) + (value as string).length
            }));

          trainingData.push({
            text: variation,
            intent: entityExtraction.intent,
            entities
          });
        }
      } catch (error) {
        console.error('Error generating training data for log:', log.id, error);
      }
    }

    return trainingData;
  }

  /**
   * Evaluate model performance
   */
  async evaluateModel(modelVersion: string): Promise<ModelPerformance> {
    // Get test conversations from the last 30 days
    const testLogs = await this.prisma.conversationLog.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        modelVersion: modelVersion
      },
      include: {
        feedback: true
      }
    });

    // Calculate metrics
    const totalLogs = testLogs.length;
    const correctPredictions = testLogs.filter(log => 
      log.rasaConfidence && Number(log.rasaConfidence) > 0.7
    ).length;

    const accuracy = totalLogs > 0 ? correctPredictions / totalLogs : 0;

    // Calculate booking success rate
    const bookingLogs = testLogs.filter(log => 
      log.bookingStep === 'booking_complete' || 
      log.bookingStep === 'selecting_timeslot'
    );
    const successfulBookings = bookingLogs.filter(log => 
      log.bookingStep === 'booking_complete'
    ).length;
    const bookingSuccessRate = bookingLogs.length > 0 ? successfulBookings / bookingLogs.length : 0;

    // Calculate average conversation turns
    const sessionTurns = await this.prisma.conversationLog.groupBy({
      by: ['sessionId'],
      where: {
        modelVersion: modelVersion,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      _count: { id: true }
    });

    const avgConversationTurns = sessionTurns.length > 0 
      ? sessionTurns.reduce((sum, session) => sum + session._count.id, 0) / sessionTurns.length 
      : 0;

    // Calculate per-intent metrics (simplified)
    const intentMetrics = await this.calculateIntentMetrics(testLogs);

    const performance: ModelPerformance = {
      modelVersion,
      evaluationResults: {
        accuracy,
        precision: intentMetrics.precision,
        recall: intentMetrics.recall,
        f1Score: intentMetrics.f1Score
      },
      bookingSuccessRate,
      avgConversationTurns
    };

    // Save performance to database
    await this.prisma.mlModelPerformance.upsert({
      where: { modelVersion },
      update: {
        evaluationResults: performance.evaluationResults,
        bookingSuccessRate: performance.bookingSuccessRate,
        avgConversationTurns: performance.avgConversationTurns
      },
      create: {
        modelVersion,
        evaluationResults: performance.evaluationResults,
        bookingSuccessRate: performance.bookingSuccessRate,
        avgConversationTurns: performance.avgConversationTurns,
        deploymentDate: new Date(),
        isActiveProduction: false
      }
    });

    return performance;
  }

  /**
   * Create A/B test experiment
   */
  async createABTest(options: {
    experimentName: string;
    modelAVersion: string;
    modelBVersion: string;
    trafficSplit?: number;
    successMetric: string;
  }) {
    const { trafficSplit = 0.5, ...rest } = options;

    return await this.prisma.abTestExperiment.create({
      data: {
        ...rest,
        trafficSplit,
        status: 'active'
      }
    });
  }

  /**
   * Assign user to A/B test group
   */
  async assignToABTest(sessionId: string, experimentId: number): Promise<'A' | 'B'> {
    // Check if already assigned
    const existing = await this.prisma.abTestAssignment.findUnique({
      where: {
        experimentId_sessionId: {
          experimentId,
          sessionId
        }
      }
    });

    if (existing) {
      return existing.assignedModel as 'A' | 'B';
    }

    // Get experiment details
    const experiment = await this.prisma.abTestExperiment.findUnique({
      where: { id: experimentId }
    });

    if (!experiment || experiment.status !== 'active') {
      return 'A'; // Default to model A
    }

    // Assign based on traffic split
    const random = Math.random();
    const assignedModel = random < Number(experiment.trafficSplit) ? 'A' : 'B';

    await this.prisma.abTestAssignment.create({
      data: {
        experimentId,
        sessionId,
        assignedModel
      }
    });

    return assignedModel;
  }

  /**
   * Get model for A/B testing
   */
  async getModelForSession(sessionId: string): Promise<string> {
    // Check for active A/B tests
    const activeExperiments = await this.prisma.abTestExperiment.findMany({
      where: { status: 'active' }
    });

    for (const experiment of activeExperiments) {
      const assignment = await this.assignToABTest(sessionId, experiment.id);
      return assignment === 'A' ? experiment.modelAVersion : experiment.modelBVersion;
    }

    // Return default production model
    const productionModel = await this.prisma.mlModelPerformance.findFirst({
      where: { isActiveProduction: true },
      orderBy: { deploymentDate: 'desc' }
    });

    return productionModel?.modelVersion || 'default';
  }

  /**
   * Mark training data as reviewed
   */
  async markFeedbackAsReviewed(feedbackIds: number[]) {
    await this.prisma.userFeedback.updateMany({
      where: { id: { in: feedbackIds } },
      data: { reviewedForTraining: true }
    });
  }

  private async calculateIntentMetrics(logs: any[]): Promise<{
    precision: Record<string, number>;
    recall: Record<string, number>;
    f1Score: Record<string, number>;
  }> {
    // Simplified intent metrics calculation
    // In a real implementation, you'd have ground truth labels
    const intents = [...new Set(logs.map(log => log.rasaIntent).filter(Boolean))];
    
    const metrics = {
      precision: {} as Record<string, number>,
      recall: {} as Record<string, number>,
      f1Score: {} as Record<string, number>
    };

    for (const intent of intents) {
      const intentLogs = logs.filter(log => log.rasaIntent === intent);
      const highConfidenceLogs = intentLogs.filter(log => log.rasaConfidence && log.rasaConfidence > 0.7);
      
      // Simplified calculation - in reality you'd need true positives, false positives, etc.
      const precision = intentLogs.length > 0 ? highConfidenceLogs.length / intentLogs.length : 0;
      const recall = precision; // Simplified
      const f1Score = precision > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

      metrics.precision[intent] = precision;
      metrics.recall[intent] = recall;
      metrics.f1Score[intent] = f1Score;
    }

    return metrics;
  }
}

export default MLPipelineService;
