import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ConversationLogsResponse } from '@/lib/types/conversational-orchestrator';

// Query schema for conversation logs
const querySchema = z.object({
  userId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  intent: z.string().optional(),
  confidence: z.string().optional(),
  hasFeedback: z.enum(['true', 'false', 'all']).optional(),
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(50),
  enhanced: z.enum(['true', 'false']).optional()
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/conversation-logs - Starting request...');
    
    const user = await requireAuth(request);
    if (!user || user.role !== 'admin') {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      }, { status: 401 });
    }

    console.log('✅ Admin user authenticated:', user.email);

    // Test database connection
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        message: 'Unable to connect to database',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validation = querySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { 
      userId, 
      dateFrom, 
      dateTo, 
      intent, 
      confidence, 
      hasFeedback, 
      page, 
      limit, 
      enhanced 
    } = validation.data;
    
    const offset = (page - 1) * limit;

    console.log('🔍 Query parameters:', { 
      userId, 
      dateFrom, 
      dateTo, 
      intent, 
      confidence, 
      hasFeedback, 
      page, 
      limit, 
      enhanced 
    });

    // Build the query
    const where: any = {};

    if (userId) where.userId = userId;
    if (intent) where.rasaIntent = intent;
    if (confidence) {
      const confValue = parseFloat(confidence);
      where.rasaConfidence = { lte: confValue };
    }
    if (hasFeedback === 'true') {
      where.feedback = { some: {} };
    } else if (hasFeedback === 'false') {
      where.feedback = { none: {} };
    }
    // 'all' or undefined means no filter applied
    if (dateFrom) where.timestamp = { gte: new Date(`${dateFrom}T00:00:00Z`) };
    if (dateTo) {
      where.timestamp = {
        ...(where.timestamp || {}),
        lte: new Date(`${dateTo}T23:59:59Z`)
      };
    }

    // Base select fields
    const select: any = {
      id: true,
      userId: true,
      userMessage: true,
      botResponse: true,
      rasaIntent: true,
      rasaConfidence: true,
      rasaEntities: true,
      timestamp: true,
      feedback: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true
        }
      }
    };

    // Enhanced mode includes more detailed information
    if (enhanced === 'true') {
      select.apiCalls = true;
      select.errorDetails = true;
      select.context = true;
    }

    // Get total count for pagination
    let totalCount: number;
    try {
      totalCount = await prisma.conversationLog.count({ where });
      console.log('✅ Total count query successful:', totalCount);
    } catch (countError) {
      console.error('❌ Count query failed:', countError);
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        message: 'Unable to count conversation logs',
        details: countError instanceof Error ? countError.message : 'Unknown count error'
      }, { status: 500 });
    }

    // Get the logs
    let logs: any[];
    try {
      logs = await prisma.conversationLog.findMany({
        where,
        select,
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit
      });
      console.log('✅ Logs query successful:', logs.length, 'logs found');
    } catch (logsError) {
      console.error('❌ Logs query failed:', logsError);
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        message: 'Unable to fetch conversation logs',
        details: logsError instanceof Error ? logsError.message : 'Unknown logs error'
      }, { status: 500 });
    }

    // Calculate statistics
    let stats: any;
    try {
      stats = await calculateConversationStats(where);
      console.log('✅ Statistics calculation successful');
    } catch (statsError) {
      console.error('❌ Statistics calculation failed:', statsError);
      return NextResponse.json({
        success: false,
        error: 'Statistics calculation failed',
        message: 'Unable to calculate conversation statistics',
        details: statsError instanceof Error ? statsError.message : 'Unknown stats error'
      }, { status: 500 });
    }

    console.log(`✅ Found ${logs.length} conversation logs (${totalCount} total)`);

    const response: ConversationLogsResponse = {
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: offset + limit < totalCount,
        hasPrev: page > 1
      },
      statistics: stats
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Conversation logs GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      }, { status: 401 });
    }

    const body = await request.json();
    const { action, logIds, feedback } = body;

    switch (action) {
      case 'mark_for_training':
        // Mark logs as reviewed for training
        const updatedLogs = await prisma.userFeedback.updateMany({
          where: { conversationLogId: { in: logIds } },
          data: { reviewedForTraining: true }
        });

        return NextResponse.json({
          success: true,
          message: `Marked ${updatedLogs.count} logs for training`,
          data: { updatedCount: updatedLogs.count }
        });

      case 'export_training_data':
        // Export logs in Rasa training format
        const trainingLogs = await prisma.conversationLog.findMany({
          where: { id: { in: logIds } },
          select: {
            userMessage: true,
            rasaIntent: true,
            rasaEntities: true,
            rasaConfidence: true
          }
        });

        const rasaFormat = convertToRasaFormat(trainingLogs);
        
        return NextResponse.json({
          success: true,
          data: {
            format: 'rasa_nlu',
            content: rasaFormat,
            count: trainingLogs.length
          }
        });

      case 'bulk_feedback':
        // Add bulk feedback to logs
        const feedbackUpdates = await Promise.all(
          logIds.map((logId: string) =>
            prisma.userFeedback.create({
              data: {
                conversationLogId: parseInt(logId),
                sessionId: '', // This should be provided in the feedback data
                rating: feedback.rating || 1,
                comment: feedback.comment || null,
                ...feedback
              }
            })
          )
        );

        return NextResponse.json({
          success: true,
          message: `Updated feedback for ${feedbackUpdates.length} logs`,
          data: { updatedCount: feedbackUpdates.length }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          message: 'Supported actions: mark_for_training, export_training_data, bulk_feedback'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Conversation logs POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

async function calculateConversationStats(where: any) {
  try {
    console.log('🔍 Calculating conversation statistics...');
    
    const [
      totalLogs,
      lowConfidenceLogs,
      highConfidenceLogs,
      logsWithFeedback,
      topIntents,
      averageConfidence
    ] = await Promise.all([
      prisma.conversationLog.count({ where }),
      prisma.conversationLog.count({ 
        where: { ...where, rasaConfidence: { lte: 0.6 } } 
      }),
      prisma.conversationLog.count({ 
        where: { ...where, rasaConfidence: { gte: 0.8 } } 
      }),
      prisma.conversationLog.count({ 
        where: { ...where, feedback: { some: {} } } 
      }),
      prisma.conversationLog.groupBy({
        by: ['rasaIntent'],
        where,
        _count: { rasaIntent: true },
        orderBy: { _count: { rasaIntent: 'desc' } },
        take: 10
      }),
      prisma.conversationLog.aggregate({
        where,
        _avg: { rasaConfidence: true }
      })
    ]);

    console.log('✅ Statistics calculated successfully:', {
      totalLogs,
      lowConfidenceLogs,
      highConfidenceLogs,
      logsWithFeedback,
      averageConfidence: averageConfidence._avg.rasaConfidence
    });

    return {
      totalLogs,
      lowConfidenceLogs,
      highConfidenceLogs,
      logsWithFeedback,
      averageConfidence: averageConfidence._avg.rasaConfidence || 0,
      topIntents: topIntents.map(item => ({
        intent: item.rasaIntent,
        count: item._count.rasaIntent
      }))
    };
  } catch (error) {
    console.error('❌ Error calculating conversation statistics:', error);
    throw error;
  }
}

function convertToRasaFormat(logs: any[]): string {
  const intentGroups: Record<string, string[]> = {};
  
  for (const log of logs) {
    if (!log.rasaIntent) continue;
    
    if (!intentGroups[log.rasaIntent]) {
      intentGroups[log.rasaIntent] = [];
    }
    
    let example = log.userMessage;
    if (log.rasaEntities && log.rasaEntities.length > 0) {
      // Add entity annotations
      const sortedEntities = log.rasaEntities.sort((a: any, b: any) => b.start - a.start);
      for (const entity of sortedEntities) {
        const before = example.substring(0, entity.start);
        const after = example.substring(entity.end);
        example = `${before}[${entity.value}](${entity.entity})${after}`;
      }
    }
    
    intentGroups[log.rasaIntent].push(`    - ${example}`);
  }

  let yaml = 'version: "3.1"\n\nnlu:\n';
  
  for (const [intent, examples] of Object.entries(intentGroups)) {
    yaml += `- intent: ${intent}\n  examples: |\n`;
    yaml += examples.join('\n') + '\n\n';
  }
  
  return yaml;
}
