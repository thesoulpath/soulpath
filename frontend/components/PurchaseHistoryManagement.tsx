import { useState, useEffect, useCallback } from 'react';
import { 
  Package, Clock, DollarSign, 
  Download, RefreshCw,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { BaseButton } from './ui/BaseButton';
import { BaseInput } from './ui/BaseInput';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';


import { useAuth } from '../hooks/useAuth';

interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: string;
}

interface PackageDefinition {
  id: number;
  name: string;
  description: string;
  sessions_count: number;
  package_type: 'individual' | 'group' | 'mixed';
  max_group_size: number;
  session_durations: {
    id: number;
    name: string;
    duration_minutes: number;
  };
}

interface PackagePrice {
  id: number;
  price: number;
  pricing_mode: 'custom' | 'calculated';
  is_active: boolean;
  currencies: {
    id: number;
    code: string;
    name: string;
    symbol: string;
    exchange_rate: number;
  };
}

interface UserPackage {
  id: number;
  client_id: number;
  package_price_id: number;
  sessions_remaining: number;
  sessions_used: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  clients?: Client;
  package_definitions?: PackageDefinition;
  package_prices?: PackagePrice;
}

interface Booking {
  id: number;
  client_id: number;
  clientEmail: string;
  schedule_slot_id: number;
  user_package_id: number;
  booking_type: 'individual' | 'group';
  group_size?: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  total_amount?: number;
  discount_amount: number;
  final_amount?: number;
  created_at: string;
  updated_at: string;
  clients?: Client;
  user_packages?: UserPackage;
  schedule_slots?: {
    id: number;
    start_time: string;
    end_time: string;
    capacity: number;
    booked_count: number;
  };
}

interface PurchaseStats {
  totalRevenue: number;
  totalPackages: number;
  totalSessions: number;
  activePackages: number;
  expiredPackages: number;
  averagePackageValue: number;
  topPerformingPackages: Array<{
    name: string;
    revenue: number;
    count: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    packages: number;
  }>;
}

interface Filters {
  clientId: string;
  packageType: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  paymentStatus: string;
}

const PurchaseHistoryManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('packages');
  const [loading, setLoading] = useState(true);
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null);
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<PurchaseStats | null>(null);
  const [filters, setFilters] = useState<Filters>({
    clientId: 'all',
    packageType: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    paymentStatus: 'all'
  });



  const fetchData = useCallback(async () => {
    try {
      console.log('🔍 fetchData called, user:', user);
      console.log('🔍 access_token exists:', !!user?.access_token);
      console.log('🔍 access_token length:', user?.access_token?.length);

      if (!user?.access_token) {
        console.log('❌ No access token, cannot load purchase history data');
        return;
      }

      setLoading(true);
      console.log('Loading purchase history data...');

      await Promise.all([
        fetchUserPackages(),
        fetchBookings(),
        fetchClients(),
        fetchStats()
      ]);

      setLastLoaded(new Date());
      console.log('✅ Purchase history data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching purchase history data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  // Add a manual refresh function that can be called from parent components
  const refreshPurchaseHistoryData = useCallback(() => {
    if (user?.access_token) {
      console.log('Manual refresh requested...');
      fetchData();
    }
  }, [user?.access_token, fetchData]);

  useEffect(() => {
    if (user?.access_token) {
      console.log('User authenticated, loading purchase history data...');
      fetchData();
    } else {
      console.log('User not authenticated, clearing purchase history data...');
      setUserPackages([]);
      setBookings([]);
      setClients([]);
      setStats(null);
      setLoading(false);
    }
  }, [user?.access_token, fetchData]);

  // Refresh data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.access_token && userPackages.length === 0) {
        console.log('Component became visible, refreshing purchase history data...');
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.access_token, userPackages.length, fetchData]);

  // Additional effect to handle component mounting/navigation
  useEffect(() => {
    if (user?.access_token && userPackages.length === 0) {
      console.log('Component mounted or navigated to, loading purchase history data...');
      fetchData();
    }
  }, [user?.access_token, userPackages.length, fetchData]);

  // Expose refresh function to parent components if needed
  useEffect(() => {
    // @ts-expect-error - Exposing refresh function globally for debugging
    window.refreshPurchaseHistoryData = refreshPurchaseHistoryData;

    return () => {
      // @ts-expect-error - Clean up global function
      delete window.refreshPurchaseHistoryData;
    };
  }, [refreshPurchaseHistoryData]);

  // Listen for navigation events and refresh data when needed
  useEffect(() => {
    const handleNavigation = () => {
      // Small delay to ensure the component is fully mounted
      setTimeout(() => {
        if (user?.access_token && userPackages.length === 0) {
          console.log('Navigation detected, refreshing purchase history data...');
          fetchData();
        }
      }, 100);
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, [user?.access_token, userPackages.length, fetchData]);

  const fetchUserPackages = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.clientId !== 'all') params.append('client_id', filters.clientId);
      if (filters.packageType !== 'all') params.append('package_type', filters.packageType);
      if (filters.status !== 'all') params.append('is_active', filters.status === 'active' ? 'true' : 'false');
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);

      const response = await fetch(`/api/admin/user-packages?${params}`, {
        headers: {
          'Authorization': `Bearer ${user!.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setUserPackages(data.data);
      } else {
        toast.error('Failed to fetch user packages');
      }
    } catch (error) {
      console.error('Error fetching user packages:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.clientId !== 'all') params.append('client_id', filters.clientId);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);

      const response = await fetch(`/api/admin/bookings?${params}`, {
        headers: {
          'Authorization': `Bearer ${user!.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setBookings(data.data);
      } else {
        toast.error('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${user!.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/bookings/stats', {
        headers: {
          'Authorization': `Bearer ${user!.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getPackageTypeBadge = (type: string) => {
    const variants = {
      individual: 'dashboard-badge-info',
      group: 'dashboard-badge-success',
      mixed: 'dashboard-badge-warning'
    };
    return <Badge className={variants[type as keyof typeof variants]}>{type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'dashboard-badge-warning',
      confirmed: 'dashboard-badge-info',
      completed: 'dashboard-badge-success',
      cancelled: 'dashboard-badge-error',
      'no-show': 'dashboard-badge-error'
    };
    return <Badge className={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const getPaymentStatusBadge = (isActive: boolean) => {
    return isActive ? 
      <Badge className="dashboard-badge-success">Active</Badge> : 
      <Badge className="dashboard-badge-error">Inactive</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount: number, currencySymbol: string) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const exportData = (type: 'packages' | 'bookings') => {
    // Implementation for data export
    toast.info(`Exporting ${type} data...`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading purchase history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="dashboard-text-primary text-3xl font-bold">Purchase History & Analytics</h1>
          <p className="dashboard-text-secondary">Track package purchases, usage patterns, and revenue analytics</p>
          {lastLoaded && (
            <p className="text-sm text-gray-400 mt-1">
              Last updated: {lastLoaded.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <BaseButton
            onClick={() => exportData(activeTab as 'packages' | 'bookings')}
            className="dashboard-button-outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </BaseButton>
          <BaseButton
            onClick={refreshPurchaseHistoryData}
            disabled={loading}
            className="dashboard-button-reload"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </BaseButton>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="dashboard-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-dashboard-text-secondary">Total Revenue</p>
                  <p className="text-2xl font-bold text-dashboard-text-primary">
                    ${stats.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-dashboard-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-dashboard-text-secondary">Total Packages</p>
                  <p className="text-2xl font-bold text-dashboard-text-primary">
                    {stats.totalPackages}
                  </p>
                </div>
                <Package className="w-8 h-8 text-dashboard-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-dashboard-text-secondary">Active Packages</p>
                  <p className="text-2xl font-bold text-dashboard-text-primary">
                    {stats.activePackages}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-dashboard-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-dashboard-text-secondary">Total Sessions</p>
                  <p className="text-2xl font-bold text-dashboard-text-primary">
                    {stats.totalSessions}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-dashboard-accent" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="dashboard-card-title">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="dashboard-label">Client</Label>
              <Select
                value={filters.clientId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, clientId: value }))}
              >
                <SelectTrigger className="dashboard-input">
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="dashboard-label">Package Type</Label>
              <Select
                value={filters.packageType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, packageType: value }))}
              >
                <SelectTrigger className="dashboard-input">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="dashboard-label">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="dashboard-input">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="dashboard-label">Date From</Label>
              <BaseInput
                type="date"
                className="dashboard-input"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="dashboard-label">Date To</Label>
              <BaseInput
                type="date"
                className="dashboard-input"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 dashboard-tabs">
          <TabsTrigger value="packages" className="dashboard-tab">
            <Package className="w-4 h-4 mr-2" />
            Package Purchases
          </TabsTrigger>
          <TabsTrigger value="bookings" className="dashboard-tab">
            <Calendar className="w-4 h-4 mr-2" />
            Session Bookings
          </TabsTrigger>
        </TabsList>

        {/* Package Purchases Tab */}
        <TabsContent value="packages" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="dashboard-card-title">Package Purchases</CardTitle>
              <CardDescription>
                Showing {userPackages.length} package purchases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userPackages.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No package purchases found</p>
                  <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Client</th>
                        <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Package</th>
                        <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Price</th>
                        <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Sessions</th>
                        <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Purchase Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userPackages.map((userPackage) => (
                        <tr key={userPackage.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                                                          <p className="font-medium text-dashboard-text-primary">{userPackage.clients?.name || 'Unknown Client'}</p>
                            <p className="text-sm text-dashboard-text-secondary">{userPackage.clients?.email || 'No email'}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-dashboard-text-primary">
                                {userPackage.package_definitions?.name || 'No package'}
                              </p>
                              <p className="text-sm text-dashboard-text-secondary">
                                {userPackage.package_definitions?.description || 'No description'}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                                                          {getPackageTypeBadge(userPackage.package_definitions?.package_type || 'individual')}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-dashboard-text-primary">
                                {formatCurrency(userPackage.package_prices?.price || 0, userPackage.package_prices?.currencies?.symbol || '$')}
                              </p>
                              <p className="text-sm text-dashboard-text-secondary">
                                {userPackage.package_prices?.pricing_mode || 'custom'}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-dashboard-text-primary">
                                {userPackage.sessions_remaining} remaining
                              </p>
                              <p className="text-sm text-dashboard-text-secondary">
                                {userPackage.sessions_used} used of {userPackage.package_definitions?.sessions_count || 0}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {getPaymentStatusBadge(userPackage.is_active)}
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-dashboard-text-secondary">
                              {formatDate(userPackage.created_at)}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="dashboard-card-title">Session Bookings</CardTitle>
              <CardDescription>
                Showing {bookings.length} session bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No session bookings found</p>
                  <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Client</th>
                        <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Package</th>
                        <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Date & Time</th>
                        <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-dashboard-text-primary">
                                {booking.clients?.name || booking.clientEmail || 'Unknown Client'}
                              </p>
                              <p className="text-sm text-dashboard-text-secondary">
                                {booking.clients?.email || booking.clientEmail || 'No email'}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-dashboard-text-primary">
                                {booking.user_packages?.package_definitions?.name || 'No package'}
                              </p>
                              <p className="text-sm text-dashboard-text-secondary">
                                {booking.user_packages?.package_definitions?.session_durations?.duration_minutes || '0'} min
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              {getPackageTypeBadge(booking.booking_type)}
                              {booking.booking_type === 'group' && booking.group_size && (
                                <p className="text-sm text-dashboard-text-secondary mt-1">
                                  Size: {booking.group_size}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-dashboard-text-primary">
                                {booking.schedule_slots ? formatDate(booking.schedule_slots.start_time) : 'No slot'}
                              </p>
                              <p className="text-sm text-dashboard-text-secondary">
                                {booking.schedule_slots ? formatDateTime(booking.schedule_slots.start_time) : 'No time'}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(booking.status)}
                          </td>
                          <td className="py-3 px-4">
                            {booking.final_amount ? (
                              <div>
                                <p className="font-medium text-dashboard-text-primary">
                                  ${booking.final_amount}
                                </p>
                                {booking.discount_amount > 0 && (
                                  <p className="text-sm text-dashboard-text-secondary">
                                    -${booking.discount_amount} discount
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-dashboard-text-secondary">Not set</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-dashboard-text-secondary">
                              {formatDate(booking.created_at)}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PurchaseHistoryManagement;
