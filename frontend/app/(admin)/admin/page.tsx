'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AdminDashboard } from '@/components/AdminDashboard';

export default function AdminPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and user is not admin, redirect to home
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isLoading, isAdmin, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  // If not admin, show access denied (will redirect in useEffect)
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Access Denied</p>
          <p className="text-[var(--color-text-secondary)] text-sm">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Render admin dashboard in page mode
  return (
    <AdminDashboard 
      isModal={false}
      onClose={() => router.push('/')} 
    />
  );
}
