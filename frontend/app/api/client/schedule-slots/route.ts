import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const querySchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  isAvailable: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/client/schedule-slots - Starting request...');
    
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

    const { dateFrom, dateTo, isAvailable, page, limit } = validation.data;
    const offset = (page - 1) * limit;

    console.log('🔍 Query parameters:', { dateFrom, dateTo, isAvailable, page, limit });

    // Build the query with proper relationships
    const where: Record<string, unknown> = {
      isAvailable: true // Only show available slots to clients
    };

    if (dateFrom) {
      where.startTime = { gte: new Date(dateFrom) };
    }
    if (dateTo) {
      where.startTime = {
        ...(where.startTime || {}),
        lte: new Date(dateTo)
      };
    }
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }

    // Only show future slots
    where.startTime = {
      ...(where.startTime || {}),
      gte: new Date()
    };

    // Get schedule slots with enhanced relationships
    const [scheduleSlots, totalCount] = await Promise.all([
      prisma.scheduleSlot.findMany({
        where,
        select: {
          id: true,
          startTime: true,
          endTime: true,
          capacity: true,
          bookedCount: true,
          isAvailable: true,
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
          },
          _count: {
            select: {
              bookings: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { startTime: 'asc' }
      }),
      prisma.scheduleSlot.count({ where })
    ]);

    console.log('✅ Database query successful, found', scheduleSlots.length, 'schedule slots');

    // Transform the data for client consumption
    const transformedSlots = scheduleSlots.map(slot => ({
      id: slot.id.toString(),
      date: slot.startTime.toISOString().split('T')[0],
      time: slot.startTime.toTimeString().split(' ')[0].substring(0, 5),
      isAvailable: slot.isAvailable && (slot.bookedCount || 0) < (slot.capacity || 1),
      capacity: slot.capacity || 1,
      bookedCount: slot.bookedCount || 0,
      sessionType: slot.scheduleTemplate.sessionDuration?.name || 'Session',
      price: 0, // Will be set based on package selection
      duration: slot.scheduleTemplate.sessionDuration?.duration_minutes || 60,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString()
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: transformedSlots,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /api/client/schedule-slots:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch schedule slots',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
