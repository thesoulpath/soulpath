'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, PackageIcon, ShoppingCart, Settings } from 'lucide-react';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { BugReportButton } from '@/components/BugReportButton';
import { CustomerDashboard } from '@/components/CustomerDashboard';

// interface DashboardStats { // Unused for now
//   totalBookings: number;
//   activePackages: number;
//   totalSpent: number;
//   upcomingSessions: number;
// }

export default function AccountPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (user?.access_token) {
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Admin Button */}
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-white">Welcome to Your Account</h1>
          <p className="text-gray-400 mt-2">Manage your spiritual journey and sessions</p>
        </div>
        
        {/* Admin Dashboard Button - Only show for admin users */}
        {isAdmin && (
          <Link href="/admin">
            <Button className="bg-[#ffd700] text-black hover:bg-[#ffd700]/90">
              <Settings className="w-4 h-4 mr-2" />
              Admin Dashboard
            </Button>
          </Link>
        )}
      </div>

      {/* Customer Dashboard Component */}
      <CustomerDashboard />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#1a1a2e] border-[#16213e] hover:border-[#ffd700]/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <PackageIcon className="w-5 h-5 text-[#ffd700] mr-2" />
              Buy Packages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">
              Explore our spiritual consultation packages and find the perfect one for your journey.
            </p>
            <Link href="/account/packages">
              <Button className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Browse Packages
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-[#16213e] hover:border-[#ffd700]/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <CalendarIcon className="w-5 h-5 text-[#ffd700] mr-2" />
              Book Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">
              Schedule your next spiritual consultation using your purchased packages.
            </p>
            <Link href="/account/book">
              <Button className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Book Now
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-[#16213e] hover:border-[#ffd700]/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="w-5 h-5 text-[#ffd700] mr-2" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">
              Update your profile information and manage your account preferences.
            </p>
            <Link href="/account/profile">
              <Button className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90">
                <Settings className="w-4 h-4 mr-2" />
                Manage Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Bug Report Button */}
      <div className="flex justify-center">
        <BugReportButton />
      </div>
    </div>
  );
}
