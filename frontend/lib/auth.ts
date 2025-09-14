import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import { env } from './env';

const JWT_SECRET = env.JWT_SECRET;

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Auth: No Authorization header or invalid format');
    }
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  // Never log tokens or secrets
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.userId) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Auth: Invalid JWT token or missing userId');
      }
      return null;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Auth: User not found in database');
      }
      return null;
    }

    // Avoid logging PII in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('Auth: User authenticated.');
    }

    // Check if user is admin
    const isAdminByEmail = user.email && [
      'admin@soulpath.lat',
      'coco@soulpath.lat',
      'beto@soulpath.lat',
      'admin@matmax.world',
      'alberto@matmax.world'
    ].includes(user.email);

    const isAdminByRole = user.role === 'admin';

    if (!isAdminByEmail && !isAdminByRole) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Auth: User is not admin');
      }
      return null;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Auth: User is admin');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role || 'admin'
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Auth: JWT verification error');
    }
    return null;
  }
}

export async function requireAuthResponse(request: NextRequest): Promise<NextResponse | null> {
  const user = await requireAuth(request);
  
  if (!user) {
    return NextResponse.json({ 
      code: 401, 
      message: 'Missing or invalid authorization',
      error: 'Authorization required' 
    }, { status: 401 });
  }
  
  return null; // Continue with the request
}

export function createAuthMiddleware(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json({ 
        code: 401, 
        message: 'Missing or invalid authorization',
        error: 'Authorization required' 
      }, { status: 401 });
    }
    
    return handler(request, user);
  };
}
