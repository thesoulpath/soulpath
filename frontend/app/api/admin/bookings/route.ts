import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { replacePlaceholders } from '@/lib/communication/placeholders';

interface BookingWhereClause {
  userId?: string;
  status?: string;
  sessionType?: string;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

interface BookingSelectClause {
  id: boolean;
  userId: boolean;
  userPackageId: boolean;
  scheduleSlotId: boolean;
  sessionType: boolean;
  status: boolean;
  notes: boolean;
  cancelledAt: boolean;
  cancelledReason: boolean;
  reminderSent: boolean;
  reminderSentAt: boolean;
  createdAt: boolean;
  updatedAt: boolean;
  user?: {
    select: {
      id: boolean;
      email: boolean;
      fullName: boolean;
      phone: boolean;
    };
  };
  userPackage?: {
    select: {
      id: boolean;
      packagePrice: {
        select: {
          id: boolean;
          price: boolean;
          pricingMode: boolean;
          packageDefinition: {
            select: {
              id: boolean;
              name: boolean;
              description: boolean;
              sessionsCount: boolean;
              packageType: boolean;
              sessionDuration: {
                select: {
                  name: boolean;
                  duration_minutes: boolean;
                };
              };
            };
          };
          currency: {
            select: {
              symbol: boolean;
              code: boolean;
            };
          };
        };
      };
    };
  };
  scheduleSlot?: {
    select: {
      id: boolean;
      startTime: boolean;
      endTime: boolean;
      scheduleTemplate: {
        select: {
          dayOfWeek: boolean;
          sessionDuration: {
            select: {
              name: boolean;
              duration_minutes: boolean;
            };
          };
        };
      };
    };
  };
}


// Zod schemas for the refactored booking system
const createBookingSchema = z.object({
  userId: z.string().cuid('Invalid user ID format'),
  userPackageId: z.number().int().positive('User package ID must be positive'),
  scheduleSlotId: z.number().int().positive('Schedule slot ID must be positive'),
  sessionType: z.string().min(1, 'Session type is required'),
  notes: z.string().optional(),
  otpCode: z.string().optional(), // OTP code for verification
  phoneNumber: z.string().optional() // Phone number for OTP verification
});

const updateBookingSchema = z.object({
  id: z.number().int().positive('Booking ID must be positive'),
  status: z.enum(['confirmed', 'completed', 'cancelled', 'no-show']).optional(),
  notes: z.string().optional(),
  cancelledReason: z.string().optional(),
  reminderSent: z.boolean().optional()
});

const querySchema = z.object({
  userId: z.string().cuid().optional(),
  status: z.enum(['confirmed', 'completed', 'cancelled', 'no-show']).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sessionType: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  enhanced: z.enum(['true', 'false']).optional()
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/bookings - Starting request...');
    
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

    const { userId, status, dateFrom, dateTo, sessionType, page, limit, enhanced } = validation.data;
    const offset = (page - 1) * limit;

    console.log('🔍 Query parameters:', { userId, status, dateFrom, dateTo, sessionType, page, limit, enhanced });

    // Build the query with proper relationships
    const where: BookingWhereClause = {};
    
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (sessionType) where.sessionType = sessionType;
    if (dateFrom) where.createdAt = { gte: new Date(`${dateFrom}T00:00:00Z`) };
    if (dateTo) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(`${dateTo}T23:59:59Z`)
      };
    }

    // Base select fields
    const select: BookingSelectClause = {
      id: true,
      userId: true,
      userPackageId: true,
      scheduleSlotId: true,
      sessionType: true,
      status: true,
      notes: true,
      cancelledAt: true,
      cancelledReason: true,
      reminderSent: true,
      reminderSentAt: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true
        }
      },
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
      }
    };

    // Enhanced mode includes more detailed package information
    if (enhanced === 'true') {
      select.userPackage = {
        select: {
          id: true,
          purchase: {
            select: {
              id: true,
              totalAmount: true,
              paymentStatus: true,
              purchasedAt: true
            }
          },
          packagePrice: {
            select: {
              id: true,
              price: true,
              pricingMode: true,
              packageDefinition: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  sessionsCount: true,
                  packageType: true,
                  sessionDuration: {
                    select: {
                      name: true,
                      duration_minutes: true
                    }
                  }
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
      } as any;
    } else {
      select.userPackage = {
        select: {
          id: true,
          isActive: true as any,
          packagePrice: {
            select: {
              id: true,
              price: true,
              pricingMode: true,
              packageDefinition: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  sessionsCount: true,
                  packageType: true,
                  sessionDuration: {
                    select: {
                      name: true,
                      duration_minutes: true
                    }
                  }
                }
              },
              currency: {
                select: {
                  symbol: true,
                  code: true
                }
              }
            }
          }
        }
      } as any;
    }

    console.log('🔍 Executing database query...');
    
    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        select,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.booking.count({ where })
    ]);

    console.log('✅ Database query successful, found', bookings?.length || 0, 'bookings');

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in bookings API:', error);
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
    const validation = createBookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid booking data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { userId, userPackageId, scheduleSlotId, sessionType, notes, otpCode, phoneNumber } = validation.data;

    // Verify user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: 'The specified user does not exist'
      }, { status: 404 });
    }

    // Verify OTP if provided
    if (otpCode && phoneNumber) {
      const otpVerification = await prisma.otpVerification.findFirst({
        where: {
          phoneNumber,
          otpCode,
          isVerified: true,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!otpVerification) {
        return NextResponse.json({
          success: false,
          error: 'Invalid OTP',
          message: 'OTP code is invalid or has expired'
        }, { status: 400 });
      }
    }

    // Check if schedule slot exists and has capacity
    const scheduleSlot = await prisma.scheduleSlot.findUnique({
      where: { id: scheduleSlotId },
      include: {
        scheduleTemplate: {
          include: {
            sessionDuration: true
          }
        }
      }
    });

    if (!scheduleSlot) {
      return NextResponse.json({
        success: false,
        error: 'Schedule slot not found',
        message: 'The specified schedule slot does not exist'
      }, { status: 404 });
    }

    if (!scheduleSlot.isAvailable) {
      return NextResponse.json({
        success: false,
        error: 'Slot unavailable',
        message: 'This schedule slot is not available for booking'
      }, { status: 400 });
    }

    if ((scheduleSlot.bookedCount || 0) >= (scheduleSlot.capacity || 0)) {
      return NextResponse.json({
        success: false,
        error: 'Slot full',
        message: 'This schedule slot has no remaining capacity'
      }, { status: 400 });
    }

    // Check if user package exists and has remaining sessions
    const userPackage = await prisma.userPackage.findUnique({
      where: { id: userPackageId },
      include: {
        packagePrice: {
          include: {
            packageDefinition: {
              include: {
                sessionDuration: true
              }
            }
          }
        }
      }
    });

    if (!userPackage) {
      return NextResponse.json({
        success: false,
        error: 'User package not found',
        message: 'The specified user package does not exist'
      }, { status: 404 });
    }

    if (!userPackage.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Package inactive',
        message: 'This user package is not active'
      }, { status: 400 });
    }

    // Check if user package belongs to the specified user
    if (userPackage.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Package mismatch',
        message: 'This user package does not belong to the specified user'
      }, { status: 400 });
    }

    // Calculate remaining sessions
    const totalSessions = userPackage.packagePrice.packageDefinition.sessionsCount * (userPackage.quantity || 1);
    const remainingSessions = totalSessions - (userPackage.sessionsUsed || 0);

    if (remainingSessions <= 0) {
      return NextResponse.json({
        success: false,
        error: 'No sessions remaining',
        message: 'This user package has no remaining sessions'
      }, { status: 400 });
    }

    console.log('📅 Creating booking for user:', userId, 'package:', userPackageId, 'slot:', scheduleSlotId);

    // Create booking and update counts in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the booking
      const booking = await tx.booking.create({
        data: {
          userId,
          userPackageId,
          scheduleSlotId,
          sessionType,
          notes,
          status: 'confirmed'
        }
      });

      // Update user package sessions used
      await tx.userPackage.update({
        where: { id: userPackageId },
        data: {
          sessionsUsed: (userPackage.sessionsUsed || 0) + 1
        }
      });

      // Update schedule slot booked count
      await tx.scheduleSlot.update({
        where: { id: scheduleSlotId },
        data: {
          bookedCount: (scheduleSlot.bookedCount || 0) + 1
        }
      });

      return booking;
    });

    // Fetch complete booking data to return
    const completeBooking = await prisma.booking.findUnique({
      where: { id: result.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true
          }
        },
        userPackage: {
          include: {
            packagePrice: {
              include: {
                packageDefinition: {
                  include: {
                    sessionDuration: true
                  }
                }
              }
            }
          }
        },
        scheduleSlot: {
          include: {
            scheduleTemplate: {
              include: {
                sessionDuration: true
              }
            }
          }
        }
      }
    });

    // Send booking confirmation using communication templates
    try {
      // Get booking confirmation template
      const bookingTemplate = await prisma.communicationTemplate.findFirst({
        where: {
          templateKey: 'booking_confirmation',
          type: 'email',
          isActive: true
        },
        include: {
          translations: true
        }
      });

      if (bookingTemplate && targetUser.email && completeBooking) {
        // Prepare template data
        const templateData = {
          userName: targetUser.fullName || 'User',
          userEmail: targetUser.email || '',
          bookingId: completeBooking.id.toString(),
          language: targetUser.language || 'English',
          adminEmail: 'admin@soulpath.lat',
          submissionDate: new Date().toLocaleDateString(),
          birthDate: targetUser.birthDate?.toISOString().split('T')[0] || '',
          birthTime: targetUser.birthTime?.toString().substring(0, 5) || '',
          birthPlace: targetUser.birthPlace || '',
          clientQuestion: notes || 'No specific question provided',
          bookingDate: completeBooking.scheduleSlot.scheduleTemplate.dayOfWeek,
          bookingTime: completeBooking.scheduleSlot.startTime,
          sessionType: sessionType
        };

        // Get the appropriate translation
        const userLanguage = targetUser.language?.toLowerCase() || 'en';
        const translation = bookingTemplate.translations.find(t => 
          t.language === userLanguage
        ) || bookingTemplate.translations[0];

        if (translation) {
          // Replace placeholders in subject and content
          const subject = replacePlaceholders(translation.subject || '', templateData);
          const content = replacePlaceholders(translation.content || '', templateData);

          // TODO: Send email using your email service
          console.log('📧 Admin booking confirmation email prepared:', {
            to: targetUser.email,
            subject,
            content: content.substring(0, 100) + '...'
          });
        }
      }
    } catch (templateError) {
      console.error('Error sending booking confirmation:', templateError);
      // Don't fail the booking creation if template sending fails
    }

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      data: completeBooking
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating booking:', error);
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

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateBookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid booking update data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { id, ...updateData } = validation.data;

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        userPackage: {
          select: {
            id: true,
            sessionsUsed: true
          }
        },
        scheduleSlot: {
          select: {
            id: true,
            bookedCount: true
          }
        }
      }
    });

    if (!existingBooking) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found',
        message: 'The specified booking does not exist'
      }, { status: 404 });
    }

    // Handle cancellation
    if (updateData.status === 'cancelled' && existingBooking.status !== 'cancelled') {
      // Restore session to user package and decrement slot count in transaction
      await prisma.$transaction(async (tx) => {
        // Update user package sessions used
        if (existingBooking.userPackage) {
          await tx.userPackage.update({
            where: { id: existingBooking.userPackage.id },
            data: { sessionsUsed: { decrement: 1 } }
          });
        }

        // Decrement schedule slot booked count
        if (existingBooking.scheduleSlot) {
          await tx.scheduleSlot.update({
            where: { id: existingBooking.scheduleSlot.id },
            data: { bookedCount: { decrement: 1 } }
          });
        }
      });
    }

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: updateData.status,
        notes: updateData.notes,
        cancelledReason: updateData.cancelledReason,
        reminderSent: updateData.reminderSent
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        },
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

    console.log('✅ Booking updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing ID',
        message: 'Booking ID is required'
      }, { status: 400 });
    }

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: {
        userPackage: {
          select: {
            id: true,
            sessionsUsed: true
          }
        },
        scheduleSlot: {
          select: {
            id: true,
            bookedCount: true
          }
        }
      }
    });

    if (!existingBooking) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found',
        message: 'The specified booking does not exist'
      }, { status: 404 });
    }

    // Delete the booking and restore session counts in transaction
    await prisma.$transaction(async (tx) => {
      // Restore session to user package if not already cancelled
      if (existingBooking.userPackage && existingBooking.status !== 'cancelled') {
        await tx.userPackage.update({
          where: { id: existingBooking.userPackage.id },
          data: { sessionsUsed: { decrement: 1 } }
        });
      }

      // Decrement schedule slot booked count if not already cancelled
      if (existingBooking.scheduleSlot && existingBooking.status !== 'cancelled') {
        await tx.scheduleSlot.update({
          where: { id: existingBooking.scheduleSlot.id },
          data: { bookedCount: { decrement: 1 } }
        });
      }

      // Delete the booking
      await tx.booking.delete({
        where: { id: parseInt(id) }
      });
    });

    console.log('✅ Booking deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
