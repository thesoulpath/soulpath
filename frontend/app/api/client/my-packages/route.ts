import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';


const querySchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
  hasRemainingSessions: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/client/my-packages - Starting request...');
    
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

    const { isActive, hasRemainingSessions, page, limit } = validation.data;
    const offset = (page - 1) * limit;

    console.log('🔍 Query parameters:', { isActive, hasRemainingSessions, page, limit });

    // Build the query with proper relationships
    const where: Record<string, unknown> = {
      userId: user.id
    };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Get user packages with enhanced relationships
    const [userPackages, totalCount] = await Promise.all([
      prisma.userPackage.findMany({
        where,
        select: {
          id: true,
          quantity: true,
          sessionsUsed: true,
          isActive: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
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
                  maxGroupSize: true,
                  sessionDuration: {
                    select: {
                      id: true,
                      name: true,
                      duration_minutes: true,
                      description: true
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
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.userPackage.count({ where })
    ]);

    console.log('✅ Database query successful, found', userPackages.length, 'user packages');

    // Transform the data to include calculated fields
    const transformedPackages = userPackages.map((pkg) => {
      const totalSessions = pkg.packagePrice.packageDefinition.sessionsCount * (pkg.quantity || 1);
      const sessionsRemaining = totalSessions - (pkg.sessionsUsed || 0);
      
      return {
        id: pkg.id,
        name: pkg.packagePrice.packageDefinition.name,
        description: pkg.packagePrice.packageDefinition.description,
        sessionsRemaining,
        totalSessions,
        sessionsUsed: pkg.sessionsUsed,
        quantity: pkg.quantity,
        expiresAt: pkg.expiresAt,
        isActive: pkg.isActive,
        purchaseDate: pkg.purchase.purchasedAt,
        price: pkg.packagePrice.price,
        sessionDuration: pkg.packagePrice.packageDefinition.sessionDuration.duration_minutes,
        packageType: pkg.packagePrice.packageDefinition.packageType,
        maxGroupSize: pkg.packagePrice.packageDefinition.maxGroupSize,
        currency: pkg.packagePrice.currency.symbol,
        currencyCode: pkg.packagePrice.currency.code,
        paymentStatus: pkg.purchase.paymentStatus,
        totalAmount: pkg.purchase.totalAmount
      };
    });

    // Filter by remaining sessions if requested
    let filteredPackages = transformedPackages;
    if (hasRemainingSessions === 'true') {
      filteredPackages = transformedPackages.filter(pkg => pkg.sessionsRemaining > 0);
    } else if (hasRemainingSessions === 'false') {
      filteredPackages = transformedPackages.filter(pkg => pkg.sessionsRemaining <= 0);
    }

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
    console.error('❌ Error in GET /api/client/my-packages:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch user packages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
