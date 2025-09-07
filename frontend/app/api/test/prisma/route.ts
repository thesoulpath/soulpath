import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Testing Prisma client...');
    
    // Test 1: Basic connection
    console.log('🔍 Test 1: Basic connection...');
    await prisma.$connect();
    console.log('✅ Basic connection successful');

    // Test 2: Simple query
    console.log('🔍 Test 2: Simple count query...');
    const userCount = await prisma.user.count();
    console.log('✅ Count query successful, user count:', userCount);

    // Test 3: Find many query
    console.log('🔍 Test 3: Find many query...');
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    console.log('✅ Find many query successful, found users:', users.length);

    // Test 4: Find unique query (the one that's failing)
    console.log('🔍 Test 4: Find unique query...');
    const testEmail = 'test@example.com';
    const uniqueUser = await prisma.user.findUnique({
      where: { email: testEmail }
    });
    console.log('✅ Find unique query successful, user found:', !!uniqueUser);

    // Test 5: Raw query
    console.log('🔍 Test 5: Raw query...');
    const rawResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`;
    console.log('✅ Raw query successful, result:', rawResult);

    return NextResponse.json({
      success: true,
      data: {
        connectionStatus: 'connected',
        userCount,
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt
        })),
        testQueryResults: {
          countQuery: userCount,
          findManyQuery: users.length,
          findUniqueQuery: !!uniqueUser,
          rawQuery: rawResult
        }
      }
    });

  } catch (error) {
    console.error('❌ Prisma test error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return NextResponse.json({
      success: false,
      error: 'Prisma test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
