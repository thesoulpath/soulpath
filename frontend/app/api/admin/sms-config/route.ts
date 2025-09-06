import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const smsConfigSchema = z.object({
  provider: z.string().default('labsmobile'),
  username: z.string().min(1, 'Username is required'),
  tokenApi: z.string().min(1, 'API token is required'),
  senderName: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const config = await prisma.smsConfiguration.findFirst({
      where: { provider: 'labsmobile' },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      config: config || null
    });
  } catch (error) {
    console.error('Get SMS config error:', error);
    return NextResponse.json(
      { error: 'Failed to load SMS configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = smsConfigSchema.parse(body);

    // Check if configuration already exists
    const existingConfig = await prisma.smsConfiguration.findFirst({
      where: { provider: 'labsmobile' }
    });

    let config;
    if (existingConfig) {
      // Update existing configuration
      config = await prisma.smsConfiguration.update({
        where: { id: existingConfig.id },
        data: {
          ...validatedData,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new configuration
      config = await prisma.smsConfiguration.create({
        data: validatedData
      });
    }

    return NextResponse.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Save SMS config error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save SMS configuration' },
      { status: 500 }
    );
  }
}
