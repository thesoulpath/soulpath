import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const verifyOtpSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  otpCode: z.string().min(6, 'OTP code must be at least 6 digits').max(6, 'OTP code must be at most 6 digits'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, otpCode } = verifyOtpSchema.parse(body);

    // Find the OTP verification record
    const otpVerification = await prisma.otpVerification.findFirst({
      where: {
        phoneNumber,
        otpCode,
        isVerified: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!otpVerification) {
      // Check if there's an expired or invalid OTP
      const expiredOtp = await prisma.otpVerification.findFirst({
        where: {
          phoneNumber,
          otpCode,
          isVerified: false
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (expiredOtp) {
        if (expiredOtp.expiresAt < new Date()) {
          return NextResponse.json(
            { error: 'OTP code has expired. Please request a new one.' },
            { status: 400 }
          );
        }

        if (expiredOtp.attempts >= expiredOtp.maxAttempts) {
          return NextResponse.json(
            { error: 'Maximum verification attempts exceeded. Please request a new OTP.' },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Invalid OTP code' },
        { status: 400 }
      );
    }

    // Check if max attempts exceeded
    if (otpVerification.attempts >= otpVerification.maxAttempts) {
      return NextResponse.json(
        { error: 'Maximum verification attempts exceeded. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (otpVerification.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'OTP code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify the OTP
    await prisma.otpVerification.update({
      where: { id: otpVerification.id },
      data: {
        isVerified: true,
        attempts: otpVerification.attempts + 1
      }
    });

    // Look for existing user with this phone number
    const existingUser = await prisma.user.findFirst({
      where: {
        phone: phoneNumber
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        birthDate: true,
        birthTime: true,
        birthPlace: true,
        language: true,
        status: true
      }
    });

    if (existingUser) {
      // Return existing user data for pre-filling the form
      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          fullName: existingUser.fullName,
          phone: existingUser.phone,
          birthDate: existingUser.birthDate?.toISOString().split('T')[0],
          birthTime: existingUser.birthTime?.toString().substring(0, 5), // HH:MM format
          birthPlace: existingUser.birthPlace,
          language: existingUser.language,
          status: existingUser.status
        },
        isExistingCustomer: true
      });
    } else {
      // New customer - return basic info
      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
        user: {
          phone: phoneNumber
        },
        isExistingCustomer: false
      });
    }

  } catch (error) {
    console.error('Verify OTP error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
