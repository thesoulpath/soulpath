import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const querySchema = z.object({
  isAvailable: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(10).default(5)
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/chat/schedule-slots - Starting request...');
    
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

    const { isAvailable, limit } = validation.data;

    console.log('🔍 Query parameters:', { isAvailable, limit });

    // Build the query with proper relationships
    const where: Record<string, unknown> = {
      isAvailable: true // Only show available slots
    };

    // Only show future slots
    where.startTime = {
      gte: new Date()
    };

    // Get schedule slots with enhanced relationships
    const scheduleSlots = await prisma.scheduleSlot.findMany({
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
      take: limit,
      orderBy: { startTime: 'asc' }
    });

    console.log('✅ Database query successful, found', scheduleSlots.length, 'schedule slots');

    // Transform the data for chatbot consumption
    const transformedSlots = scheduleSlots.map(slot => ({
      id: slot.id.toString(),
      date: slot.startTime.toISOString().split('T')[0],
      time: slot.startTime.toTimeString().split(' ')[0].substring(0, 5),
      isAvailable: slot.isAvailable && (slot.bookedCount || 0) < (slot.capacity || 1),
      capacity: slot.capacity || 1,
      bookedCount: slot.bookedCount || 0,
      sessionType: slot.scheduleTemplate.sessionDuration?.name || 'Session',
      duration: slot.scheduleTemplate.sessionDuration?.duration_minutes || 60,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: transformedSlots
    });

  } catch (error) {
    console.error('❌ Error in GET /api/chat/schedule-slots:', error);
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
