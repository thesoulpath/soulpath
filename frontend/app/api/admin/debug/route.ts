import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Debug endpoint - Testing database connection...');
    
    
    console.log('🔍 Prisma client created');

    // Test basic connection
    const userCount = await prisma.user.count();

    console.log('✅ Database connection successful');
    console.log('✅ Users table query successful, found', userCount, 'users');

    return NextResponse.json({
      success: true,
      message: 'Database connection and table access working',
      userCount: userCount,
      refactored: true
    });

  } catch (error) {
    console.error('❌ Unexpected error in debug endpoint:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
