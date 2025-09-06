import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { withCache } from '@/lib/cache';
import { withApiOptimization } from '@/lib/middleware/performance';

interface BookingData {
  id: string;
  status: string;
  created_at: string;
  rating?: number;
}



interface PurchaseData {
  id: string;
  total_amount: number;
  payment_status: string;
  purchased_at: string;
}

interface PackageWithDetails {
  id: string;
  is_active: boolean;
  sessions_used: number;
  quantity: number;
  expires_at: string;
  package_prices?: Array<{
    package_definitions?: Array<{
      name: string;
      description?: string;
      sessions_count: number;
    }>;
    price: number;
    currency?: {
      symbol: string;
      code: string;
    };
  }>;
}



async function handler(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const user = await requireAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Cache key based on user email
    const cacheKey = `dashboard-stats-${user.email}`;

    return withCache(
      cacheKey,
      async () => {
        // Get customer ID from user
        const { data: customer, error: customerError } = await supabase
          .from('users')
          .select('id, email, created_at')
          .eq('email', user.email)
          .single();

        if (customerError || !customer) {
          throw new Error('Customer not found');
        }

    // Get all dashboard data in parallel for better performance
    const [bookingsResult, packagesResult, purchasesResult] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, status, created_at, completed_at, rating')
        .eq('user_id', customer.id),
      supabase
        .from('user_packages')
        .select(`
          id,
          is_active,
          sessions_used,
          quantity,
          expires_at,
          package_prices (
            package_definitions (
              name,
              description,
              sessions_count
            ),
            price,
            currency (
              symbol,
              code
            )
          )
        `)
        .eq('user_id', customer.id)
        .returns<PackageWithDetails[]>(),
      supabase
        .from('purchases')
        .select(`
          id,
          total_amount,
          payment_status,
          purchased_at,
          payment_method
        `)
        .eq('user_id', customer.id)
    ]);

    if (bookingsResult.error) {
      console.error('Error fetching bookings:', bookingsResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    if (packagesResult.error) {
      console.error('Error fetching packages:', packagesResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch packages' },
        { status: 500 }
      );
    }

    if (purchasesResult.error) {
      console.error('Error fetching purchases:', purchasesResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch purchases' },
        { status: 500 }
      );
    }

    const bookings = bookingsResult.data;
    const packages = packagesResult.data;
    const purchases = purchasesResult.data;

    // Calculate statistics
    const totalBookings = bookings?.length || 0;
    const completedBookings = bookings?.filter((b: BookingData) => b.status === 'completed').length || 0;
    const upcomingBookings = bookings?.filter((b: BookingData) =>
      b.status === 'confirmed' && new Date(b.created_at) > new Date()
    ).length || 0;

    const activePackages = (packages as PackageWithDetails[])?.filter((p: PackageWithDetails) => {
      const packagePrice = p.package_prices?.[0];
      const sessionsCount = packagePrice?.package_definitions?.[0]?.sessions_count || 0;
      const totalSessions = sessionsCount * (p.quantity || 1);
      const sessionsRemaining = totalSessions - (p.sessions_used || 0);
      return p.is_active && sessionsRemaining > 0;
    }).length || 0;

    const totalSpent = purchases?.reduce((sum: number, purchase: PurchaseData) => {
      if (purchase.payment_status === 'completed') {
        return sum + (purchase.total_amount || 0);
      }
      return sum;
    }, 0) || 0;

    const averageRating = bookings?.length > 0
      ? bookings
          .filter((b: BookingData) => b.rating)
          .reduce((sum: number, b: BookingData) => sum + (b.rating || 0), 0) /
          bookings.filter((b: BookingData) => b.rating).length
      : 0;

    // Calculate loyalty points (example: 1 point per $10 spent + 1 point per completed booking)
    const loyaltyPoints = Math.floor(totalSpent / 10) + completedBookings;

    const stats = {
      totalBookings,
      activePackages,
      totalSpent,
      upcomingSessions: upcomingBookings,
      completedSessions: completedBookings,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      loyaltyPoints
    };

        return NextResponse.json({
          success: true,
          data: stats
        });
      },
      5 * 60 * 1000 // Cache for 5 minutes
    );

  } catch (error) {
    console.error('Error in dashboard stats:', error);
    if (error instanceof Error && error.message === 'Customer not found') {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

// Export with performance optimization
export const GET = withApiOptimization(handler, {
  cache: true,
  cacheTTL: 300, // 5 minutes
  compress: true,
  rateLimit: true,
  rateLimitMax: 50 // 50 requests per 15 minutes for dashboard
});

