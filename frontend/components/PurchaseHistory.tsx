import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, CreditCard, Users, Clock, DollarSign, 
  TrendingUp, RefreshCw, Wallet, QrCode, Bitcoin
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { PaymentMethod, PaymentStatus } from '../lib/types';

interface UserPackage {
  id: number;
  package: {
    id: number;
    name: string;
    packageType: string;
    packagePrice: number;
    currency: {
      symbol: string;
      code: string;
    };
  };
  purchasedAt: string;
  purchasePrice: number;
  originalPrice: number;
  discountApplied?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentConfirmedAt?: string;
  sessionsRemaining: number;
  sessionsUsed: number;
  groupSessionsRemaining: number;
  groupSessionsUsed: number;
  expiresAt?: string;
  isActive: boolean;
}

interface PurchaseStats {
  totalPackages: number;
  totalSpent: number;
  totalSessions: number;
  activePackages: number;
  expiredPackages: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
}

export function PurchaseHistory() {
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const { user } = useAuth();



  const loadPurchaseHistory = async () => {
    if (!user?.access_token) return;
    
    setIsLoading(true);
    try {
      // Load user packages
      const packagesResponse = await fetch(`/api/client/my-packages`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json();
        setUserPackages(packagesData.data || []);
      }

      // Load purchase history
      const purchaseResponse = await fetch(`/api/client/purchase-history`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
              if (purchaseResponse.ok) {
          // Purchase data loaded successfully
        }
    } catch {
      // Error loading purchase history
      toast.error('Failed to load purchase history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.access_token) {
      loadPurchaseHistory();
    }
  }, [user?.access_token, loadPurchaseHistory]);

  const calculateStats = (): PurchaseStats => {
    const totalPackages = userPackages.length;
    const totalSpent = userPackages.reduce((sum, pkg) => sum + Number(pkg.purchasePrice), 0);
    const totalSessions = userPackages.reduce((sum, pkg) => 
      sum + pkg.sessionsUsed + pkg.groupSessionsUsed, 0);
    const activePackages = userPackages.filter(pkg => pkg.isActive).length;
    const expiredPackages = userPackages.filter(pkg => 
      pkg.expiresAt && new Date(pkg.expiresAt) < new Date()
    ).length;
    const pendingPayments = userPackages.filter(pkg => pkg.paymentStatus === 'pending').length;
    const completedPayments = userPackages.filter(pkg => pkg.paymentStatus === 'completed').length;
    const failedPayments = userPackages.filter(pkg => pkg.paymentStatus === 'failed').length;

    return {
      totalPackages,
      totalSpent,
      totalSessions,
      activePackages,
      expiredPackages,
      pendingPayments,
      completedPayments,
      failedPayments
    };
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      'completed': { color: 'bg-green-500/20 text-green-400', label: 'Paid' },
      'pending': { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending' },
      'failed': { color: 'bg-red-500/20 text-red-400', label: 'Failed' },
      'refunded': { color: 'bg-blue-500/20 text-blue-400', label: 'Refunded' },
      'cancelled': { color: 'bg-gray-500/20 text-gray-400', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPaymentMethodIcon = (method?: PaymentMethod) => {
    switch (method) {
      case 'credit_card': return <CreditCard size={16} />;
      case 'cash': return <DollarSign size={16} />;
      case 'bank_transfer': return <TrendingUp size={16} />;
      case 'qr_payment': return <QrCode size={16} />;
      case 'crypto': return <Bitcoin size={16} />;
      case 'pay_later': return <Clock size={16} />;
      default: return <Wallet size={16} />;
    }
  };

  const getPaymentMethodLabel = (method?: PaymentMethod) => {
    switch (method) {
      case 'credit_card': return 'Credit Card';
      case 'cash': return 'Cash';
      case 'bank_transfer': return 'Bank Transfer';
      case 'qr_payment': return 'QR Payment';
      case 'crypto': return 'Cryptocurrency';
      case 'pay_later': return 'Pay Later';
      default: return 'Unknown';
    }
  };

  const formatCurrency = (amount: number, symbol: string) => {
    return `${symbol}${amount.toFixed(2)}`;
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-[#FFD700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalPackages}</div>
            <p className="text-xs text-gray-400">Purchased packages</p>
          </CardContent>
        </Card>

        <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-[#FFD700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(stats.totalSpent, '$')}
            </div>
            <p className="text-xs text-gray-400">Total investment</p>
          </CardContent>
        </Card>

        <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-[#FFD700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalSessions}</div>
            <p className="text-xs text-gray-400">Sessions used</p>
          </CardContent>
        </Card>

        <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Payment Status</CardTitle>
            <CreditCard className="h-4 w-4 text-[#FFD700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.completedPayments}</div>
            <p className="text-xs text-gray-400">
              {stats.pendingPayments > 0 && `${stats.pendingPayments} pending`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[180px] bg-[#191970]/30 border-[#C0C0C0]/20 text-white">
            <SelectValue placeholder="Date Filter" />
          </SelectTrigger>
                          <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="all" className="dashboard-dropdown-item">All Time</SelectItem>
                  <SelectItem value="30" className="dashboard-dropdown-item">Last 30 Days</SelectItem>
                  <SelectItem value="90" className="dashboard-dropdown-item">Last 90 Days</SelectItem>
                  <SelectItem value="365" className="dashboard-dropdown-item">Last Year</SelectItem>
                </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-[#191970]/30 border-[#C0C0C0]/20 text-white">
            <SelectValue placeholder="Status Filter" />
          </SelectTrigger>
                          <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="all" className="dashboard-dropdown-item">All Statuses</SelectItem>
                  <SelectItem value="active" className="dashboard-dropdown-item">Active</SelectItem>
                  <SelectItem value="expired" className="dashboard-dropdown-item">Expired</SelectItem>
                  <SelectItem value="completed" className="dashboard-dropdown-item">Completed</SelectItem>
                </SelectContent>
        </Select>

        <Select value={paymentStatusFilter} onValueChange={(value: PaymentStatus | 'all') => setPaymentStatusFilter(value)}>
          <SelectTrigger className="w-[180px] bg-[#191970]/30 border-[#C0C0C0]/20 text-white">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
                          <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="all" className="dashboard-dropdown-item">All Payments</SelectItem>
                  <SelectItem value="completed" className="dashboard-dropdown-item">Completed</SelectItem>
                  <SelectItem value="pending" className="dashboard-dropdown-item">Pending</SelectItem>
                  <SelectItem value="failed" className="dashboard-dropdown-item">Failed</SelectItem>
                  <SelectItem value="refunded" className="dashboard-dropdown-item">Refunded</SelectItem>
                </SelectContent>
        </Select>

        <Button
          onClick={loadPurchaseHistory}
          className="dashboard-button-reload"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 dashboard-tabs-list">
          <TabsTrigger 
            value="overview" 
            className="dashboard-tab-trigger"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="packages" 
            className="dashboard-tab-trigger"
          >
            Packages
          </TabsTrigger>
          <TabsTrigger 
            value="sessions" 
            className="dashboard-tab-trigger"
          >
            Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Payment Status Summary */}
          <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
            <CardHeader>
              <CardTitle className="text-white">Payment Status Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.completedPayments}</div>
                  <div className="text-sm text-gray-400">Completed Payments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{stats.pendingPayments}</div>
                  <div className="text-sm text-gray-400">Pending Payments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{stats.failedPayments}</div>
                  <div className="text-sm text-gray-400">Failed Payments</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userPackages.slice(0, 5).map((pkg) => (
                  <div key={pkg.id} className="flex items-center justify-between p-3 bg-[#191970]/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-[#FFD700]" />
                      <div>
                        <div className="text-white font-medium">{pkg.package.name}</div>
                        <div className="text-sm text-gray-400">
                          {new Date(pkg.purchasedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPaymentStatusBadge(pkg.paymentStatus)}
                      {pkg.paymentMethod && (
                        <div className="flex items-center gap-1 text-gray-400">
                          {getPaymentMethodIcon(pkg.paymentMethod)}
                          <span className="text-xs">{getPaymentMethodLabel(pkg.paymentMethod)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <Card className="bg-[#191970]/30 border-[#C0C0C0]/20">
            <CardHeader>
              <CardTitle className="text-white">Purchased Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userPackages.map((pkg) => (
                  <div key={pkg.id} className="border border-[#C0C0C0]/20 rounded-lg p-4 bg-[#191970]/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Package className="h-6 w-6 text-[#FFD700]" />
                        <div>
                          <h3 className="text-lg font-semibold text-white">{pkg.package.name}</h3>
                          <p className="text-sm text-gray-400">
                            {pkg.package.packageType} Package
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPaymentStatusBadge(pkg.paymentStatus)}
                        {pkg.paymentMethod && (
                          <div className="flex items-center gap-1 text-gray-400">
                            {getPaymentMethodIcon(pkg.paymentMethod)}
                            <span className="text-xs">{getPaymentMethodLabel(pkg.paymentMethod)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 mb-3">
                      <div>
                        <div className="text-sm text-gray-400">Purchase Price</div>
                        <div className="text-white font-medium">
                          {formatCurrency(pkg.purchasePrice, pkg.package.currency.symbol)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Sessions Remaining</div>
                        <div className="text-white font-medium">
                          {pkg.sessionsRemaining} / {pkg.sessionsRemaining + pkg.sessionsUsed}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Group Sessions</div>
                        <div className="text-white font-medium">
                          {pkg.groupSessionsRemaining} / {pkg.groupSessionsRemaining + pkg.groupSessionsUsed}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Purchased: {new Date(pkg.purchasedAt).toLocaleDateString()}</span>
                      {pkg.expiresAt && (
                        <span>Expires: {new Date(pkg.expiresAt).toLocaleDateString()}</span>
                      )}
                      {pkg.paymentConfirmedAt && (
                        <span>Payment Confirmed: {new Date(pkg.paymentConfirmedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}

                {userPackages.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No packages purchased yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
