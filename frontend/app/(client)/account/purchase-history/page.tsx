'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ShoppingCart, 
  CreditCard, 
  PackageIcon, 
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PurchaseRecord {
  id: string;
  packageId: number;
  packageName: string;
  packageDescription: string;
  quantity: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  purchaseDate: string;
  currency: string;
  transactionId?: string;
  notes?: string;
}

export default function PurchaseHistoryPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const fetchPurchaseHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/client/purchase-history', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPurchases(result.data);
      } else {
        console.error('Failed to fetch purchase history');
      }
    } catch (error) {
      console.error('Error fetching purchase history:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.access_token]);

  useEffect(() => {
    if (user?.access_token) {
      fetchPurchaseHistory();
    }
  }, [user?.access_token, fetchPurchaseHistory]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed':
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || purchase.paymentStatus.toLowerCase() === statusFilter.toLowerCase();
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const purchaseDate = new Date(purchase.purchaseDate);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case '7days':
          matchesDate = daysDiff <= 7;
          break;
        case '30days':
          matchesDate = daysDiff <= 30;
          break;
        case '90days':
          matchesDate = daysDiff <= 90;
          break;
        case '1year':
          matchesDate = daysDiff <= 365;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
  const totalPurchases = purchases.length;
  const completedPurchases = purchases.filter(p => p.paymentStatus.toLowerCase() === 'completed').length;

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Purchase History</h1>
        <p className="text-gray-400 mt-2">View your complete purchase history and transaction details</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#ffd700]/20 rounded-full">
                <ShoppingCart className="w-6 h-6 text-[#ffd700]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{totalPurchases}</div>
                <div className="text-sm text-gray-400">Total Purchases</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/20 rounded-full">
                <CreditCard className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">${totalSpent.toFixed(2)}</div>
                <div className="text-sm text-gray-400">Total Spent</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/20 rounded-full">
                <PackageIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{completedPurchases}</div>
                <div className="text-sm text-gray-400">Completed Orders</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search" className="text-gray-300">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search packages or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#16213e] border-[#0a0a23] text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status" className="text-gray-300">Payment Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-[#16213e] border-[#0a0a23] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#16213e] border-[#0a0a23] text-white">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date" className="text-gray-300">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="bg-[#16213e] border-[#0a0a23] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#16213e] border-[#0a0a23] text-white">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase History */}
      {filteredPurchases.length === 0 ? (
        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <ShoppingCart className="w-16 h-16 text-gray-500 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-300">No Purchases Found</h3>
              <p className="text-gray-400">
                {purchases.length === 0 
                  ? "You haven't made any purchases yet. Start your spiritual journey today!"
                  : "No purchases match your current filters. Try adjusting your search criteria."
                }
              </p>
              {purchases.length === 0 && (
                <Button className="bg-[#ffd700] text-black hover:bg-[#ffd700]/90">
                  <PackageIcon className="w-4 h-4 mr-2" />
                  Browse Packages
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPurchases.map((purchase) => (
            <Card key={purchase.id} className="bg-[#1a1a2e] border-[#16213e] text-white hover:border-[#ffd700]/50 transition-all">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <PackageIcon className="w-5 h-5 text-[#ffd700]" />
                    <CardTitle className="text-lg">{purchase.packageName}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(purchase.paymentStatus)}>
                    {purchase.paymentStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">{purchase.packageDescription}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">Purchase Date</div>
                    <div className="text-white font-medium">
                      {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Quantity</div>
                    <div className="text-white font-medium">{purchase.quantity}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Total Amount</div>
                    <div className="text-[#ffd700] font-bold">
                      {purchase.currency} {purchase.totalAmount.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Payment Method</div>
                    <div className="text-white font-medium">{purchase.paymentMethod}</div>
                  </div>
                </div>

                {purchase.transactionId && (
                  <div className="bg-[#16213e] p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Transaction ID</div>
                    <div className="text-white font-mono text-sm">{purchase.transactionId}</div>
                  </div>
                )}

                {purchase.notes && (
                  <div className="bg-[#16213e] p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Notes</div>
                    <div className="text-white text-sm">{purchase.notes}</div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" className="border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
