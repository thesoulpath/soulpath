'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PackageIcon, CalendarIcon, ClockIcon, ShoppingCart, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface UserPackage {
  id: string;
  packageId: number;
  packageName: string;
  packageDescription: string;
  sessionsRemaining: number;
  totalSessions: number;
  expiresAt: string;
  isActive: boolean;
  purchaseDate: string;
  price: number;
  sessionDuration: number;
  status: 'active' | 'expired' | 'completed';
}

export default function MyPackagesPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyPackages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/client/my-packages', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPackages(result.data);
      } else {
        console.error('Failed to fetch packages');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.access_token]);

  useEffect(() => {
    if (user?.access_token) {
      fetchMyPackages();
    }
  }, [user?.access_token, fetchMyPackages]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'expired':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading your packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">My Packages</h1>
        <p className="text-gray-400 mt-2">View your purchased spiritual consultation packages</p>
      </div>

      {packages.length === 0 ? (
        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <PackageIcon className="w-16 h-16 text-gray-500 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-300">No Packages Yet</h3>
              <p className="text-gray-400">
                You haven&apos;t purchased any packages yet. Start your spiritual journey today!
              </p>
              <Link href="/account/packages">
                <Button className="bg-[#ffd700] text-black hover:bg-[#ffd700]/90">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Browse Packages
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="bg-[#1a1a2e] border-[#16213e] text-white hover:border-[#ffd700]/50 transition-all">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <PackageIcon className="w-5 h-5 text-[#ffd700]" />
                    <CardTitle className="text-lg">{pkg.packageName}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(pkg.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(pkg.status)}
                      <span>{pkg.status}</span>
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">{pkg.packageDescription}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#ffd700]">{pkg.sessionsRemaining}</div>
                    <div className="text-xs text-gray-400">Sessions Left</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{pkg.totalSessions}</div>
                    <div className="text-xs text-gray-400">Total Sessions</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <ClockIcon className="w-4 h-4" />
                    <span>{pkg.sessionDuration} minutes per session</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Expires: {new Date(pkg.expiresAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2a2a4a]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-400">Purchase Date:</span>
                    <span className="text-sm text-white">{new Date(pkg.purchaseDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Price:</span>
                    <span className="text-sm font-bold text-[#ffd700]">${pkg.price.toFixed(2)}</span>
                  </div>
                </div>

                {pkg.status === 'active' && pkg.sessionsRemaining > 0 && (
                  <Link href="/account/book">
                    <Button className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Book Session
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Package Statistics */}
      {packages.length > 0 && (
        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardHeader>
            <CardTitle>Package Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#ffd700]">
                  {packages.filter(p => p.status === 'active').length}
                </div>
                <div className="text-sm text-gray-400">Active Packages</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {packages.reduce((sum, p) => sum + p.sessionsRemaining, 0)}
                </div>
                <div className="text-sm text-gray-400">Sessions Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {packages.reduce((sum, p) => sum + (p.totalSessions - p.sessionsRemaining), 0)}
                </div>
                <div className="text-sm text-gray-400">Sessions Used</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
