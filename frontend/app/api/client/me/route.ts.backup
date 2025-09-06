import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Zod schema for user profile updates
const updateUserProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(255, 'Name too long'),
  phone: z.string().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  birthPlace: z.string().optional(),
  question: z.string().optional(),
  language: z.enum(['en', 'es']).default('en'),
  notes: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/client/me - Starting request...');
    
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

    // Get the user profile with enhanced data
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
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
        notes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bookings: true,
            purchases: true,
            userPackages: true
          }
        }
      }
    });

    if (!userProfile) {
      console.log('❌ User profile not found');
      return NextResponse.json({
        success: false,
        error: 'Profile not found',
        message: 'User profile does not exist'
      }, { status: 404 });
    }

    console.log('✅ User profile retrieved successfully');

    return NextResponse.json({
      success: true,
      data: userProfile
    });

  } catch (error) {
    console.error('❌ Error in GET /api/client/me:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve user profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 PUT /api/client/me - Starting request...');
    
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

    const body = await request.json();
    const validation = updateUserProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid profile data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const updateData = validation.data;

    // Update the user profile
    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: updateData.fullName,
        phone: updateData.phone,
        birthDate: updateData.birthDate,
        birthTime: updateData.birthTime,
        birthPlace: updateData.birthPlace,
        question: updateData.question,
        language: updateData.language,
        notes: updateData.notes
      },
      select: {
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
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('✅ User profile updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });

  } catch (error) {
    console.error('❌ Error in PUT /api/client/me:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to update user profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
