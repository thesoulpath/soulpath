import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/client/live-session/config - Starting request...');
    
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

    // Get live session configuration from database
    // For now, we'll return a mock configuration
    // In a real implementation, this would come from a LiveSessionConfig table
    const config = {
      id: 'live-session-1',
      name: 'SoulPath Live Sessions',
      provider: 'zoom' as const,
      apiKey: process.env.ZOOM_API_KEY || '',
      isActive: true,
      settings: {
        allowVideo: true,
        allowAudio: true,
        allowChat: true,
        allowScreenShare: true,
        maxParticipants: 10,
        recordingEnabled: true
      }
    };

    return NextResponse.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('❌ Error in GET /api/client/live-session/config:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to load live session configuration'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
