import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Testing package fetching from database...');

    // Test database connection first
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');

    // Fetch packages
    const packages = await prisma.packageDefinition.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        sessionsCount: true,
        packageType: true,
        maxGroupSize: true,
        isPopular: true,
        packagePrices: {
          where: {
            isActive: true
          },
          select: {
            price: true,
            currency: {
              select: {
                code: true,
                symbol: true
              }
            }
          },
          orderBy: {
            price: 'asc'
          },
          take: 1
        },
        sessionDuration: {
          select: {
            name: true,
            duration_minutes: true
          }
        }
      },
      orderBy: {
        displayOrder: 'asc'
      }
    });

    console.log(`✅ Found ${packages.length} packages`);

    // Transform packages for display
    const formattedPackages = packages.map(pkg => {
      const price = pkg.packagePrices[0];
      return {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description || 'No description available',
        sessionsCount: pkg.sessionsCount,
        price: price ? Number(price.price) : 0,
        currency: price?.currency?.symbol || '$',
        duration: pkg.sessionDuration?.duration_minutes || 60,
        isPopular: pkg.isPopular,
        packageType: pkg.packageType,
        maxGroupSize: pkg.maxGroupSize
      };
    });

    return NextResponse.json({
      success: true,
      packages: formattedPackages,
      count: formattedPackages.length
    });

  } catch (error) {
    console.error('❌ Error testing packages:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      packages: []
    }, { status: 500 });
  }
}
