import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/schedule-slots - Fetching available schedule slots...');

    const { searchParams } = new URL(request.url);
    const availableOnly = searchParams.get('available') === 'true';
    const date = searchParams.get('date');

    // Build cache key based on parameters
    const cacheKey = `schedule_slots_${availableOnly}_${date || 'all'}`;

    // Use caching for schedule slots (shorter TTL since availability changes)
    const slots = await withCache(
      cacheKey,
      async () => {
        // Build where clause
        const whereClause: Record<string, unknown> = {};

        if (availableOnly) {
          whereClause.isAvailable = true;
          // Only show slots that haven't reached capacity
          // Prisma cannot compare two columns in a filter; we'll filter in JS below
        }

        if (date) {
          const startOfDay = new Date(date);
          const endOfDay = new Date(date);
          endOfDay.setDate(endOfDay.getDate() + 1);

          whereClause.startTime = {
            gte: startOfDay,
            lt: endOfDay
          };
        }

        // Fetch schedule slots with optimized query
        const raw = await prisma.scheduleSlot.findMany({
          where: whereClause,
          select: {
            id: true,
            startTime: true,
            endTime: true,
            capacity: true,
            bookedCount: true,
            isAvailable: true,
            scheduleTemplate: {
              select: {
                sessionDuration: {
                  select: {
                    name: true,
                    duration_minutes: true
                  }
                }
              }
            }
          },
          orderBy: [
            { startTime: 'asc' }
          ]
        });

        return availableOnly
          ? raw.filter((slot: { capacity: number | null; bookedCount: number | null; isAvailable: boolean }) => {
              const capacity = slot.capacity as number | null;
              const booked = (slot.bookedCount as number | null) ?? 0;
              return slot.isAvailable && (capacity === null || booked < capacity);
            })
          : raw;
      },
      2 * 60 * 1000 // Cache for 2 minutes (availability changes frequently)
    );

    // Transform the data to match the expected format
    const transformedSlots = slots.map((slot: {
      id: number;
      startTime: Date;
      endTime: Date;
      capacity: number | null;
      bookedCount: number | null;
      isAvailable: boolean;
      scheduleTemplate: {
        sessionDuration: { name: string | null; duration_minutes: number | null } | null
      } | null;
    }) => ({
      id: slot.id,
      date: slot.startTime.toISOString().split('T')[0], // Format as YYYY-MM-DD
      time: slot.startTime.toTimeString().split(' ')[0].substring(0, 5), // Format as HH:MM
      isAvailable: slot.isAvailable && (slot.capacity === null || (slot.bookedCount || 0) < slot.capacity),
      capacity: slot.capacity,
      bookedCount: slot.bookedCount || 0,
      duration: slot.scheduleTemplate?.sessionDuration?.duration_minutes || 60,
      sessionType: slot.scheduleTemplate?.sessionDuration?.name || 'Standard Session'
    }));

    console.log(`✅ Found ${transformedSlots.length} schedule slots`);

    return NextResponse.json({
      success: true,
      slots: transformedSlots
    });

  } catch (error) {
    console.error('❌ Error in GET /api/schedule-slots:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch schedule slots',
      message: 'An error occurred while fetching schedule slots'
    }, { status: 500 });
  }
}
