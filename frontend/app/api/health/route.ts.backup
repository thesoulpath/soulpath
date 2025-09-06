import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get basic stats with error handling
    let userCount = 0;
    let bookingCount = 0;
    let purchaseCount = 0;
    
    try {
      userCount = await prisma.user.count();
    } catch (error) {
      console.warn('Could not count users:', error);
    }
    
    try {
      bookingCount = await prisma.booking.count();
    } catch (error) {
      console.warn('Could not count bookings:', error);
    }
    
    try {
      purchaseCount = await prisma.purchase.count();
    } catch (error) {
      console.warn('Could not count purchases:', error);
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      stats: {
        users: userCount,
        bookings: bookingCount,
        purchases: purchaseCount
      },
      version: '2.0.0',
      refactored: true
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
