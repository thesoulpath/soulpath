import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// JWT secret - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login API called');
    
    // Test database connection first
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        message: 'Unable to connect to database',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }

    const { email, password } = await request.json();
    console.log('📧 Login attempt for:', email);

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Missing credentials',
        message: 'Email and password are required'
      }, { status: 400 });
    }

    // Find user in database
    console.log('🔍 Looking for user in database...');
    console.log('🔍 Search email:', email.toLowerCase());
    let user;
    try {
      // First, let's test a simple query to see if Prisma is working
      console.log('🔍 Testing Prisma connection with simple query...');
      const userCount = await prisma.user.count();
      console.log('✅ Prisma connection working, user count:', userCount);
      
      // Now try the specific user query
      console.log('🔍 Executing user findUnique query...');
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
      console.log('👤 User found:', user ? 'Yes' : 'No');
      if (user) {
        console.log('👤 User details:', { 
          id: user.id, 
          email: user.email, 
          role: user.role, 
          hasPassword: !!user.password,
          fullName: user.fullName,
          createdAt: user.createdAt
        });
      } else {
        console.log('👤 No user found with email:', email.toLowerCase());
      }
    } catch (userQueryError) {
      console.error('❌ User query failed:', userQueryError);
      console.error('❌ Query error details:', {
        message: userQueryError instanceof Error ? userQueryError.message : 'Unknown error',
        stack: userQueryError instanceof Error ? userQueryError.stack : undefined,
        name: userQueryError instanceof Error ? userQueryError.name : undefined
      });
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        message: 'Unable to query user data',
        details: userQueryError instanceof Error ? userQueryError.message : 'Unknown query error'
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // Check if user has password (for users created with our new system)
    if (!user.password) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // Verify password
    let isValidPassword;
    try {
      console.log('🔐 Verifying password...');
      isValidPassword = await bcrypt.compare(password, user.password);
      console.log('🔐 Password verification result:', isValidPassword);
    } catch (passwordError) {
      console.error('❌ Password verification failed:', passwordError);
      return NextResponse.json({
        success: false,
        error: 'Password verification failed',
        message: 'Unable to verify password',
        details: passwordError instanceof Error ? passwordError.message : 'Unknown password error'
      }, { status: 500 });
    }
    
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // Generate JWT token
    let token;
    try {
      console.log('🎫 Generating JWT token...');
      token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      console.log('🎫 JWT token generated successfully');
    } catch (jwtError) {
      console.error('❌ JWT generation failed:', jwtError);
      return NextResponse.json({
        success: false,
        error: 'Token generation failed',
        message: 'Unable to generate authentication token',
        details: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error'
      }, { status: 500 });
    }

    // Return user data and token
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        access_token: token
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during login',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
