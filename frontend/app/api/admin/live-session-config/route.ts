import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Zod schema for live session configuration
const liveSessionConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  provider: z.enum(['zoom', 'meet', 'teams', 'weebly', 'custom']),
  apiKey: z.string().min(1, 'API key is required'),
  apiSecret: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  isActive: z.boolean().default(false),
  settings: z.object({
    allowVideo: z.boolean().default(true),
    allowAudio: z.boolean().default(true),
    allowChat: z.boolean().default(true),
    allowScreenShare: z.boolean().default(true),
    maxParticipants: z.number().int().min(1).max(100).default(10),
    recordingEnabled: z.boolean().default(false),
    autoStart: z.boolean().default(false),
    waitingRoom: z.boolean().default(true),
    muteOnEntry: z.boolean().default(false)
  }),
  weeblySettings: z.object({
    siteId: z.string().optional(),
    appId: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    redirectUri: z.string().url().optional(),
    scope: z.array(z.string()).default(['read:site', 'write:site'])
  }).optional()
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/live-session-config - Starting request...');
    
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

    // For now, return mock configuration
    // In a real implementation, this would come from a LiveSessionConfig table
    const config = {
      id: 'live-session-config-1',
      name: 'SoulPath Live Sessions',
      provider: 'zoom',
      apiKey: process.env.ZOOM_API_KEY || '',
      apiSecret: process.env.ZOOM_API_SECRET || '',
      webhookUrl: process.env.WEBHOOK_URL || '',
      isActive: true,
      settings: {
        allowVideo: true,
        allowAudio: true,
        allowChat: true,
        allowScreenShare: true,
        maxParticipants: 10,
        recordingEnabled: true,
        autoStart: false,
        waitingRoom: true,
        muteOnEntry: false
      },
      weeblySettings: {
        siteId: process.env.WEEBBLY_SITE_ID || '',
        appId: process.env.WEEBBLY_APP_ID || '',
        clientId: process.env.WEEBBLY_CLIENT_ID || '',
        clientSecret: process.env.WEEBBLY_CLIENT_SECRET || '',
        redirectUri: process.env.WEEBBLY_REDIRECT_URI || '',
        scope: ['read:site', 'write:site', 'read:blog', 'write:blog']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('❌ Error in GET /api/admin/live-session-config:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to load live session configuration'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/admin/live-session-config - Starting request...');
    
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

    const body = await request.json();
    const validation = liveSessionConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid configuration data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const configData = validation.data;

    // In a real implementation, this would save to a LiveSessionConfig table
    // For now, we'll just return the validated data
    const savedConfig = {
      id: 'live-session-config-1',
      ...configData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('✅ Live session configuration saved');

    return NextResponse.json({
      success: true,
      data: savedConfig,
      message: 'Configuration saved successfully'
    });

  } catch (error) {
    console.error('❌ Error in POST /api/admin/live-session-config:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to save configuration'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
