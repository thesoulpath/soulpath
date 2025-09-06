import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Zod schemas for user data validation
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
  role: z.enum(['user', 'admin']).default('user'),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  birthPlace: z.string().optional(),
  question: z.string().optional(),
  language: z.enum(['en', 'es']).default('en'),
  adminNotes: z.string().optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  sessionType: z.string().optional(),
  notes: z.string().optional()
});

const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().cuid('Invalid user ID format')
});

const querySchema = z.object({
  email: z.string().email().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  language: z.enum(['en', 'es']).optional(),
  role: z.enum(['user', 'admin']).optional(),
  hasActivePackages: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  enhanced: z.enum(['true', 'false']).optional()
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/users - Starting request...');
    
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

    const { email, status, language, role, hasActivePackages, page, limit, enhanced } = validation.data;
    const offset = (page - 1) * limit;

    console.log('🔍 Query parameters:', { email, status, language, role, hasActivePackages, page, limit, enhanced });

    // Build the query with proper relationships
    const where: any = {};
    
    if (email) where.email = email;
    if (status) where.status = status;
    if (language) where.language = language;
    if (role) where.role = role;

    // Base select fields
    const select: any = {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      status: true,
      birthDate: true,
      birthTime: true,
      birthPlace: true,
      question: true,
      language: true,
      adminNotes: true,
      scheduledDate: true,
      scheduledTime: true,
      sessionType: true,
      lastReminderSent: true,
      lastBooking: true,
      notes: true,
      createdAt: true,
      updatedAt: true
    };

    // Enhanced mode includes related data
    if (enhanced === 'true') {
      // For now, just return basic user data without complex relationships
      // TODO: Add proper relationship queries once schema is fully migrated
    }

    console.log('🔍 Executing database query...');
    
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    console.log('✅ Database query successful, found', users.length, 'users');

    // Filter by active packages if requested
    let filteredUsers = users;
    if (hasActivePackages === 'true') {
      const usersWithActivePackages = await prisma.user.findMany({
        where: {
          ...where,
          purchases: {
            some: {
              userPackages: {
                some: {
                  isActive: true
                }
              }
            }
          }
        },
        select,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
      filteredUsers = usersWithActivePackages;
    } else if (hasActivePackages === 'false') {
      const usersWithoutActivePackages = await prisma.user.findMany({
        where: {
          ...where,
          purchases: {
            none: {
              userPackages: {
                some: {
                  isActive: true
                }
              }
            }
          }
        },
        select,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
      filteredUsers = usersWithoutActivePackages;
    }

    const totalPages = Math.ceil(totalCount / limit);

    console.log('✅ Returning', filteredUsers.length, 'users to client');
    return NextResponse.json({
      success: true,
      data: filteredUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in users API:', error);
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
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid user data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const userData = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User already exists',
        message: 'A user with this email already exists'
      }, { status: 409 });
    }

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        ...userData,
        birthDate: userData.birthDate ? new Date(userData.birthDate) : null,
        scheduledDate: userData.scheduledDate ? new Date(userData.scheduledDate) : null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: newUser
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating user:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to create user',
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
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid user data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const { id, ...updateData } = validation.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: 'User with this ID does not exist'
      }, { status: 404 });
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        birthDate: updateData.birthDate ? new Date(updateData.birthDate) : undefined,
        scheduledDate: updateData.scheduledDate ? new Date(updateData.scheduledDate) : undefined
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('❌ Error updating user:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to update user',
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
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing ID',
        message: 'User ID is required'
      }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: 'User with this ID does not exist'
      }, { status: 404 });
    }

    // Delete the user (cascading will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
