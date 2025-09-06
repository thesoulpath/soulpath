import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';


// Zod schemas for schedule slot validation
const createScheduleSlotSchema = z.object({
  scheduleTemplateId: z.number().int().positive('Schedule template ID must be positive'),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format'),
  capacity: z.number().int().positive('Capacity must be positive').default(3),
  bookedCount: z.number().int().min(0, 'Booked count cannot be negative').default(0),
  isAvailable: z.boolean().default(true)
});

const updateScheduleSlotSchema = createScheduleSlotSchema.partial().extend({
  id: z.number().int().positive('Schedule slot ID must be positive')
});

const querySchema = z.object({
  scheduleTemplateId: z.coerce.number().int().positive().optional(),
  isAvailable: z.enum(['true', 'false']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  hasCapacity: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  enhanced: z.enum(['true', 'false']).optional()
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/schedule-slots - Starting request...');
    
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

    const { scheduleTemplateId, isAvailable, dateFrom, dateTo, hasCapacity, page, limit, enhanced } = validation.data;
    const offset = (page - 1) * limit;

    console.log('🔍 Query parameters:', { scheduleTemplateId, isAvailable, dateFrom, dateTo, hasCapacity, page, limit, enhanced });

    // Build the query with proper relationships
    const where: Record<string, unknown> = {};
    
    if (scheduleTemplateId) where.scheduleTemplateId = scheduleTemplateId;
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
    if (dateFrom) where.startTime = { gte: new Date(dateFrom) };
    if (dateTo) {
      where.startTime = {
        ...(where.startTime || {}),
        lte: new Date(dateTo)
      };
    }
    if (hasCapacity === 'true') {
      where.bookedCount = { lt: { capacity: true } };
    } else if (hasCapacity === 'false') {
      where.bookedCount = { gte: { capacity: true } };
    }

    // Base select fields
    const select: Record<string, unknown> = {
      id: true,
      scheduleTemplateId: true,
      startTime: true,
      endTime: true,
      capacity: true,
      bookedCount: true,
      isAvailable: true,
      createdAt: true,
      updatedAt: true,
      scheduleTemplate: {
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          capacity: true,
          sessionDuration: {
            select: {
              id: true,
              name: true,
              duration_minutes: true
            }
          }
        }
      }
    };

    // Enhanced mode includes booking information
    if (enhanced === 'true') {
      select._count = {
        bookings: true
      };
      select.bookings = {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          sessionType: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              fullName: true
            }
          }
        }
      };
    }

    console.log('🔍 Executing database query...');
    
    const [scheduleSlots, totalCount] = await Promise.all([
      prisma.scheduleSlot.findMany({
        where,
        select,
        skip: offset,
        take: limit,
        orderBy: { startTime: 'asc' }
      }),
      prisma.scheduleSlot.count({ where })
    ]);

    console.log('✅ Database query successful, found', scheduleSlots.length, 'schedule slots');

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: scheduleSlots,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in schedule-slots API:', error);
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
    const validation = createScheduleSlotSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid schedule slot data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const slotData = validation.data;

    // Validate time logic
    const startTime = new Date(slotData.startTime);
    const endTime = new Date(slotData.endTime);

    if (startTime >= endTime) {
      return NextResponse.json({
        success: false,
        error: 'Invalid time range',
        message: 'End time must be after start time'
      }, { status: 400 });
    }

    // Verify schedule template exists
    const scheduleTemplate = await prisma.scheduleTemplate.findUnique({
      where: { id: slotData.scheduleTemplateId }
    });

    if (!scheduleTemplate) {
      return NextResponse.json({
        success: false,
        error: 'Schedule template not found',
        message: 'The specified schedule template does not exist'
      }, { status: 404 });
    }

    // Validate capacity
    if (slotData.bookedCount > slotData.capacity) {
      return NextResponse.json({
        success: false,
        error: 'Invalid capacity',
        message: 'Booked count cannot exceed capacity'
      }, { status: 400 });
    }

    // Check for overlapping slots
    const overlappingSlot = await prisma.scheduleSlot.findFirst({
      where: {
        scheduleTemplateId: slotData.scheduleTemplateId,
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime }
          }
        ]
      }
    });

    if (overlappingSlot) {
      return NextResponse.json({
        success: false,
        error: 'Time conflict',
        message: 'This time slot overlaps with an existing slot'
      }, { status: 409 });
    }

    // Create the schedule slot
    const newScheduleSlot = await prisma.scheduleSlot.create({
      data: slotData,
      include: {
        scheduleTemplate: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            capacity: true,
            sessionDuration: {
              select: {
                id: true,
                name: true,
                duration_minutes: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule slot created successfully',
      data: newScheduleSlot
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating schedule slot:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to create schedule slot',
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
    const validation = updateScheduleSlotSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid schedule slot update data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { id, ...updateData } = validation.data;

    // Check if schedule slot exists
    const existingSlot = await prisma.scheduleSlot.findUnique({
      where: { id }
    });

    if (!existingSlot) {
      return NextResponse.json({
        success: false,
        error: 'Schedule slot not found',
        message: 'Schedule slot with this ID does not exist'
      }, { status: 404 });
    }

    // Validate time logic if times are being updated
    if (updateData.startTime || updateData.endTime) {
      const startTime = updateData.startTime ? new Date(updateData.startTime) : existingSlot.startTime;
      const endTime = updateData.endTime ? new Date(updateData.endTime) : existingSlot.endTime;

      if (startTime >= endTime) {
        return NextResponse.json({
          success: false,
          error: 'Invalid time range',
          message: 'End time must be after start time'
        }, { status: 400 });
      }
    }

    // Verify schedule template exists if being updated
    if (updateData.scheduleTemplateId) {
      const scheduleTemplate = await prisma.scheduleTemplate.findUnique({
        where: { id: updateData.scheduleTemplateId }
      });

      if (!scheduleTemplate) {
        return NextResponse.json({
          success: false,
          error: 'Schedule template not found',
          message: 'The specified schedule template does not exist'
        }, { status: 404 });
      }
    }

    // Validate capacity if being updated
    if (updateData.capacity !== undefined || updateData.bookedCount !== undefined) {
      const newCapacity = updateData.capacity ?? existingSlot.capacity;
      const newBookedCount = updateData.bookedCount ?? existingSlot.bookedCount;

      if (newBookedCount && newCapacity && newBookedCount > newCapacity) {
        return NextResponse.json({
          success: false,
          error: 'Invalid capacity',
          message: 'Booked count cannot exceed capacity'
        }, { status: 400 });
      }
    }

    // Check for overlapping slots if time is being updated
    if (updateData.startTime || updateData.endTime) {
      const newStartTime = updateData.startTime ? new Date(updateData.startTime) : existingSlot.startTime;
      const newEndTime = updateData.endTime ? new Date(updateData.endTime) : existingSlot.endTime;
      const newTemplateId = updateData.scheduleTemplateId ?? existingSlot.scheduleTemplateId;

      const overlappingSlot = await prisma.scheduleSlot.findFirst({
        where: {
          scheduleTemplateId: newTemplateId,
          id: { not: id },
          OR: [
            {
              startTime: { lt: newEndTime },
              endTime: { gt: newStartTime }
            }
          ]
        }
      });

      if (overlappingSlot) {
        return NextResponse.json({
          success: false,
          error: 'Time conflict',
          message: 'This time slot overlaps with an existing slot'
        }, { status: 409 });
      }
    }

    // Update the schedule slot
    const updatedScheduleSlot = await prisma.scheduleSlot.update({
      where: { id },
      data: updateData,
      include: {
        scheduleTemplate: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            capacity: true,
            sessionDuration: {
              select: {
                id: true,
                name: true,
                duration_minutes: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule slot updated successfully',
      data: updatedScheduleSlot
    });

  } catch (error) {
    console.error('❌ Error updating schedule slot:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to update schedule slot',
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
    const slotId = searchParams.get('id');

    if (!slotId) {
      return NextResponse.json({
        success: false,
        error: 'Missing ID',
        message: 'Schedule slot ID is required'
      }, { status: 400 });
    }

    const id = parseInt(slotId);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ID',
        message: 'Schedule slot ID must be a number'
      }, { status: 400 });
    }

    // Check if schedule slot exists and has no active bookings
    const existingSlot = await prisma.scheduleSlot.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: { in: ['confirmed', 'pending'] }
          }
        }
      }
    });

    if (!existingSlot) {
      return NextResponse.json({
        success: false,
        error: 'Schedule slot not found',
        message: 'Schedule slot with this ID does not exist'
      }, { status: 404 });
    }

    // Check if there are active bookings
    if (existingSlot.bookings.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete schedule slot',
        message: 'Schedule slot has active bookings and cannot be deleted'
      }, { status: 400 });
    }

    // Delete the schedule slot (cascading will handle related records)
    await prisma.scheduleSlot.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule slot deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting schedule slot:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete schedule slot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
