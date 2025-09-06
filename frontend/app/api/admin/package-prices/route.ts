import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Zod schemas for package price validation
const createPackagePriceSchema = z.object({
  packageDefinitionId: z.number().int().positive('Package definition ID must be positive'),
  currencyId: z.number().int().positive('Currency ID must be positive'),
  price: z.number().positive('Price must be positive'),
  pricingMode: z.enum(['fixed', 'calculated']).default('fixed'),
  isActive: z.boolean().default(true)
});

const updatePackagePriceSchema = createPackagePriceSchema.partial().extend({
  id: z.number().int().positive('Package price ID must be positive')
});

const querySchema = z.object({
  packageDefinitionId: z.coerce.number().int().positive().optional(),
  currencyId: z.coerce.number().int().positive().optional(),
  pricingMode: z.enum(['fixed', 'calculated']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  enhanced: z.enum(['true', 'false']).optional()
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/package-prices - Starting request...');
    
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

    const { packageDefinitionId, currencyId, pricingMode, isActive, page, limit, enhanced } = validation.data;
    const offset = (page - 1) * limit;

    console.log('🔍 Query parameters:', { packageDefinitionId, currencyId, pricingMode, isActive, page, limit, enhanced });

    // Build the query with proper relationships
    const where: Record<string, unknown> = {};

    if (packageDefinitionId) where.packageDefinitionId = packageDefinitionId;
    if (currencyId) where.currencyId = currencyId;
    if (pricingMode) where.pricingMode = pricingMode;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    // Base select fields
    const select: Record<string, unknown> = {
      id: true,
      packageDefinitionId: true,
      currencyId: true,
      price: true,
      pricingMode: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      packageDefinition: {
        select: {
          id: true,
          name: true,
          description: true,
          sessionsCount: true,
          packageType: true,
          maxGroupSize: true,
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
          symbol: true,
          isDefault: true
        }
      }
    };

    // Enhanced mode includes usage statistics
    if (enhanced === 'true') {
      select._count = {
        userPackages: true
      };
      select.userPackages = {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          quantity: true,
          isActive: true,
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
    
    const [packagePrices, totalCount] = await Promise.all([
      prisma.packagePrice.findMany({
        where,
        select,
        skip: offset,
        take: limit,
        orderBy: [
          { packageDefinition: { name: 'asc' } },
          { currency: { code: 'asc' } },
          { price: 'asc' }
        ]
      }),
      prisma.packagePrice.count({ where })
    ]);

    console.log('✅ Database query successful, found', packagePrices.length, 'package prices');

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: packagePrices,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in package-prices API:', error);
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
    const validation = createPackagePriceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid package price data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const priceData = validation.data;

    // Verify package definition exists
    const packageDefinition = await prisma.packageDefinition.findUnique({
      where: { id: priceData.packageDefinitionId }
    });

    if (!packageDefinition) {
      return NextResponse.json({
        success: false,
        error: 'Package definition not found',
        message: 'The specified package definition does not exist'
      }, { status: 404 });
    }

    // Verify currency exists
    const currency = await prisma.currency.findUnique({
      where: { id: priceData.currencyId }
    });

    if (!currency) {
      return NextResponse.json({
        success: false,
        error: 'Currency not found',
        message: 'The specified currency does not exist'
      }, { status: 404 });
    }

    // Check if price already exists for this package and currency
    const existingPrice = await prisma.packagePrice.findFirst({
      where: {
        packageDefinitionId: priceData.packageDefinitionId,
        currencyId: priceData.currencyId
      }
    });

    if (existingPrice) {
      return NextResponse.json({
        success: false,
        error: 'Price already exists',
        message: 'A price for this package and currency already exists'
      }, { status: 409 });
    }

    // Create the package price
    const newPackagePrice = await prisma.packagePrice.create({
      data: priceData,
      include: {
        packageDefinition: {
          select: {
            id: true,
            name: true,
            description: true,
            sessionsCount: true,
            packageType: true,
            maxGroupSize: true,
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
            symbol: true,
            is_default: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Package price created successfully',
      data: newPackagePrice
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating package price:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to create package price',
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
    const validation = updatePackagePriceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid package price update data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { id, ...updateData } = validation.data;

    // Check if package price exists
    const existingPrice = await prisma.packagePrice.findUnique({
      where: { id }
    });

    if (!existingPrice) {
      return NextResponse.json({
        success: false,
        error: 'Package price not found',
        message: 'Package price with this ID does not exist'
      }, { status: 404 });
    }

    // Verify package definition exists if being updated
    if (updateData.packageDefinitionId) {
      const packageDefinition = await prisma.packageDefinition.findUnique({
        where: { id: updateData.packageDefinitionId }
      });

      if (!packageDefinition) {
        return NextResponse.json({
          success: false,
          error: 'Package definition not found',
          message: 'The specified package definition does not exist'
        }, { status: 404 });
      }
    }

    // Verify currency exists if being updated
    if (updateData.currencyId) {
      const currency = await prisma.currency.findUnique({
        where: { id: updateData.currencyId }
      });

      if (!currency) {
        return NextResponse.json({
          success: false,
          error: 'Currency not found',
          message: 'The specified currency does not exist'
        }, { status: 404 });
      }
    }

    // Check for conflicts if package or currency is being updated
    if (updateData.packageDefinitionId || updateData.currencyId) {
      const newPackageDefinitionId = updateData.packageDefinitionId ?? existingPrice.packageDefinitionId;
      const newCurrencyId = updateData.currencyId ?? existingPrice.currencyId;

      const conflict = await prisma.packagePrice.findFirst({
        where: {
          packageDefinitionId: newPackageDefinitionId,
          currencyId: newCurrencyId,
          id: { not: id }
        }
      });

      if (conflict) {
        return NextResponse.json({
          success: false,
          error: 'Price conflict',
          message: 'A price for this package and currency already exists'
        }, { status: 409 });
      }
    }

    // Update the package price
    const updatedPackagePrice = await prisma.packagePrice.update({
      where: { id },
      data: updateData,
      include: {
        packageDefinition: {
          select: {
            id: true,
            name: true,
            description: true,
            sessionsCount: true,
            packageType: true,
            maxGroupSize: true,
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
            symbol: true,
            is_default: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Package price updated successfully',
      data: updatedPackagePrice
    });

  } catch (error) {
    console.error('❌ Error updating package price:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to update package price',
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
    const priceId = searchParams.get('id');

    if (!priceId) {
      return NextResponse.json({
        success: false,
        error: 'Missing ID',
        message: 'Package price ID is required'
      }, { status: 400 });
    }

    const id = parseInt(priceId);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ID',
        message: 'Package price ID must be a number'
      }, { status: 400 });
    }

    // Check if package price exists and has no active user packages
    const existingPrice = await prisma.packagePrice.findUnique({
      where: { id },
      include: {
        userPackages: {
          where: { isActive: true }
        }
      }
    });

    if (!existingPrice) {
      return NextResponse.json({
        success: false,
        error: 'Package price not found',
        message: 'Package price with this ID does not exist'
      }, { status: 404 });
    }

    // Check if there are active user packages using this price
    if (existingPrice.userPackages.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete package price',
        message: 'Package price is being used by active user packages and cannot be deleted'
      }, { status: 400 });
    }

    // Delete the package price
    await prisma.packagePrice.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Package price deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting package price:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete package price',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}