import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Zod schemas for schedule template validation
const createScheduleTemplateSchema = z.object({
  dayOfWeek: z.string().min(1, 'Day of week is required').max(20, 'Day of week too long'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  capacity: z.number().int().positive('Capacity must be positive').default(3),
  isAvailable: z.boolean().default(true),
  sessionDurationId: z.number().int().positive('Session duration ID must be positive').optional(),
  autoAvailable: z.boolean().default(true)
});

const updateScheduleTemplateSchema = createScheduleTemplateSchema.partial().extend({
  id: z.number().int().positive('Schedule template ID must be positive')
});

const querySchema = z.object({
  dayOfWeek: z.string().optional(),
  isAvailable: z.enum(['true', 'false']).optional(),
  sessionDurationId: z.coerce.number().int().positive().optional(),
  autoAvailable: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  enhanced: z.enum(['true', 'false']).optional()
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/schedule-templates - Starting request...');
    
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

    const { dayOfWeek, isAvailable, sessionDurationId, autoAvailable, page, limit, enhanced } = validation.data;
    const offset = (page - 1) * limit;

    console.log('🔍 Query parameters:', { dayOfWeek, isAvailable, sessionDurationId, autoAvailable, page, limit, enhanced });

    // Build the query with proper relationships
    const where: any = {};
    
    if (dayOfWeek) where.dayOfWeek = dayOfWeek;
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
    if (sessionDurationId) where.sessionDurationId = sessionDurationId;
    if (autoAvailable !== undefined) where.autoAvailable = autoAvailable === 'true';

    // Base select fields
    const select: any = {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      capacity: true,
      isAvailable: true,
      sessionDurationId: true,
      autoAvailable: true,
      createdAt: true,
      updatedAt: true,
      sessionDuration: {
        select: {
          id: true,
          name: true,
          duration_minutes: true,
          description: true
        }
      }
    };

    // Enhanced mode includes slot information
    if (enhanced === 'true') {
      select._count = {
        scheduleSlots: true
      };
      select.scheduleSlots = {
        take: 10,
        orderBy: { startTime: 'desc' },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          capacity: true,
          bookedCount: true,
          isAvailable: true
        }
      };
    }

    console.log('🔍 Executing database query...');
    
    const [scheduleTemplates, totalCount] = await Promise.all([
      prisma.scheduleTemplate.findMany({
        where,
        select,
        skip: offset,
        take: limit,
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      }),
      prisma.scheduleTemplate.count({ where })
    ]);

    console.log('✅ Database query successful, found', scheduleTemplates.length, 'schedule templates');

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: scheduleTemplates,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in schedule-templates API:', error);
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
    const validation = createScheduleTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid schedule template data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const templateData = validation.data;

    // Validate time format and logic
    const startTime = new Date(`2000-01-01T${templateData.startTime}:00`);
    const endTime = new Date(`2000-01-01T${templateData.endTime}:00`);

    if (startTime >= endTime) {
      return NextResponse.json({
        success: false,
        error: 'Invalid time range',
        message: 'End time must be after start time'
      }, { status: 400 });
    }

    // Verify session duration exists if provided
    if (templateData.sessionDurationId) {
      const sessionDuration = await prisma.sessionDuration.findUnique({
        where: { id: templateData.sessionDurationId }
      });

      if (!sessionDuration) {
        return NextResponse.json({
          success: false,
          error: 'Session duration not found',
          message: 'The specified session duration does not exist'
        }, { status: 404 });
      }
    }

    // Check if template already exists for this day and time
    const existingTemplate = await prisma.scheduleTemplate.findFirst({
      where: {
        dayOfWeek: templateData.dayOfWeek,
        startTime: templateData.startTime,
        endTime: templateData.endTime
      }
    });

    if (existingTemplate) {
      return NextResponse.json({
        success: false,
        error: 'Template already exists',
        message: 'A schedule template for this day and time already exists'
      }, { status: 409 });
    }

    // Create the schedule template
    const newScheduleTemplate = await prisma.scheduleTemplate.create({
      data: templateData,
      include: {
        sessionDuration: {
          select: {
            id: true,
            name: true,
            duration_minutes: true,
            description: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule template created successfully',
      data: newScheduleTemplate
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating schedule template:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to create schedule template',
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
    const validation = updateScheduleTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid schedule template update data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { id, ...updateData } = validation.data;

    // Check if schedule template exists
    const existingTemplate = await prisma.scheduleTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return NextResponse.json({
        success: false,
        error: 'Schedule template not found',
        message: 'Schedule template with this ID does not exist'
      }, { status: 404 });
    }

    // Validate time format and logic if times are being updated
    if (updateData.startTime || updateData.endTime) {
      const startTime = new Date(`2000-01-01T${updateData.startTime || existingTemplate.startTime}:00`);
      const endTime = new Date(`2000-01-01T${updateData.endTime || existingTemplate.endTime}:00`);

      if (startTime >= endTime) {
        return NextResponse.json({
          success: false,
          error: 'Invalid time range',
          message: 'End time must be after start time'
        }, { status: 400 });
      }
    }

    // Verify session duration exists if being updated
    if (updateData.sessionDurationId) {
      const sessionDuration = await prisma.sessionDuration.findUnique({
        where: { id: updateData.sessionDurationId }
      });

      if (!sessionDuration) {
        return NextResponse.json({
          success: false,
          error: 'Session duration not found',
          message: 'The specified session duration does not exist'
        }, { status: 404 });
      }
    }

    // Check for conflicts if day/time is being updated
    if (updateData.dayOfWeek || updateData.startTime || updateData.endTime) {
      const newDayOfWeek = updateData.dayOfWeek || existingTemplate.dayOfWeek;
      const newStartTime = updateData.startTime || existingTemplate.startTime;
      const newEndTime = updateData.endTime || existingTemplate.endTime;

      const conflict = await prisma.scheduleTemplate.findFirst({
        where: {
          dayOfWeek: newDayOfWeek,
          startTime: newStartTime,
          endTime: newEndTime,
          id: { not: id }
        }
      });

      if (conflict) {
        return NextResponse.json({
          success: false,
          error: 'Template conflict',
          message: 'A schedule template for this day and time already exists'
        }, { status: 409 });
      }
    }

    // Update the schedule template
    const updatedScheduleTemplate = await prisma.scheduleTemplate.update({
      where: { id },
      data: updateData,
      include: {
        sessionDuration: {
          select: {
            id: true,
            name: true,
            duration_minutes: true,
            description: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule template updated successfully',
      data: updatedScheduleTemplate
    });

  } catch (error) {
    console.error('❌ Error updating schedule template:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to update schedule template',
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
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: 'Missing ID',
        message: 'Schedule template ID is required'
      }, { status: 400 });
    }

    const id = parseInt(templateId);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ID',
        message: 'Schedule template ID must be a number'
      }, { status: 400 });
    }

    // Check if schedule template exists and has no active slots
    const existingTemplate = await prisma.scheduleTemplate.findUnique({
      where: { id },
      include: {
        scheduleSlots: {
          where: {
            OR: [
              { isAvailable: true },
              { bookedCount: { gt: 0 } }
            ]
          }
        }
      }
    });

    if (!existingTemplate) {
      return NextResponse.json({
        success: false,
        error: 'Schedule template not found',
        message: 'Schedule template with this ID does not exist'
      }, { status: 404 });
    }

    // Check if there are active or booked slots
    if (existingTemplate.scheduleSlots.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete schedule template',
        message: 'Schedule template has active or booked slots and cannot be deleted'
      }, { status: 400 });
    }

    // Delete the schedule template (cascading will handle related records)
    await prisma.scheduleTemplate.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule template deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting schedule template:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete schedule template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
