import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET() {
  return NextResponse.json({ message: 'Bug reports API is working' });
}

export async function POST(request: NextRequest) {
  try {
    console.log('Bug report API called');
    console.log('Request method:', request.method);

    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No Bearer token found in Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token extracted from header');

    // Verify JWT token
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      console.log('JWT token verified successfully for user:', decoded.userId);
    } catch {
      console.log('JWT verification failed');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      console.log('User not found in database:', decoded.userId);
      return NextResponse.json(
        { error: 'Unauthorized - User not found' },
        { status: 401 }
      );
    }

    console.log('User authenticated successfully:', user.id);

    const body = await request.json();
    const { title, description, screenshot, annotations, category, priority } = body;

    console.log('Received bug report data:', { title, description, category, priority });

    // Validate required fields
    if (!title || !description) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Insert bug report using Prisma
    const bugReport = await prisma.bugReport.create({
      data: {
        title,
        description,
        screenshot,
        annotations: annotations || [],
        category: category || null,
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        reporterId: user.id
      }
    });

    console.log('Bug report created successfully:', bugReport.id);

    return NextResponse.json({
      success: true,
      bugReport,
      message: 'Bug report submitted successfully'
    });

  } catch (error) {
    console.error('Error in bug report API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
