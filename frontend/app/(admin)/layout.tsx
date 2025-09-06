'use client';

import { AdminDashboard } from '@/components/AdminDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're sure the user is not an admin and not loading
    if (!isLoading && (!user || !isAdmin)) {
      // Instead of redirecting to homepage, redirect to account page
      router.push('/account');
    }
  }, [user, isAdmin, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0a23] via-[#1a1a2e] to-[#16213e]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message for non-admin users
  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0a23] via-[#1a1a2e] to-[#16213e]">
        <div className="text-center max-w-md mx-auto p-8">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            You don&apos;t have permission to access the admin dashboard. Please contact an administrator if you believe this is an error.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push('/account')}
              className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Account
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="bg-[#16213e] border-[#0a0a23] text-white hover:bg-[#0a0a23]"
            >
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminDashboard isModal={false}>
      {children}
    </AdminDashboard>
  );
}
