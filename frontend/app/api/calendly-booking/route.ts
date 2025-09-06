import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Zod schema for Calendly-style booking
const calendlyBookingSchema = z.object({
  packageId: z.number().int('Invalid package ID'),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email address'),
  clientPhone: z.string().min(1, 'Phone number is required'),
  selectedDate: z.string().min(1, 'Date is required'),
  selectedTime: z.string().min(1, 'Time is required'),
  birthDate: z.string().min(1, 'Birth date is required'),
  birthCity: z.string().min(1, 'Birth city is required'),
  message: z.string().optional(),
  paymentMethodId: z.number().int('Payment method is required'),
  language: z.string().default('en')
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/calendly-booking - Starting Calendly-style booking...');
    
    const body = await request.json();
    
    // Validate booking data
    const validation = calendlyBookingSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation error:', validation.error.issues);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Booking data validation failed',
        details: validation.error.issues
      }, { status: 400 });
    }

    const bookingData = validation.data;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: bookingData.clientEmail }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: bookingData.clientEmail,
          fullName: bookingData.clientName,
          phone: bookingData.clientPhone,
          birthDate: new Date(bookingData.birthDate),
          birthPlace: bookingData.birthCity,
          language: bookingData.language,
          role: 'user',
          status: 'active'
        }
      });
      console.log('✅ Created new user:', user.email);
    } else {
      // Update existing user with new information
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: bookingData.clientName,
          phone: bookingData.clientPhone,
          birthDate: new Date(bookingData.birthDate),
          birthPlace: bookingData.birthCity,
          language: bookingData.language
        }
      });
      console.log('✅ Updated existing user:', user.email);
    }

    // Find the selected package
    const packageDefinition = await prisma.packageDefinition.findUnique({
      where: { id: bookingData.packageId },
      include: {
        packagePrices: {
          where: { isActive: true },
          include: {
            currency: true
          }
        },
        sessionDuration: true
      }
    });

    if (!packageDefinition) {
      return NextResponse.json({
        success: false,
        error: 'Package not found',
        message: 'The selected package was not found'
      }, { status: 400 });
    }

    // Find the schedule slot
    const scheduleSlot = await prisma.scheduleSlot.findFirst({
      where: {
        startTime: {
          gte: new Date(`${bookingData.selectedDate}T${bookingData.selectedTime}:00.000Z`),
          lt: new Date(`${bookingData.selectedDate}T${bookingData.selectedTime}:59.999Z`)
        },
        isAvailable: true
      },
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
        message: 'The selected time slot is no longer available'
      }, { status: 400 });
    }

    // Check if slot has capacity
    if (scheduleSlot.capacity && (scheduleSlot.bookedCount || 0) >= scheduleSlot.capacity) {
      return NextResponse.json({
        success: false,
        error: 'Slot full',
        message: 'This time slot is at full capacity'
      }, { status: 400 });
    }

    // Get payment method details
    const paymentMethod = await prisma.paymentMethodConfig.findUnique({
      where: { id: bookingData.paymentMethodId }
    });

    if (!paymentMethod) {
      return NextResponse.json({
        success: false,
        error: 'Payment method not found',
        message: 'The selected payment method was not found'
      }, { status: 400 });
    }

    // Create purchase first
    const packagePrice = packageDefinition.packagePrices[0];
    if (!packagePrice) {
      return NextResponse.json({
        success: false,
        error: 'Package price not found',
        message: 'No active price found for this package'
      }, { status: 400 });
    }

    const purchase = await prisma.purchase.create({
      data: {
        userId: user.id,
        totalAmount: packagePrice.price,
        currencyCode: packagePrice.currency.code,
        paymentMethod: paymentMethod.type || 'custom',
        paymentStatus: 'confirmed'
      }
    });

    // Create user package
    const userPackage = await prisma.userPackage.create({
      data: {
        userId: user.id,
        purchaseId: purchase.id,
        packagePriceId: packagePrice.id,
        quantity: 1,
        isActive: true,
        sessionsUsed: 0
      }
    });

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        userPackageId: userPackage.id,
        scheduleSlotId: scheduleSlot.id,
        sessionType: packageDefinition.name,
        notes: bookingData.message,
        status: 'confirmed'
      },
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
                },
                currency: true
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

    // Update schedule slot booked count
    await prisma.scheduleSlot.update({
      where: { id: scheduleSlot.id },
      data: { bookedCount: { increment: 1 } }
    });

    console.log('✅ Calendly-style booking created successfully:', booking.id);

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: booking.id,
        user: booking.user,
        package: booking.userPackage.packagePrice.packageDefinition,
        schedule: {
          date: booking.scheduleSlot.startTime.toISOString().split('T')[0],
          time: booking.scheduleSlot.startTime.toTimeString().split(' ')[0].substring(0, 5),
          duration: booking.scheduleSlot.scheduleTemplate.sessionDuration?.duration_minutes || 60
        },
        totalPrice: booking.userPackage.packagePrice.price,
        currency: booking.userPackage.packagePrice.currency.symbol
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error in POST /api/calendly-booking:', error);
    return NextResponse.json({
      success: false,
      error: 'Booking creation failed',
      message: 'An error occurred while creating the booking'
    }, { status: 500 });
  }
}
