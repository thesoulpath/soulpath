'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Package, 
  Calendar, 
  CreditCard, 
  History, 
  Settings, 
  Star,
  Clock,
  DollarSign,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BaseButton } from './ui/BaseButton';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface CustomerStats {
  totalBookings: number;
  activePackages: number;
  totalSpent: number;
  upcomingSessions: number;
  completedSessions: number;
  averageRating: number;
  loyaltyPoints: number;
}

interface CustomerPackage {
  id: string;
  name: string;
  description: string;
  sessionsRemaining: number;
  totalSessions: number;
  expiresAt: string;
  status: 'active' | 'expired' | 'completed';
  purchaseDate: string;
  price: number;
}

interface CustomerBooking {
  id: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  sessionType: string;
  packageId?: string;
  packageName?: string;
  price: number;
  notes?: string;
  rating?: number;
  feedback?: string;
}

interface CustomerPurchase {
  id: string;
  date: string;
  packageName: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  transactionId: string;
}

export function CustomerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CustomerStats>({
    totalBookings: 0,
    activePackages: 0,
    totalSpent: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    averageRating: 0,
    loyaltyPoints: 0
  });
  const [packages, setPackages] = useState<CustomerPackage[]>([]);
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [purchases, setPurchases] = useState<CustomerPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');



  const loadCustomerData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadPackages(),
        loadBookings(),
        loadPurchases()
      ]);
    } catch (error) {
      console.error('Error loading customer data:', error);
      toast.error('Failed to load account data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.access_token) {
      loadCustomerData();
    }
  }, [user?.access_token, loadCustomerData]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/client/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPackages = async () => {
    try {
      const response = await fetch('/api/client/my-packages', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPackages(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await fetch('/api/client/my-bookings', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBookings(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const loadPurchases = async () => {
    try {
      const response = await fetch('/api/client/purchase-history', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPurchases(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending' },
      'confirmed': { color: 'bg-blue-500/20 text-blue-400', label: 'Confirmed' },
      'completed': { color: 'bg-green-500/20 text-green-400', label: 'Completed' },
      'cancelled': { color: 'bg-red-500/20 text-red-400', label: 'Cancelled' },
      'active': { color: 'bg-green-500/20 text-green-400', label: 'Active' },
      'expired': { color: 'bg-gray-500/20 text-gray-400', label: 'Expired' },
      'failed': { color: 'bg-red-500/20 text-red-400', label: 'Failed' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const upcomingBookings = bookings.filter(b => 
    b.status === 'confirmed' && new Date(b.date) > new Date()
  ).slice(0, 3);

  const recentBookings = bookings
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading text-white mb-2">My Account</h2>
          <p className="text-gray-400">Welcome back, {user?.email}</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/account/packages">
            <BaseButton className="dashboard-button-primary">
              <Package size={16} className="mr-2" />
              Buy Packages
            </BaseButton>
          </Link>
          <Link href="/account/book">
            <BaseButton className="dashboard-button-secondary">
              <Calendar size={16} className="mr-2" />
              Book Session
            </BaseButton>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a2e] border-[#16213e]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Bookings</p>
                <p className="text-2xl font-heading text-white">{stats.totalBookings}</p>
              </div>
              <Calendar size={24} className="text-[#ffd700]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-[#16213e]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Packages</p>
                <p className="text-2xl font-heading text-[#ffd700]">{stats.activePackages}</p>
              </div>
              <Package size={24} className="text-[#ffd700]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-[#16213e]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Spent</p>
                <p className="text-2xl font-heading text-green-400">
                  {formatCurrency(stats.totalSpent)}
                </p>
              </div>
              <DollarSign size={24} className="text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-[#16213e]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Loyalty Points</p>
                <p className="text-2xl font-heading text-purple-400">{stats.loyaltyPoints}</p>
              </div>
              <Star size={24} className="text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-[#1a1a2e] border border-[#16213e]">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#ffd700] data-[state=active]:text-black">
            Overview
          </TabsTrigger>
          <TabsTrigger value="packages" className="data-[state=active]:bg-[#ffd700] data-[state=active]:text-black">
            My Packages
          </TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-[#ffd700] data-[state=active]:text-black">
            Bookings
          </TabsTrigger>
          <TabsTrigger value="purchases" className="data-[state=active]:bg-[#ffd700] data-[state=active]:text-black">
            Purchase History
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#ffd700] data-[state=active]:text-black">
            Profile
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Sessions */}
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock size={20} className="mr-2 text-[#ffd700]" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar size={48} className="mx-auto text-gray-400/50 mb-4" />
                    <p className="text-gray-400 mb-2">No upcoming sessions</p>
                    <Link href="/account/book">
                      <BaseButton size="sm" className="dashboard-button-primary">
                        Book a Session
                      </BaseButton>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-[#16213e] rounded-lg">
                        <div>
                          <p className="text-white font-medium">{formatDate(booking.date)}</p>
                          <p className="text-sm text-gray-400">{booking.time} • {booking.sessionType}</p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <History size={20} className="mr-2 text-[#ffd700]" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        booking.status === 'completed' ? 'bg-green-400' :
                        booking.status === 'confirmed' ? 'bg-blue-400' :
                        booking.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                      <div className="flex-1">
                        <p className="text-white text-sm">{booking.sessionType}</p>
                        <p className="text-gray-400 text-xs">{formatDate(booking.date)}</p>
                      </div>
                      {booking.rating && (
                        <div className="flex items-center space-x-1">
                          <Star size={12} className="text-yellow-400" />
                          <span className="text-xs text-gray-400">{booking.rating}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-[#1a1a2e] border-[#16213e]">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/account/packages">
                  <BaseButton className="w-full dashboard-button-primary">
                    <Package size={16} className="mr-2" />
                    Buy New Package
                  </BaseButton>
                </Link>
                <Link href="/account/book">
                  <BaseButton className="w-full dashboard-button-secondary">
                    <Calendar size={16} className="mr-2" />
                    Schedule Session
                  </BaseButton>
                </Link>
                <Link href="/account/profile">
                  <BaseButton className="w-full dashboard-button-outline">
                    <Settings size={16} className="mr-2" />
                    Update Profile
                  </BaseButton>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-heading text-white">My Packages</h3>
            <Link href="/account/packages">
              <BaseButton className="dashboard-button-primary">
                <Package size={16} className="mr-2" />
                Buy More Packages
              </BaseButton>
            </Link>
          </div>

          {packages.length === 0 ? (
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardContent className="p-12 text-center">
                <Package size={48} className="mx-auto text-gray-400/50 mb-4" />
                <h3 className="text-lg font-heading text-white mb-2">No packages yet</h3>
                <p className="text-gray-400 mb-4">Purchase your first package to start your spiritual journey</p>
                <Link href="/account/packages">
                  <BaseButton className="dashboard-button-primary">
                    <Package size={16} className="mr-2" />
                    Browse Packages
                  </BaseButton>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="bg-[#1a1a2e] border-[#16213e] hover:border-[#ffd700]/30 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{pkg.name}</CardTitle>
                      {getStatusBadge(pkg.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-sm">{pkg.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Sessions Remaining:</span>
                        <span className="text-white font-medium">{pkg.sessionsRemaining}/{pkg.totalSessions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Purchase Date:</span>
                        <span className="text-white">{formatDate(pkg.purchaseDate)}</span>
                      </div>
                      {pkg.expiresAt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Expires:</span>
                          <span className="text-white">{formatDate(pkg.expiresAt)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-[#ffd700] font-medium">{formatCurrency(pkg.price)}</span>
                      </div>
                    </div>

                    {pkg.status === 'active' && pkg.sessionsRemaining > 0 && (
                      <Link href="/account/book">
                        <BaseButton className="w-full dashboard-button-primary">
                          <Calendar size={16} className="mr-2" />
                          Book Session
                        </BaseButton>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-heading text-white">My Bookings</h3>
            <Link href="/account/book">
              <BaseButton className="dashboard-button-primary">
                <Calendar size={16} className="mr-2" />
                New Booking
              </BaseButton>
            </Link>
          </div>

          {bookings.length === 0 ? (
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardContent className="p-12 text-center">
                <Calendar size={48} className="mx-auto text-gray-400/50 mb-4" />
                <h3 className="text-lg font-heading text-white mb-2">No bookings yet</h3>
                <p className="text-gray-400 mb-4">Schedule your first session to begin your spiritual journey</p>
                <Link href="/account/book">
                  <BaseButton className="dashboard-button-primary">
                    <Calendar size={16} className="mr-2" />
                    Book Session
                  </BaseButton>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-[#2a2a4a]">
                      <tr className="text-left">
                        <th className="p-4 text-sm font-medium text-gray-400">Date & Time</th>
                        <th className="p-4 text-sm font-medium text-gray-400">Session Type</th>
                        <th className="p-4 text-sm font-medium text-gray-400">Status</th>
                        <th className="p-4 text-sm font-medium text-gray-400">Price</th>
                        <th className="p-4 text-sm font-medium text-gray-400">Rating</th>
                        <th className="p-4 text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="border-b border-[#2a2a4a]/30 hover:bg-[#1a1a2e]/50">
                          <td className="p-4">
                            <div>
                              <p className="text-white font-medium">{formatDate(booking.date)}</p>
                              <p className="text-sm text-gray-400">{booking.time}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-white">{booking.sessionType}</p>
                            {booking.packageName && (
                              <p className="text-sm text-gray-400">{booking.packageName}</p>
                            )}
                          </td>
                          <td className="p-4">
                            {getStatusBadge(booking.status)}
                          </td>
                          <td className="p-4">
                            <p className="text-[#ffd700] font-medium">{formatCurrency(booking.price)}</p>
                          </td>
                          <td className="p-4">
                            {booking.rating ? (
                              <div className="flex items-center space-x-1">
                                <Star size={14} className="text-yellow-400" />
                                <span className="text-white">{booking.rating}/5</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              {booking.status === 'confirmed' && (
                                <BaseButton
                                  variant="outline"
                                  size="sm"
                                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                >
                                  Cancel
                                </BaseButton>
                              )}
                              {booking.status === 'completed' && !booking.rating && (
                                <BaseButton
                                  variant="outline"
                                  size="sm"
                                  className="border-[#ffd700]/30 text-[#ffd700] hover:bg-[#ffd700]/10"
                                >
                                  Rate
                                </BaseButton>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Purchase History Tab */}
        <TabsContent value="purchases" className="space-y-4">
          <h3 className="text-xl font-heading text-white">Purchase History</h3>

          {purchases.length === 0 ? (
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardContent className="p-12 text-center">
                <CreditCard size={48} className="mx-auto text-gray-400/50 mb-4" />
                <h3 className="text-lg font-heading text-white mb-2">No purchases yet</h3>
                <p className="text-gray-400 mb-4">Your purchase history will appear here</p>
                <Link href="/account/packages">
                  <BaseButton className="dashboard-button-primary">
                    <Package size={16} className="mr-2" />
                    Browse Packages
                  </BaseButton>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-[#2a2a4a]">
                      <tr className="text-left">
                        <th className="p-4 text-sm font-medium text-gray-400">Date</th>
                        <th className="p-4 text-sm font-medium text-gray-400">Package</th>
                        <th className="p-4 text-sm font-medium text-gray-400">Amount</th>
                        <th className="p-4 text-sm font-medium text-gray-400">Status</th>
                        <th className="p-4 text-sm font-medium text-gray-400">Payment Method</th>
                        <th className="p-4 text-sm font-medium text-gray-400">Transaction ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((purchase) => (
                        <tr key={purchase.id} className="border-b border-[#2a2a4a]/30 hover:bg-[#1a1a2e]/50">
                          <td className="p-4">
                            <p className="text-white">{formatDate(purchase.date)}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-white font-medium">{purchase.packageName}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-[#ffd700] font-medium">{formatCurrency(purchase.amount)}</p>
                          </td>
                          <td className="p-4">
                            {getStatusBadge(purchase.status)}
                          </td>
                          <td className="p-4">
                            <p className="text-white">{purchase.paymentMethod}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-gray-400 font-mono">{purchase.transactionId}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <h3 className="text-xl font-heading text-white">Account Profile</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User size={20} className="mr-2 text-[#ffd700]" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-white">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Member Since</p>
                  <p className="text-white">Member since {user?.email ? 'recently' : 'N/A'}</p>
                </div>
                <Link href="/account/profile">
                  <BaseButton className="w-full dashboard-button-outline">
                    <Settings size={16} className="mr-2" />
                    Edit Profile
                  </BaseButton>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield size={20} className="mr-2 text-[#ffd700]" />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Password</p>
                    <p className="text-sm text-gray-400">Last changed: Never</p>
                  </div>
                  <BaseButton variant="outline" size="sm" className="border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white">
                    Change
                  </BaseButton>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-400">Not enabled</p>
                  </div>
                  <BaseButton variant="outline" size="sm" className="border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white">
                    Enable
                  </BaseButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
