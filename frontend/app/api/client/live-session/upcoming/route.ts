import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/client/live-session/upcoming - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    // Get upcoming live sessions for the user
    // For now, we'll return mock data
    // In a real implementation, this would come from a LiveSession table
    const upcomingSessions = [
      {
        id: 'session-1',
        title: 'Spiritual Guidance Session',
        description: 'One-on-one spiritual guidance and consultation',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
        duration: 60,
        status: 'scheduled' as const,
        participants: 1,
        maxParticipants: 2
      },
      {
        id: 'session-2',
        title: 'Group Meditation Session',
        description: 'Guided group meditation and spiritual discussion',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // 25 hours from now
        duration: 90,
        status: 'scheduled' as const,
        participants: 3,
        maxParticipants: 8
      },
      {
        id: 'session-3',
        title: 'Live Q&A Session',
        description: 'Ask questions and receive spiritual guidance',
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
        duration: 60,
        status: 'live' as const,
        participants: 5,
        maxParticipants: 10
      }
    ];

    return NextResponse.json({
      success: true,
      data: upcomingSessions
    });

  } catch (error) {
    console.error('❌ Error in GET /api/client/live-session/upcoming:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to load upcoming sessions'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
