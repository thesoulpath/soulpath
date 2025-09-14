import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No token provided',
        message: 'Authentication token is required'
      }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; iat?: number; exp?: number };
    
    if (!decoded) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token',
        message: 'Authentication token is invalid'
      }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: 'User does not exist'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      message: 'Token verified successfully'
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Invalid token',
      message: 'Authentication token is invalid or expired'
    }, { status: 401 });
  }
}
