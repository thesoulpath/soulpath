import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const testConfigSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  tokenApi: z.string().min(1, 'API token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, tokenApi } = testConfigSchema.parse(body);

    // Test connection by getting balance
    const authHeader = Buffer.from(`${username}:${tokenApi}`).toString('base64');
    
    const response = await fetch('https://api.labsmobile.com/json/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const balance = await response.json();

    return NextResponse.json({
      success: true,
      balance
    });
  } catch (error) {
    console.error('Test SMS config error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to test SMS configuration' },
      { status: 500 }
    );
  }
}
