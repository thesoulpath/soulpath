import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

export async function GET() {
  try {
    console.log('🔍 Testing database connection and user creation...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check if any users exist
    const userCount = await prisma.user.count();
    console.log('👥 Total users in database:', userCount);

    // List all users (without passwords)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        password: true,
        createdAt: true
      }
    });

    // Test the specific query that's failing in login
    console.log('🔍 Testing login query...');
    // let testUser;
    try {
      await prisma.user.findUnique({
        where: { email: 'test@example.com' }
      });
      console.log('✅ Login query test successful');
    } catch (queryError) {
      console.error('❌ Login query test failed:', queryError);
    }

    console.log('👥 Users in database:', users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      fullName: u.fullName,
      hasPassword: !!u.password,
      createdAt: u.createdAt
    })));

    return NextResponse.json({
      success: true,
      data: {
        connectionStatus: 'connected',
        userCount,
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          role: u.role,
          fullName: u.fullName,
          hasPassword: !!u.password,
          createdAt: u.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Creating test user...');
    
    const { email, password, fullName, role } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Email and password are required'
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User already exists',
        message: 'A user with this email already exists'
      }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        fullName: fullName || 'Test User',
        role: role || 'admin'
      }
    });

    console.log('✅ Test user created:', { id: user.id, email: user.email, role: user.role });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        createdAt: user.createdAt
      },
      message: 'Test user created successfully'
    });

  } catch (error) {
    console.error('❌ User creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'User creation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
