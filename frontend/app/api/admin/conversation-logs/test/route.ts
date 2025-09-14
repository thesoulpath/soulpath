import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test endpoint to demonstrate conversation logs functionality
export async function GET() {
  try {
    // Get some sample conversation logs (without auth for testing)
    const logs = await prisma.conversationLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        userId: true,
        userMessage: true,
        botResponse: true,
        rasaIntent: true,
        rasaConfidence: true,
        timestamp: true,
        responseGenerator: true,
        feedback: {
          select: {
            rating: true,
            comment: true
          }
        }
      }
    });

    const stats = await prisma.conversationLog.aggregate({
      _count: { id: true },
      _avg: { rasaConfidence: true }
    });

    const lowConfidenceCount = await prisma.conversationLog.count({
      where: { rasaConfidence: { lte: 0.6 } }
    });

    const highConfidenceCount = await prisma.conversationLog.count({
      where: { rasaConfidence: { gte: 0.8 } }
    });

    const feedbackCount = await prisma.conversationLog.count({
      where: { feedback: { some: {} } }
    });

    return NextResponse.json({
      success: true,
      message: "Conversation logs test endpoint",
      data: {
        sampleLogs: logs,
        statistics: {
          totalLogs: stats._count.id,
          averageConfidence: stats._avg.rasaConfidence || 0,
          lowConfidenceLogs: lowConfidenceCount,
          highConfidenceLogs: highConfidenceCount,
          logsWithFeedback: feedbackCount
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
