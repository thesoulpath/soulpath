import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Zod schema for booking creation
const createBookingSchema = z.object({
  scheduleSlotId: z.number().int().positive('Schedule slot ID must be positive'),
  userPackageId: z.number().int().positive('User package ID must be positive'),
  sessionType: z.string().min(1, 'Session type is required').default('Session'),
  notes: z.string().optional()
});

const querySchema = z.object({
  status: z.enum(['upcoming', 'past', 'all']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/client/bookings - Starting request...');
    
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

    const { status, page, limit } = validation.data;
    const offset = (page - 1) * limit;

    console.log('🔍 Query parameters:', { status, page, limit });

    // Build the query with proper relationships
    const where: any = {
      userId: user.id
    };

    // Filter by status
    if (status === 'upcoming') {
      where.scheduleSlot = {
        startTime: { gte: new Date() }
      };
      where.status = 'confirmed';
    } else if (status === 'past') {
      where.scheduleSlot = {
        startTime: { lt: new Date() }
      };
      where.status = 'completed';
    }

    // Get bookings with enhanced relationships
    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          sessionType: true,
          status: true,
          notes: true,
          cancelledReason: true,
          reminderSent: true,
          createdAt: true,
          updatedAt: true,
          scheduleSlot: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              capacity: true,
              bookedCount: true,
              scheduleTemplate: {
                select: {
                  dayOfWeek: true,
                  sessionDuration: {
                    select: {
                      name: true,
                      duration_minutes: true
                    }
                  }
                }
              }
            }
          },
          userPackage: {
            select: {
              id: true,
              quantity: true,
              sessionsUsed: true,
              isActive: true,
              expiresAt: true,
              packagePrice: {
                select: {
                  price: true,
                  pricingMode: true,
                  packageDefinition: {
                    select: {
                      name: true,
                      description: true,
                      sessionsCount: true,
                      packageType: true
                    }
                  },
                  currency: {
                    select: {
                      code: true,
                      symbol: true
                    }
                  }
                }
              }
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: [
          { scheduleSlot: { startTime: status === 'upcoming' ? 'asc' : 'desc' } }
        ]
      }),
      prisma.booking.count({ where })
    ]);

    console.log('✅ Database query successful, found', bookings.length, 'bookings');

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      },
      message: 'Bookings fetched successfully'
    });

  } catch (error) {
    console.error('❌ Error in GET /api/client/bookings:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: 'Failed to fetch bookings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/client/bookings - Starting request...');
    
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
    const validation = createBookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid booking data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { scheduleSlotId, userPackageId, sessionType, notes } = validation.data;

    // Verify the user owns the package and it's active
    const userPackage = await prisma.userPackage.findFirst({
      where: {
        id: userPackageId,
        userId: user.id,
        isActive: true
      },
      include: {
        packagePrice: {
          include: {
            packageDefinition: {
              select: {
                sessionsCount: true
              }
            }
          }
        }
      }
    });

    if (!userPackage) {
      return NextResponse.json({
        success: false,
        error: 'Invalid package',
        message: 'Package not found or not active'
      }, { status: 400 });
    }

    // Check if user has remaining sessions
    const totalSessions = userPackage.packagePrice.packageDefinition.sessionsCount * (userPackage.quantity || 1);
    const remainingSessions = totalSessions - (userPackage.sessionsUsed || 0);

    if (remainingSessions <= 0) {
      return NextResponse.json({
        success: false,
        error: 'No sessions remaining',
        message: 'You have no sessions remaining in this package'
      }, { status: 400 });
    }

    // Verify the schedule slot is available
    const scheduleSlot = await prisma.scheduleSlot.findFirst({
      where: {
        id: scheduleSlotId,
        isAvailable: true
      }
    });

    if (!scheduleSlot) {
      return NextResponse.json({
        success: false,
        error: 'Invalid schedule slot',
        message: 'Schedule slot not found or not available'
      }, { status: 400 });
    }

    // Check if slot has capacity
    if (scheduleSlot.bookedCount && scheduleSlot.capacity && scheduleSlot.bookedCount >= scheduleSlot.capacity) {
      return NextResponse.json({
        success: false,
        error: 'Slot full',
        message: 'This time slot is already full'
      }, { status: 400 });
    }

    // Create the booking and update counts in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the booking
      const booking = await tx.booking.create({
        data: {
          userId: user.id,
          userPackageId: userPackageId,
          scheduleSlotId: scheduleSlotId,
          sessionType: sessionType,
          notes: notes,
          status: 'confirmed'
        },
        include: {
          scheduleSlot: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              scheduleTemplate: {
                select: {
                  dayOfWeek: true,
                  sessionDuration: {
                    select: {
                      name: true,
                      duration_minutes: true
                    }
                  }
                }
              }
            }
          },
          userPackage: {
            select: {
              id: true,
              sessionsUsed: true,
              packagePrice: {
                select: {
                  packageDefinition: {
                    select: {
                      name: true,
                      sessionsCount: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Update user package sessions used
      await tx.userPackage.update({
        where: { id: userPackageId },
        data: { sessionsUsed: { increment: 1 } }
      });

      // Update schedule slot booked count
      await tx.scheduleSlot.update({
        where: { id: scheduleSlotId },
        data: { bookedCount: { increment: 1 } }
      });

      return booking;
    });

    console.log('✅ Booking created successfully');

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Booking created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error in POST /api/client/bookings:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: 'Failed to create booking',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
