import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Zod schemas for session duration validation
const createSessionDurationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  duration_minutes: z.number().int().min(15, 'Duration must be at least 15 minutes').max(480, 'Duration cannot exceed 8 hours'),
  description: z.string().optional(),
  is_active: z.boolean().default(true)
});

const updateSessionDurationSchema = createSessionDurationSchema.partial().extend({
  id: z.number().int().positive('Session duration ID must be positive')
});

const querySchema = z.object({
  is_active: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/session-durations - Starting request...');
    
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

    const { is_active, page, limit } = validation.data;
    const offset = (page - 1) * limit;

    console.log('🔍 Query parameters:', { is_active, page, limit });

    // Build the query
    const where: Record<string, unknown> = {};
    if (is_active !== undefined) where.is_active = is_active === 'true';

    console.log('🔍 Executing database query...');
    
    const [sessionDurations, totalCount] = await Promise.all([
      prisma.sessionDuration.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { duration_minutes: 'asc' }
      }),
      prisma.sessionDuration.count({ where })
    ]);

    console.log('✅ Database query successful, found', sessionDurations.length, 'session durations');

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: sessionDurations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in session-durations API:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
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
    const validation = createSessionDurationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid session duration data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const durationData = validation.data;

    // Check if session duration with same name already exists
    const existingDuration = await prisma.sessionDuration.findFirst({
      where: { name: durationData.name }
    });

    if (existingDuration) {
      return NextResponse.json({
        success: false,
        error: 'Session duration already exists',
        message: 'A session duration with this name already exists'
      }, { status: 409 });
    }

    // Create the session duration
    const newSessionDuration = await prisma.sessionDuration.create({
      data: durationData
    });

    return NextResponse.json({
      success: true,
      message: 'Session duration created successfully',
      data: newSessionDuration
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating session duration:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to create session duration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
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
    const validation = updateSessionDurationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid session duration update data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { id, ...updateData } = validation.data;

    // Check if session duration exists
    const existingDuration = await prisma.sessionDuration.findUnique({
      where: { id }
    });

    if (!existingDuration) {
      return NextResponse.json({
        success: false,
        error: 'Session duration not found',
        message: 'Session duration with this ID does not exist'
      }, { status: 404 });
    }

    // Check for name conflicts if name is being updated
    if (updateData.name && updateData.name !== existingDuration.name) {
      const nameConflict = await prisma.sessionDuration.findFirst({
        where: { 
          name: updateData.name,
          id: { not: id }
        }
      });

      if (nameConflict) {
        return NextResponse.json({
          success: false,
          error: 'Name conflict',
          message: 'A session duration with this name already exists'
        }, { status: 409 });
      }
    }

    // Update the session duration
    const updatedSessionDuration = await prisma.sessionDuration.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Session duration updated successfully',
      data: updatedSessionDuration
    });

  } catch (error) {
    console.error('❌ Error updating session duration:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to update session duration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const durationId = searchParams.get('id');

    if (!durationId) {
      return NextResponse.json({
        success: false,
        error: 'Missing ID',
        message: 'Session duration ID is required'
      }, { status: 400 });
    }

    const id = parseInt(durationId);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ID',
        message: 'Session duration ID must be a number'
      }, { status: 400 });
    }

    // Check if session duration exists and has no active schedule templates
    const existingDuration = await prisma.sessionDuration.findUnique({
      where: { id },
      include: {
        scheduleTemplates: {
          where: { isAvailable: true }
        }
      }
    });

    if (!existingDuration) {
      return NextResponse.json({
        success: false,
        error: 'Session duration not found',
        message: 'Session duration with this ID does not exist'
      }, { status: 404 });
    }

    // Check if there are active schedule templates using this duration
    if (existingDuration.scheduleTemplates.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete session duration',
        message: 'Session duration is being used by active schedule templates and cannot be deleted'
      }, { status: 400 });
    }

    // Delete the session duration
    await prisma.sessionDuration.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Session duration deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting session duration:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete session duration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}