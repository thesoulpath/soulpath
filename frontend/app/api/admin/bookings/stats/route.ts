import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Fetch statistics
    const [
      groupBookingsResult,
      sessionUsageResult,
      todayGroupBookingsResult,
      todaySessionUsageResult
    ] = await Promise.all([
      // Total group bookings
      supabase
        .from('group_bookings')
        .select('*', { count: 'exact', head: true }),
      
      // Total session usage
      supabase
        .from('session_usage')
        .select('*', { count: 'exact', head: true }),
      
      // Today's group bookings
      supabase
        .from('group_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('session_date', today),
      
      // Today's session usage
      supabase
        .from('session_usage')
        .select('*', { count: 'exact', head: true })
        .eq('session_date', today)
    ]);

    // Get active bookings (confirmed status)
    const [activeGroupBookings, activeSessionUsage] = await Promise.all([
      supabase
        .from('group_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed'),
      
      supabase
        .from('session_usage')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
    ]);

    // Calculate revenue from completed bookings
    const [completedGroupBookings, completedSessionUsage] = await Promise.all([
      supabase
        .from('group_bookings')
        .select('total_cost')
        .eq('status', 'completed')
        .not('total_cost', 'is', null),
      
      supabase
        .from('session_usage')
        .select('cost')
        .eq('status', 'completed')
        .not('cost', 'is', null)
    ]);

    // Calculate total revenue
    const groupRevenue = (completedGroupBookings.data || [])
      .reduce((sum, booking) => sum + (parseFloat(booking.total_cost) || 0), 0);
    
    const sessionRevenue = (completedSessionUsage.data || [])
      .reduce((sum, usage) => sum + (parseFloat(usage.cost) || 0), 0);
    
    const totalRevenue = groupRevenue + sessionRevenue;

    const stats = {
      totalBookings: (groupBookingsResult.count || 0) + (sessionUsageResult.count || 0),
      activeBookings: (activeGroupBookings.count || 0) + (activeSessionUsage.count || 0),
      todayBookings: (todayGroupBookingsResult.count || 0) + (todaySessionUsageResult.count || 0),
      totalRevenue: totalRevenue,
      groupBookings: groupBookingsResult.count || 0,
      individualBookings: sessionUsageResult.count || 0
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
