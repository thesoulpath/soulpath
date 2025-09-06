import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';


const querySchema = z.object({
  currency: z.string().length(3).optional(),
  packageType: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/client/packages - Starting request...');
    
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

    const { currency, packageType, page, limit } = validation.data;
    const offset = (page - 1) * limit;

    console.log('🔍 Query parameters:', { currency, packageType, page, limit });

    // Build the query with proper relationships
    const where: Record<string, unknown> = {
      isActive: true
    };

    if (packageType) {
      where.packageType = packageType;
    }

    // Get package definitions with pricing information
    const [packageDefinitions, totalCount] = await Promise.all([
      prisma.packageDefinition.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          sessionsCount: true,
          packageType: true,
          maxGroupSize: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          sessionDuration: {
            select: {
              id: true,
              name: true,
              duration_minutes: true,
              description: true
            }
          },
          packagePrices: {
            where: {
              isActive: true,
              ...(currency && { currency: { code: currency } })
            },
            select: {
              id: true,
              price: true,
              pricingMode: true,
              isActive: true,
              currency: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  symbol: true
                }
              }
            },
            orderBy: { price: 'asc' }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' }
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
    console.error('❌ Error in GET /api/client/packages:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch packages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
