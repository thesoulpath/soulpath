import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';


// Zod schemas for user package validation
const createUserPackageSchema = z.object({
  userId: z.string().cuid('Invalid user ID format'),
  purchaseId: z.number().int().positive('Purchase ID must be positive'),
  packagePriceId: z.number().int().positive('Package price ID must be positive'),
  quantity: z.number().int().positive('Quantity must be positive').default(1),
  sessionsUsed: z.number().int().min(0, 'Sessions used cannot be negative').default(0),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime('Invalid expiry date format').optional()
});

const updateUserPackageSchema = createUserPackageSchema.partial().extend({
  id: z.number().int().positive('User package ID must be positive')
});

const querySchema = z.object({
  userId: z.string().cuid().optional(),
  purchaseId: z.coerce.number().int().positive().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  hasRemainingSessions: z.enum(['true', 'false']).optional(),
  packageType: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  enhanced: z.enum(['true', 'false']).optional()
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/user-packages - Starting request...');
    
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

    const { userId, purchaseId, isActive, hasRemainingSessions, packageType, page, limit, enhanced } = validation.data;
    const offset = (page - 1) * limit;

    console.log('🔍 Query parameters:', { userId, purchaseId, isActive, hasRemainingSessions, packageType, page, limit, enhanced });

    // Build the query with proper relationships
    const where: Record<string, unknown> = {};
    
    if (userId) where.userId = userId;
    if (purchaseId) where.purchaseId = purchaseId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (packageType) {
      where.packagePrice = {
        packageDefinition: {
          packageType: packageType
        }
      };
    }

    // Base select fields
    const select: Record<string, unknown> = {
      id: true,
      userId: true,
      purchaseId: true,
      packagePriceId: true,
      quantity: true,
      sessionsUsed: true,
      isActive: true,
      expiresAt: true,
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
                  id: true,
                  name: true,
                  duration_minutes: true
                }
              }
            }
          },
          currency: {
            select: {
              id: true,
              code: true,
              name: true,
              symbol: true
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
      select.bookingHistory = {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          sessionType: true,
          status: true,
          createdAt: true,
          scheduleSlot: {
            select: {
              id: true,
              startTime: true,
              endTime: true
            }
          }
        }
      };
    }

    console.log('🔍 Executing database query...');
    
    const [userPackages, totalCount] = await Promise.all([
      prisma.userPackage.findMany({
        where,
        select,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.userPackage.count({ where })
    ]);

    console.log('✅ Database query successful, found', userPackages.length, 'user packages');

    // Note: Filtering by remaining sessions is temporarily disabled due to TypeScript type conflicts
    // TODO: Implement proper filtering once type issues are resolved
    const filteredPackages = userPackages;

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: filteredPackages,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in user-packages API:', error);
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
    const validation = createUserPackageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid user package data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const packageData = validation.data;

    // Verify user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: packageData.userId }
    });

    if (!targetUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: 'The specified user does not exist'
      }, { status: 404 });
    }

    // Verify purchase exists
    const purchase = await prisma.purchase.findUnique({
      where: { id: packageData.purchaseId }
    });

    if (!purchase) {
      return NextResponse.json({
        success: false,
        error: 'Purchase not found',
        message: 'The specified purchase does not exist'
      }, { status: 404 });
    }

    // Verify package price exists
    const packagePrice = await prisma.packagePrice.findUnique({
      where: { id: packageData.packagePriceId },
      include: {
        packageDefinition: {
          select: {
            sessionsCount: true
          }
        }
      }
    });

    if (!packagePrice) {
      return NextResponse.json({
        success: false,
        error: 'Package price not found',
        message: 'The specified package price does not exist'
      }, { status: 404 });
    }

    // Validate sessions used
    const totalSessions = packagePrice.packageDefinition.sessionsCount * packageData.quantity;
    if (packageData.sessionsUsed > totalSessions) {
      return NextResponse.json({
        success: false,
        error: 'Invalid sessions used',
        message: 'Sessions used cannot exceed total sessions in package'
      }, { status: 400 });
    }

    // Check if purchase belongs to the user
    if (purchase.userId !== packageData.userId) {
      return NextResponse.json({
        success: false,
        error: 'Purchase mismatch',
        message: 'This purchase does not belong to the specified user'
      }, { status: 400 });
    }

    // Create the user package
    const newUserPackage = await prisma.userPackage.create({
      data: {
        ...packageData,
        expiresAt: packageData.expiresAt ? new Date(packageData.expiresAt) : null
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
                    id: true,
                    name: true,
                    duration_minutes: true
                  }
                }
              }
            },
            currency: {
              select: {
                id: true,
                code: true,
                name: true,
                symbol: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User package created successfully',
      data: newUserPackage
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating user package:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to create user package',
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
    const validation = updateUserPackageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid user package update data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { id, ...updateData } = validation.data;

    // Check if user package exists
    const existingPackage = await prisma.userPackage.findUnique({
      where: { id },
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

    if (!existingPackage) {
      return NextResponse.json({
        success: false,
        error: 'User package not found',
        message: 'User package with this ID does not exist'
      }, { status: 404 });
    }

    // Validate sessions used if being updated
    if (updateData.sessionsUsed !== undefined || updateData.quantity !== undefined) {
      const newQuantity = updateData.quantity ?? existingPackage.quantity;
      const newSessionsUsed = updateData.sessionsUsed ?? existingPackage.sessionsUsed;
      const totalSessions = existingPackage.packagePrice.packageDefinition.sessionsCount * (newQuantity || 1);

      if (newSessionsUsed && newSessionsUsed > totalSessions) {
        return NextResponse.json({
          success: false,
          error: 'Invalid sessions used',
          message: 'Sessions used cannot exceed total sessions in package'
        }, { status: 400 });
      }
    }

    // Verify user exists if being updated
    if (updateData.userId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: updateData.userId }
      });

      if (!targetUser) {
        return NextResponse.json({
          success: false,
          error: 'User not found',
          message: 'The specified user does not exist'
        }, { status: 404 });
      }
    }

    // Verify purchase exists if being updated
    if (updateData.purchaseId) {
      const purchase = await prisma.purchase.findUnique({
        where: { id: updateData.purchaseId }
      });

      if (!purchase) {
        return NextResponse.json({
          success: false,
          error: 'Purchase not found',
          message: 'The specified purchase does not exist'
        }, { status: 404 });
      }
    }

    // Verify package price exists if being updated
    if (updateData.packagePriceId) {
      const packagePrice = await prisma.packagePrice.findUnique({
        where: { id: updateData.packagePriceId }
      });

      if (!packagePrice) {
        return NextResponse.json({
          success: false,
          error: 'Package price not found',
          message: 'The specified package price does not exist'
        }, { status: 404 });
      }
    }

    // Update the user package
    const updatedUserPackage = await prisma.userPackage.update({
      where: { id },
      data: {
        ...updateData,
        expiresAt: updateData.expiresAt ? new Date(updateData.expiresAt) : undefined
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
                    id: true,
                    name: true,
                    duration_minutes: true
                  }
                }
              }
            },
            currency: {
              select: {
                id: true,
                code: true,
                name: true,
                symbol: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User package updated successfully',
      data: updatedUserPackage
    });

  } catch (error) {
    console.error('❌ Error updating user package:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to update user package',
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
    const packageId = searchParams.get('id');

    if (!packageId) {
      return NextResponse.json({
        success: false,
        error: 'Missing ID',
        message: 'User package ID is required'
      }, { status: 400 });
    }

    const id = parseInt(packageId);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ID',
        message: 'User package ID must be a number'
      }, { status: 400 });
    }

    // Check if user package exists and has no active bookings
    const existingPackage = await prisma.userPackage.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: { in: ['confirmed', 'pending'] }
          }
        }
      }
    });

    if (!existingPackage) {
      return NextResponse.json({
        success: false,
        error: 'User package not found',
        message: 'User package with this ID does not exist'
      }, { status: 404 });
    }

    // Check if there are active bookings
    if (existingPackage.bookings.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete user package',
        message: 'User package has active bookings and cannot be deleted'
      }, { status: 400 });
    }

    // Delete the user package (cascading will handle related records)
    await prisma.userPackage.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'User package deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting user package:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete user package',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
