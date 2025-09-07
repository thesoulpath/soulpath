import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { conversationLogId, sessionId, rating, comment } = await request.json();

    if (!conversationLogId || !sessionId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationLogId, sessionId, rating' },
        { status: 400 }
      );
    }

    if (rating !== 1 && rating !== 2) {
      return NextResponse.json(
        { error: 'Rating must be 1 (negative) or 2 (positive)' },
        { status: 400 }
      );
    }

    // Verify conversation log exists
    const conversationLog = await prisma.conversationLog.findUnique({
      where: { id: conversationLogId }
    });

    if (!conversationLog) {
      return NextResponse.json(
        { error: 'Conversation log not found' },
        { status: 404 }
      );
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.userFeedback.findFirst({
      where: {
        conversationLogId: conversationLogId
      }
    });

    let feedback;
    if (existingFeedback) {
      // Update existing feedback
      feedback = await prisma.userFeedback.update({
        where: { id: existingFeedback.id },
        data: {
          rating,
          comment: comment || null,
          reviewedForTraining: false
        }
      });
    } else {
      // Create new feedback
      feedback = await prisma.userFeedback.create({
        data: {
          conversationLogId,
          sessionId,
          rating,
          comment: comment || null,
          reviewedForTraining: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: feedback.id
    });

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const conversationLogId = searchParams.get('conversation_log_id');

    if (!sessionId && !conversationLogId) {
      return NextResponse.json(
        { error: 'Either sessionId or conversationLogId is required' },
        { status: 400 }
      );
    }

    const feedback = await prisma.userFeedback.findMany({
      where: {
        ...(sessionId ? { sessionId } : {}),
        ...(conversationLogId ? { conversationLogId: parseInt(conversationLogId) } : {})
      },
      include: {
        conversationLog: {
          select: {
            userMessage: true,
            botResponse: true,
            timestamp: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      feedback: feedback.map(f => ({
        id: f.id,
        conversationLogId: f.conversationLogId,
        sessionId: f.sessionId,
        rating: f.rating,
        comment: f.comment,
        createdAt: f.createdAt,
        reviewedForTraining: f.reviewedForTraining,
        conversation: f.conversationLog
      }))
    });

  } catch (error) {
    console.error('Feedback GET API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
