import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Debug JWT_SECRET loading
console.log('🔐 Auth: JWT_SECRET loaded:', JWT_SECRET ? 'YES' : 'NO', 'Length:', JWT_SECRET?.length || 0);

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth: No Authorization header or invalid format');
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('Auth: Token received, length:', token.length);
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.userId) {
      console.log('Auth: Invalid JWT token or missing userId');
      return null;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      console.log('Auth: User not found in database');
      return null;
    }

    console.log('Auth: User authenticated:', user.email, 'Role:', user.role);

    // Check if user is admin
    const isAdminByEmail = user.email && [
      'admin@soulpath.lat',
      'coco@soulpath.lat',
      'admin@matmax.world',
      'alberto@matmax.world'
    ].includes(user.email);

    const isAdminByRole = user.role === 'admin';

    if (!isAdminByEmail && !isAdminByRole) {
      console.log('Auth: User is not admin, email:', user.email, 'role:', user.role);
      return null;
    }

    console.log('Auth: User is admin by', isAdminByEmail ? 'email' : 'role');

    return {
      id: user.id,
      email: user.email,
      role: user.role || 'admin'
    };
  } catch (error) {
    console.log('Auth: JWT verification error:', error);
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
