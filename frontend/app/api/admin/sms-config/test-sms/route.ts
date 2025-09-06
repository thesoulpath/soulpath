import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const testSmsSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required'),
  username: z.string().min(1, 'Username is required'),
  tokenApi: z.string().min(1, 'API token is required'),
  senderName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, message, username, tokenApi, senderName } = testSmsSchema.parse(body);

    // Send test SMS using LabsMobile API
    const authHeader = Buffer.from(`${username}:${tokenApi}`).toString('base64');
    
    const smsData = {
      message,
      tpoa: senderName || 'SoulPath',
      recipient: [
        {
          msisdn: phoneNumber
        }
      ]
    };

    const response = await fetch('https://api.labsmobile.com/json/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Test SMS send error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send test SMS' },
      { status: 500 }
    );
  }
}
