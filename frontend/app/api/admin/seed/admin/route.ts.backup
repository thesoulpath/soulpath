import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Zod schema for admin user creation
const adminUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'user']).default('admin'),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  birthTime: z.string().optional(),
  birthPlace: z.string().optional(),
  question: z.string().optional(),
  language: z.string().optional(),
  adminNotes: z.string().optional()
});

export async function POST() {
  try {
    // Validate admin user data
    const adminData = {
      email: 'admin@soulpath.lat',
      password: 'soulpath',
      fullName: 'SoulPath Admin',
      role: 'admin' as const,
      phone: '+1234567890',
      birthDate: '1990-01-15',
      birthTime: '10:30:00',
      birthPlace: 'New York, USA',
      question: 'How can I help manage the SOULPATH wellness system?',
      language: 'en',
      adminNotes: 'Primary system administrator for SOULPATH'
    };

    const validationResult = adminUserSchema.safeParse(adminData);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.format());
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Admin user data validation failed',
        details: validationResult.error.format(),
        toast: {
          type: 'error',
          title: 'Validation Error',
          description: 'Admin user data validation failed. Please check the data format.'
        }
      }, { status: 400 });
    }

    // Delete existing admin user if it exists
    await prisma.user.deleteMany({
      where: { email: adminData.email }
    });

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    // Create admin user using Prisma
    const user = await prisma.user.create({
      data: {
        email: adminData.email,
        password: hashedPassword,
        fullName: adminData.fullName,
        role: adminData.role,
        phone: adminData.phone,
        birthDate: adminData.birthDate ? new Date(adminData.birthDate) : null,
        birthTime: adminData.birthTime ? new Date(`1970-01-01T${adminData.birthTime}`) : null,
        birthPlace: adminData.birthPlace,
        question: adminData.question,
        language: adminData.language,
        adminNotes: adminData.adminNotes,
        status: 'active'
      }
    });

    console.log('✅ Admin user created successfully:', user.email);

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      toast: {
        type: 'success',
        title: 'Success!',
        description: `Admin user ${adminData.email} created successfully with password: ${adminData.password}`
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error',
      toast: {
        type: 'error',
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again.'
      }
    }, { status: 500 });
  }
}
