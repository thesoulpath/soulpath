import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { labsMobileSmsService, LabsMobileSmsService } from '@/lib/labsmobile-sms-service';
import { z } from 'zod';

const sendOtpSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  countryCode: z.string().min(1, 'Country code is required'),
  language: z.string().optional().default('en'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, countryCode, language } = sendOtpSchema.parse(body);

    // Validate phone number format
    if (!LabsMobileSmsService.validatePhoneNumber(phoneNumber, countryCode)) {
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      return NextResponse.json(
        { 
          error: `Invalid phone number format for ${countryCode}. Received: "${cleanNumber}" (${cleanNumber.length} digits). Please check the example format.` 
        },
        { status: 400 }
      );
    }

    // Format phone number for API
    const formattedPhoneNumber = LabsMobileSmsService.formatPhoneNumber(phoneNumber, countryCode);

    // Check if there's an existing unverified OTP for this phone number
    const existingOtp = await prisma.otpVerification.findFirst({
      where: {
        phoneNumber: formattedPhoneNumber,
        isVerified: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingOtp) {
      // If there's a recent unverified OTP, don't send a new one
      const timeDiff = existingOtp.expiresAt.getTime() - new Date().getTime();
      if (timeDiff > 8 * 60 * 1000) { // More than 8 minutes remaining
        return NextResponse.json(
          { error: 'Please wait before requesting a new OTP code' },
          { status: 429 }
        );
      }
    }

    // Generate new OTP code
    const otpCode = LabsMobileSmsService.generateOtpCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP to database
    const otpVerification = await prisma.otpVerification.create({
      data: {
        phoneNumber: formattedPhoneNumber,
        countryCode,
        otpCode,
        expiresAt,
        attempts: 0,
        maxAttempts: 3
      }
    });

    // Send SMS via LabsMobile
    try {
      await labsMobileSmsService.sendOtpSms(formattedPhoneNumber, otpCode, language);
      
      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        otpId: otpVerification.id,
        expiresAt: expiresAt.toISOString()
      });
    } catch (smsError) {
      // If SMS sending fails, clean up the OTP record
      await prisma.otpVerification.delete({
        where: { id: otpVerification.id }
      });

      console.error('SMS sending failed:', smsError);
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    
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
