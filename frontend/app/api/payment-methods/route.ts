import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCache } from '@/lib/cache';

export async function GET() {
  try {
    // Use caching for payment methods (these change infrequently)
    const paymentMethods = await withCache(
      'payment_methods',
      async () => {
        return await prisma.paymentMethodConfig.findMany({
          where: {
            isActive: true
          },
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            icon: true,
            requiresConfirmation: true,
            autoAssignPackage: true,
            isActive: true
          },
          orderBy: {
            name: 'asc'
          }
        });
      },
      10 * 60 * 1000 // Cache for 10 minutes (payment methods change rarely)
    );

    return NextResponse.json({
      success: true,
      data: paymentMethods
    });

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}
