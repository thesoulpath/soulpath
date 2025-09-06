import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

interface PaymentMethodUpdateData {
  name?: string;
  type?: string;
  description?: string;
  icon?: string;
  requiresConfirmation?: boolean;
  autoAssignPackage?: boolean;
  isActive?: boolean;
}

// GET - List all payment methods
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all payment methods using Prisma (same as booking flow)
    const paymentMethods = await prisma.paymentMethodConfig.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        icon: true,
        requiresConfirmation: true,
        autoAssignPackage: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: paymentMethods
    });

  } catch (error) {
    console.error('Error in GET /api/admin/payment-methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new payment method
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Create new payment method using Prisma
    const newPaymentMethod = await prisma.paymentMethodConfig.create({
      data: {
        name: body.name,
        type: body.type || 'custom',
        description: body.description || null,
        icon: body.icon || null,
        requiresConfirmation: body.requiresConfirmation !== undefined ? body.requiresConfirmation : false,
        autoAssignPackage: body.autoAssignPackage !== undefined ? body.autoAssignPackage : true,
        isActive: body.isActive !== undefined ? body.isActive : true
      }
    });

    return NextResponse.json({
      success: true,
      data: newPaymentMethod,
      message: 'Payment method created successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/admin/payment-methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update payment method
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, type, description, icon, requiresConfirmation, autoAssignPackage, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updateData: PaymentMethodUpdateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (requiresConfirmation !== undefined) updateData.requiresConfirmation = requiresConfirmation;
    if (autoAssignPackage !== undefined) updateData.autoAssignPackage = autoAssignPackage;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedPaymentMethod = await prisma.paymentMethodConfig.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: updatedPaymentMethod,
      message: 'Payment method updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT /api/admin/payment-methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete payment method
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.paymentMethodConfig.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/payment-methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}