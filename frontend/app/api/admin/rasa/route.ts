import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin permissions
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const endDate = dateTo ? new Date(dateTo) : new Date();

    switch (action) {
      case 'health':
        return await getRasaHealth();

      case 'stats':
        return await getRasaStats(startDate, endDate);

      case 'intent-performance':
        return await getIntentPerformance(startDate, endDate);

      case 'conversation-logs':
        return await getConversationLogs(startDate, endDate, limit, offset);

      case 'error-analysis':
        return await getErrorAnalysis(startDate, endDate);

      case 'model-info':
        return await getModelInfo();

      case 'performance-metrics':
        return await getPerformanceMetrics(startDate, endDate);

      default:
        return NextResponse.json({
          success: true,
          data: {
            availableActions: [
              'health',
              'stats',
              'intent-performance',
              'conversation-logs',
              'error-analysis',
              'model-info',
              'performance-metrics'
            ]
          }
        });
    }

  } catch (error) {
    console.error('Rasa API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function getRasaHealth() {
  try {
    // Check Rasa server health
    const rasaUrl = process.env.RASA_URL || 'http://localhost:5005';
    const response = await fetch(`${rasaUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`Rasa server responded with status: ${response.status}`);
    }

    const healthData = await response.json();
    
    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        rasa: healthData,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      data: {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    });
  }
}

async function getRasaStats(startDate: Date, endDate: Date) {
  try {
    // Get conversation statistics from database
    const stats = await prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN success = true THEN 1 END) as successful_conversations,
        AVG(processing_time) as avg_processing_time,
        COUNT(CASE WHEN intent = 'agendar_cita' THEN 1 END) as booking_attempts,
        COUNT(CASE WHEN intent = 'consultar_horoscopo' THEN 1 END) as horoscope_queries,
        COUNT(CASE WHEN intent = 'pregunta_general' THEN 1 END) as general_questions
      FROM conversation_logs 
      WHERE timestamp >= ${startDate} AND timestamp <= ${endDate}
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `;

    // Get overall stats
    const overallStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN success = true THEN 1 END) as successful_conversations,
        AVG(processing_time) as avg_processing_time,
        MIN(timestamp) as first_conversation,
        MAX(timestamp) as last_conversation
      FROM conversation_logs 
      WHERE timestamp >= ${startDate} AND timestamp <= ${endDate}
    `;

    return NextResponse.json({
      success: true,
      data: {
        dailyStats: stats,
        overallStats: (overallStats as any)[0],
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching Rasa stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Rasa statistics'
    }, { status: 500 });
  }
}

async function getIntentPerformance(startDate: Date, endDate: Date) {
  try {
    const intentStats = await prisma.$queryRaw`
      SELECT 
        intent,
        COUNT(*) as total_occurrences,
        COUNT(CASE WHEN success = true THEN 1 END) as successful_predictions,
        ROUND(
          COUNT(CASE WHEN success = true THEN 1 END) * 100.0 / COUNT(*), 2
        ) as accuracy_percentage,
        AVG(processing_time) as avg_processing_time,
        AVG(confidence_score) as avg_confidence
      FROM conversation_logs 
      WHERE timestamp >= ${startDate} AND timestamp <= ${endDate}
        AND intent IS NOT NULL
      GROUP BY intent
      ORDER BY total_occurrences DESC
    `;

    return NextResponse.json({
      success: true,
      data: intentStats
    });
  } catch (error) {
    console.error('Error fetching intent performance:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch intent performance data'
    }, { status: 500 });
  }
}

async function getConversationLogs(startDate: Date, endDate: Date, limit: number, offset: number) {
  try {
    const logs = await prisma.conversationLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        userId: true,
        userMessage: true,
        botResponse: true,
        rasaIntent: true,
        rasaEntities: true,
        responseGenerator: true,
        timestamp: true,
        rasaConfidence: true
      }
    });

    const totalCount = await prisma.conversationLog.count({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    });
  } catch (error) {
    console.error('Error fetching conversation logs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch conversation logs'
    }, { status: 500 });
  }
}

async function getErrorAnalysis(startDate: Date, endDate: Date) {
  try {
    const errorStats = await prisma.$queryRaw`
      SELECT 
        error_type,
        error_message,
        COUNT(*) as error_count,
        MAX(timestamp) as last_occurrence,
        COUNT(DISTINCT user_id) as affected_users
      FROM conversation_logs 
      WHERE success = false 
        AND timestamp >= ${startDate} 
        AND timestamp <= ${endDate}
        AND error_type IS NOT NULL
      GROUP BY error_type, error_message
      ORDER BY error_count DESC
      LIMIT 20
    `;

    const errorTrends = await prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as total_errors,
        COUNT(CASE WHEN error_type = 'rasa_error' THEN 1 END) as rasa_errors,
        COUNT(CASE WHEN error_type = 'llm_error' THEN 1 END) as llm_errors,
        COUNT(CASE WHEN error_type = 'api_error' THEN 1 END) as api_errors
      FROM conversation_logs 
      WHERE success = false 
        AND timestamp >= ${startDate} 
        AND timestamp <= ${endDate}
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `;

    return NextResponse.json({
      success: true,
      data: {
        errorStats,
        errorTrends
      }
    });
  } catch (error) {
    console.error('Error fetching error analysis:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch error analysis'
    }, { status: 500 });
  }
}

async function getModelInfo() {
  try {
    const rasaUrl = process.env.RASA_URL || 'http://localhost:5005';
    
    // Get model information
    const modelResponse = await fetch(`${rasaUrl}/model`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!modelResponse.ok) {
      throw new Error(`Failed to fetch model info: ${modelResponse.status}`);
    }

    const modelData = await modelResponse.json();

    // Get available models
    const modelsResponse = await fetch(`${rasaUrl}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    let availableModels = [];
    if (modelsResponse.ok) {
      availableModels = await modelsResponse.json();
    }

    return NextResponse.json({
      success: true,
      data: {
        currentModel: modelData,
        availableModels,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch model information',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getPerformanceMetrics(startDate: Date, endDate: Date) {
  try {
    const metrics = await prisma.$queryRaw`
      SELECT 
        AVG(processing_time) as avg_processing_time,
        MIN(processing_time) as min_processing_time,
        MAX(processing_time) as max_processing_time,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY processing_time) as median_processing_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time) as p95_processing_time,
        AVG(confidence_score) as avg_confidence,
        MIN(confidence_score) as min_confidence,
        MAX(confidence_score) as max_confidence,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN success = true THEN 1 END) as successful_requests,
        COUNT(CASE WHEN success = false THEN 1 END) as failed_requests
      FROM conversation_logs 
      WHERE timestamp >= ${startDate} AND timestamp <= ${endDate}
    `;

    const hourlyMetrics = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        COUNT(*) as request_count,
        AVG(processing_time) as avg_processing_time,
        COUNT(CASE WHEN success = true THEN 1 END) as successful_requests
      FROM conversation_logs 
      WHERE timestamp >= ${startDate} AND timestamp <= ${endDate}
      GROUP BY EXTRACT(HOUR FROM timestamp)
      ORDER BY hour
    `;

    return NextResponse.json({
      success: true,
      data: {
        overallMetrics: (metrics as any)[0],
        hourlyMetrics,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch performance metrics'
    }, { status: 500 });
  }
}
