import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Zod schemas for currency validation
const createCurrencySchema = z.object({
  code: z.string().length(3, 'Currency code must be 3 characters').toUpperCase(),
  name: z.string().min(1, 'Currency name is required').max(100, 'Name too long'),
  symbol: z.string().min(1, 'Currency symbol is required').max(10, 'Symbol too long'),
  isDefault: z.boolean().default(false),
  exchangeRate: z.number().positive('Exchange rate must be positive').default(1)
});

const updateCurrencySchema = createCurrencySchema.partial().extend({
  id: z.number().int().positive('Currency ID must be positive')
});

const querySchema = z.object({
  isDefault: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/currencies - Starting request...');
    
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

    const { isDefault, page, limit } = validation.data;
    const offset = (page - 1) * limit;

    console.log('🔍 Query parameters:', { isDefault, page, limit });

    // Build the query
    const where: { is_default?: boolean } = {};
    if (isDefault !== undefined) where.is_default = isDefault === 'true';

    console.log('🔍 Executing database query...');
    
    const [currencies, totalCount] = await Promise.all([
      prisma.currency.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [
          { is_default: 'desc' },
          { code: 'asc' }
        ]
      }),
      prisma.currency.count({ where })
    ]);

    console.log('✅ Database query successful, found', currencies.length, 'currencies');

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: currencies,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in currencies API:', error);
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
    const validation = createCurrencySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid currency data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const currencyData = validation.data;

    // Check if currency with same code already exists
    const existingCurrency = await prisma.currency.findUnique({
      where: { code: currencyData.code }
    });

    if (existingCurrency) {
      return NextResponse.json({
        success: false,
        error: 'Currency already exists',
        message: 'A currency with this code already exists'
      }, { status: 409 });
    }

    // If this is being set as default, unset other defaults
    if (currencyData.isDefault) {
      await prisma.currency.updateMany({
        where: { is_default: true },
        data: { is_default: false }
      });
    }

    // Create the currency
    const newCurrency = await prisma.currency.create({
      data: currencyData
    });

    return NextResponse.json({
      success: true,
      message: 'Currency created successfully',
      data: newCurrency
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating currency:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to create currency',
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
    const validation = updateCurrencySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid currency update data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { id, ...updateData } = validation.data;

    // Check if currency exists
    const existingCurrency = await prisma.currency.findUnique({
      where: { id }
    });

    if (!existingCurrency) {
      return NextResponse.json({
        success: false,
        error: 'Currency not found',
        message: 'Currency with this ID does not exist'
      }, { status: 404 });
    }

    // Check for code conflicts if code is being updated
    if (updateData.code && updateData.code !== existingCurrency.code) {
      const codeConflict = await prisma.currency.findFirst({
        where: { 
          code: updateData.code,
          id: { not: id }
        }
      });

      if (codeConflict) {
        return NextResponse.json({
          success: false,
          error: 'Code conflict',
          message: 'A currency with this code already exists'
        }, { status: 409 });
      }
    }

    // If this is being set as default, unset other defaults
        if (updateData.isDefault) {
      await prisma.currency.updateMany({
        where: {
          is_default: true,
          id: { not: id }
        },
        data: { is_default: false }
      });
    }

    // Update the currency
    const updatedCurrency = await prisma.currency.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Currency updated successfully',
      data: updatedCurrency
    });

  } catch (error) {
    console.error('❌ Error updating currency:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to update currency',
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
    const currencyId = searchParams.get('id');

    if (!currencyId) {
      return NextResponse.json({
        success: false,
        error: 'Missing ID',
        message: 'Currency ID is required'
      }, { status: 400 });
    }

    const id = parseInt(currencyId);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ID',
        message: 'Currency ID must be a number'
      }, { status: 400 });
    }

    // Check if currency exists and has no active package prices
    const existingCurrency = await prisma.currency.findUnique({
      where: { id },
      include: {
        packagePrices: {
          where: { isActive: true }
        }
      }
    });

    if (!existingCurrency) {
      return NextResponse.json({
        success: false,
        error: 'Currency not found',
        message: 'Currency with this ID does not exist'
      }, { status: 404 });
    }

    // Check if there are active package prices using this currency
    if (existingCurrency.packagePrices.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete currency',
        message: 'Currency is being used by active package prices and cannot be deleted'
      }, { status: 400 });
    }

    // Don't allow deletion of default currency
    if (existingCurrency.is_default) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete default currency',
        message: 'Default currency cannot be deleted'
      }, { status: 400 });
    }

    // Delete the currency
    await prisma.currency.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Currency deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting currency:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete currency',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}