import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

interface PackageDefinitionWhereClause {
  packageType?: string;
  isActive?: boolean;
  sessionDurationId?: number;
}

interface PackageDefinitionSelectClause {
  id: boolean;
  name: boolean;
  description: boolean;
  sessionsCount: boolean;
  sessionDurationId: boolean;
  packageType: boolean;
  maxGroupSize: boolean;
  isActive: boolean;
  isPopular: boolean;
  displayOrder: boolean;
  featured: boolean;
  createdAt: boolean;
  updatedAt: boolean;
  sessionDuration?: {
    select: {
      id: boolean;
      name: boolean;
      duration_minutes: boolean;
    };
  };
  packagePrices?: {
    select: {
      id: boolean;
      price: boolean;
      currency: {
        select: {
          id: boolean;
          code: boolean;
          symbol: boolean;
        };
      };
    };
  };
}


// Zod schemas for package definition validation
const createPackageDefinitionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  sessionsCount: z.number().int().positive('Sessions count must be positive'),
  sessionDurationId: z.number().int().positive('Session duration ID must be positive'),
  packageType: z.string().min(1, 'Package type is required').max(20, 'Package type too long'),
  maxGroupSize: z.number().int().positive('Max group size must be positive').optional(),
  isActive: z.boolean().default(true)
});

const updatePackageDefinitionSchema = createPackageDefinitionSchema.partial().extend({
  id: z.number().int().positive('Package definition ID must be positive')
});

const querySchema = z.object({
  packageType: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sessionDurationId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  enhanced: z.enum(['true', 'false']).optional()
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/package-definitions - Starting request...');
    
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

    const { packageType, isActive, sessionDurationId, page, limit, enhanced } = validation.data;
    const offset = (page - 1) * limit;

    console.log('🔍 Query parameters:', { packageType, isActive, sessionDurationId, page, limit, enhanced });

    // Build the query with proper relationships
    const where: PackageDefinitionWhereClause = {};

    if (packageType) where.packageType = packageType;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (sessionDurationId) where.sessionDurationId = sessionDurationId;

    // Base select fields
    const select: PackageDefinitionSelectClause = {
      id: true,
      name: true,
      description: true,
      sessionsCount: true,
      sessionDurationId: true,
      packageType: true,
      maxGroupSize: true,
      isActive: true,
      isPopular: true,
      displayOrder: true,
      featured: true,
      createdAt: true,
      updatedAt: true,
      sessionDuration: {
        select: {
          id: true,
          name: true,
          duration_minutes: true
        }
      }
    };

    // Enhanced mode includes pricing information
    if (enhanced === 'true') {
      (select as any).packagePrices = {
        where: { isActive: true },
        select: {
          id: true,
          price: true,
          currency: {
            select: {
              id: true,
              code: true,
              symbol: true
            }
          }
        }
      };
      (select as unknown as Record<string, unknown>)._count = {
        packagePrices: true
      };
    }

    console.log('🔍 Executing database query...');
    
    const [packageDefinitions, totalCount] = await Promise.all([
      prisma.packageDefinition.findMany({
        where,
        select,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.packageDefinition.count({ where })
    ]);

    console.log('✅ Database query successful, found', packageDefinitions.length, 'package definitions');

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: packageDefinitions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in package-definitions API:', error);
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
    const validation = createPackageDefinitionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid package definition data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const packageData = validation.data;

    // Verify session duration exists
    const sessionDuration = await prisma.sessionDuration.findUnique({
      where: { id: packageData.sessionDurationId }
    });

    if (!sessionDuration) {
      return NextResponse.json({
        success: false,
        error: 'Session duration not found',
        message: 'The specified session duration does not exist'
      }, { status: 404 });
    }

    // Check if package definition with same name already exists
    const existingPackage = await prisma.packageDefinition.findFirst({
      where: { name: packageData.name }
    });

    if (existingPackage) {
      return NextResponse.json({
        success: false,
        error: 'Package definition already exists',
        message: 'A package definition with this name already exists'
      }, { status: 409 });
    }

    // Create the package definition
    const newPackageDefinition = await prisma.packageDefinition.create({
      data: packageData,
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
      message: 'Package definition created successfully',
      data: newPackageDefinition
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating package definition:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to create package definition',
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
    const validation = updatePackageDefinitionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid package definition update data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { id, ...updateData } = validation.data;

    // Check if package definition exists
    const existingPackage = await prisma.packageDefinition.findUnique({
      where: { id }
    });

    if (!existingPackage) {
      return NextResponse.json({
        success: false,
        error: 'Package definition not found',
        message: 'Package definition with this ID does not exist'
      }, { status: 404 });
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

    // Check for name conflicts if name is being updated
    if (updateData.name && updateData.name !== existingPackage.name) {
      const nameConflict = await prisma.packageDefinition.findFirst({
        where: { 
          name: updateData.name,
          id: { not: id }
        }
      });

      if (nameConflict) {
        return NextResponse.json({
          success: false,
          error: 'Name conflict',
          message: 'A package definition with this name already exists'
        }, { status: 409 });
      }
    }

    // Update the package definition
    const updatedPackageDefinition = await prisma.packageDefinition.update({
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
      message: 'Package definition updated successfully',
      data: updatedPackageDefinition
    });

  } catch (error) {
    console.error('❌ Error updating package definition:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to update package definition',
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
        message: 'Package definition ID is required'
      }, { status: 400 });
    }

    const id = parseInt(packageId);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ID',
        message: 'Package definition ID must be a number'
      }, { status: 400 });
    }

    // Check if package definition exists and has no active user packages
    const existingPackage = await prisma.packageDefinition.findUnique({
      where: { id },
      include: {
        packagePrices: {
          include: {
            userPackages: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    if (!existingPackage) {
      return NextResponse.json({
        success: false,
        error: 'Package definition not found',
        message: 'Package definition with this ID does not exist'
      }, { status: 404 });
    }

    // Check if there are active user packages
    const hasActivePackages = existingPackage.packagePrices.some(
      price => price.userPackages.length > 0
    );

    if (hasActivePackages) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete package definition',
        message: 'Package definition has active user packages and cannot be deleted'
      }, { status: 400 });
    }

    // Delete the package definition (cascading will handle related records)
    await prisma.packageDefinition.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Package definition deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting package definition:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete package definition',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
