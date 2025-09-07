import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/health - Starting health check...');
    
    // Test authentication
    const user = await requireAuth(request);
    if (!user || user.role !== 'admin') {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      }, { status: 401 });
    }

    console.log('✅ Admin user authenticated:', user.email);

    // Test database connection
    let dbStatus = 'unknown';
    const dbError = null;
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
      console.log('✅ Database connection successful');
    } catch (dbError) {
      dbStatus = 'error';
      console.error('❌ Database connection failed:', dbError);
    }

    // Test basic query
    let tableExists = false;
    let recordCount = 0;
    try {
      const count = await prisma.conversationLog.count();
      tableExists = true;
      recordCount = count;
      console.log('✅ Conversation logs table accessible, count:', count);
    } catch (queryError) {
      console.error('❌ Conversation logs query failed:', queryError);
    }

    return NextResponse.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        authentication: {
          status: 'success',
          user: {
            id: user.id,
            email: user.email,
            role: user.role
          }
        },
        database: {
          status: dbStatus,
          error: dbError ? String(dbError) : null,
          tableExists,
          recordCount
        }
      }
    });

  } catch (error) {
    console.error('❌ Health check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
