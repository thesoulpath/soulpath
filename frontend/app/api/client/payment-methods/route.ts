import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 GET /api/client/payment-methods - Starting request...');

    // Fetch active payment method configs with currency information
    const paymentMethods = await prisma.paymentMethodConfig.findMany({
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
      orderBy: { name: 'asc' }
    });

    console.log('✅ Database query successful, found', paymentMethods.length, 'payment methods');

    // Transform the data to match the expected format
    const transformedMethods = paymentMethods.map(method => ({
      id: method.id,
      name: method.name,
      type: method.type || 'custom',
      description: method.description || '',
      icon: method.icon || 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/credit-card/credit-card-original.svg',
      requiresConfirmation: method.requiresConfirmation || false,
      autoAssignPackage: method.autoAssignPackage || true,
      isActive: method.isActive || true
    }));

    return NextResponse.json({
      success: true,
      data: transformedMethods
    });

  } catch (error) {
    console.error('❌ Error in GET /api/client/payment-methods:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch payment methods',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
