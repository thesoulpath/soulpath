import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelVersion = searchParams.get('model_version');
    const dateRange = searchParams.get('date_range') || '30'; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));

    // Get model performance data
    const modelPerformance = await prisma.mlModelPerformance.findMany({
      where: modelVersion ? { modelVersion } : undefined,
      orderBy: { createdAt: 'desc' }
    });

    // Get conversation statistics
    const conversationStats = await prisma.conversationLog.groupBy({
      by: ['rasaIntent', 'responseGenerator'],
      where: {
        timestamp: { gte: startDate },
        ...(modelVersion ? { modelVersion } : {})
      },
      _count: { id: true },
      _avg: { rasaConfidence: true }
    });

    // Get booking success metrics
    const bookingStats = await prisma.conversationLog.groupBy({
      by: ['bookingStep'],
      where: {
        timestamp: { gte: startDate },
        ...(modelVersion ? { modelVersion } : {})
      },
      _count: { id: true }
    });

    // Get user feedback summary
    const feedbackStats = await prisma.userFeedback.groupBy({
      by: ['rating'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: { id: true }
    });

    // Get A/B test results
    const abTestResults = await prisma.abTestExperiment.findMany({
      where: {
        status: { in: ['active', 'completed'] },
        startDate: { gte: startDate }
      },
      include: {
        assignments: true
      }
    });

    // Calculate key metrics
    const totalConversations = conversationStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const avgConfidence = conversationStats.reduce((sum, stat) => 
      sum + (Number(stat._avg.rasaConfidence) || 0) * stat._count.id, 0) / totalConversations;

    const positiveFeedback = feedbackStats.find(f => f.rating === 2)?._count.id || 0;
    const negativeFeedback = feedbackStats.find(f => f.rating === 1)?._count.id || 0;
    const totalFeedback = positiveFeedback + negativeFeedback;
    const satisfactionRate = totalFeedback > 0 ? positiveFeedback / totalFeedback : 0;

    const bookingCompletions = bookingStats.find(b => b.bookingStep === 'booking_complete')?._count.id || 0;
    const bookingAttempts = bookingStats.find(b => b.bookingStep === 'selecting_package')?._count.id || 0;
    const bookingSuccessRate = bookingAttempts > 0 ? bookingCompletions / bookingAttempts : 0;

    // Response generator distribution
    const responseGeneratorStats = conversationStats.reduce((acc, stat) => {
      const generator = stat.responseGenerator || 'unknown';
      acc[generator] = (acc[generator] || 0) + stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Intent distribution
    const intentStats = conversationStats.reduce((acc, stat) => {
      const intent = stat.rasaIntent || 'unknown';
      acc[intent] = (acc[intent] || 0) + stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    const analytics = {
      summary: {
        totalConversations,
        avgConfidence: avgConfidence || 0,
        satisfactionRate,
        bookingSuccessRate,
        dateRange: `${dateRange} days`,
        modelVersion: modelVersion || 'all'
      },
      modelPerformance: modelPerformance.map(model => ({
        modelVersion: model.modelVersion,
        accuracy: (model.evaluationResults as any)?.accuracy || 0,
        bookingSuccessRate: model.bookingSuccessRate || 0,
        avgConversationTurns: model.avgConversationTurns || 0,
        isActiveProduction: model.isActiveProduction,
        isActiveAbTest: model.isActiveAbTest,
        deploymentDate: model.deploymentDate,
        createdAt: model.createdAt
      })),
      conversationMetrics: {
        responseGeneratorDistribution: responseGeneratorStats,
        intentDistribution: intentStats,
        bookingStepDistribution: bookingStats.reduce((acc, stat) => {
          acc[stat.bookingStep || 'unknown'] = stat._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      feedbackMetrics: {
        totalFeedback,
        positiveFeedback,
        negativeFeedback,
        satisfactionRate,
        feedbackByRating: feedbackStats.reduce((acc, stat) => {
          acc[stat.rating] = stat._count.id;
          return acc;
        }, {} as Record<number, number>)
      },
      abTestResults: abTestResults.map(experiment => ({
        id: experiment.id,
        experimentName: experiment.experimentName,
        modelAVersion: experiment.modelAVersion,
        modelBVersion: experiment.modelBVersion,
        trafficSplit: experiment.trafficSplit,
        status: experiment.status,
        startDate: experiment.startDate,
        endDate: experiment.endDate,
        totalAssignments: experiment.assignments.length,
        winningModelVersion: experiment.winningModelVersion,
        finalResults: experiment.finalResults
      }))
    };

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
