'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, DollarSign, Calendar, User, Package, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

// New interfaces for Purchase model
interface Purchase {
  id: number;
  userId: string;
  totalAmount: number;
  currencyCode: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string;
  notes?: string;
  purchasedAt?: string;
  confirmedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
  userPackages?: UserPackage[];
}

interface UserPackage {
  id: number;
  userId: string;
  purchaseId: number;
  packagePriceId: number;
  quantity?: number;
  sessionsUsed?: number;
  isActive?: boolean;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  packagePrice?: {
    id: number;
    price: number;
    packageDefinition?: {
      id: number;
      name: string;
      sessionsCount: number;
    };
  };
}

interface PurchaseFormData {
  userId: string;
  totalAmount: number;
  currencyCode: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string;
  notes: string;
}

interface PurchaseFilters {
  userId: string;
  paymentMethod: string;
  paymentStatus: string;
  dateFrom: string;
  dateTo: string;
  amountMin?: number;
  amountMax?: number;
}

const PaymentRecordsManagement: React.FC = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; email: string; fullName?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [formData, setFormData] = useState<PurchaseFormData>({
    userId: '',
    totalAmount: 0,
    currencyCode: 'USD',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    transactionId: '',
    notes: ''
  });
  const [filters, setFilters] = useState<PurchaseFilters>({
    userId: 'all',
    paymentMethod: 'all',
    paymentStatus: 'all',
    dateFrom: '',
    dateTo: '',
    amountMin: undefined,
    amountMax: undefined
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });



  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const authToken = user?.access_token;
      if (!authToken) {
        console.error('No auth token available for fetching purchases');
        return;
      }

      console.log('🔐 Fetching purchases with auth token:', authToken.substring(0, 10) + '...');

      const params = new URLSearchParams();
      
      // Add filters
      if (filters.userId && filters.userId !== 'all') params.append('userId', filters.userId);
      if (filters.paymentMethod && filters.paymentMethod !== 'all') params.append('paymentMethod', filters.paymentMethod);
      if (filters.paymentStatus && filters.paymentStatus !== 'all') params.append('paymentStatus', filters.paymentStatus);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.amountMin !== undefined) params.append('amountMin', filters.amountMin.toString());
      if (filters.amountMax !== undefined) params.append('amountMax', filters.amountMax.toString());
      
      // Add pagination
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const url = `/api/admin/purchases?${params}`;
      console.log('🌐 Making request to:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        toast.error(`Failed to fetch purchases: ${response.status} ${response.statusText}`);
        return;
      }
      
      const result = await response.json();
      console.log('✅ Purchases fetched successfully:', result);
      
      if (!result.success) {
        console.error('❌ API returned error:', result.error || result.message);
        toast.error(result.message || 'Failed to fetch purchases');
        return;
      }
      
      setPurchases(result.data || []);
      setPagination(prev => ({
        ...prev,
        total: result.pagination?.total || 0,
        totalPages: result.pagination?.totalPages || 0
      }));
    } catch (error) {
      console.error('❌ Error fetching purchases:', error);
      toast.error('Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  }, [user?.access_token, filters.userId, filters.paymentMethod, filters.paymentStatus, filters.dateFrom, filters.dateTo, filters.amountMin, filters.amountMax, pagination.page]);

  const fetchUsers = useCallback(async () => {
    try {
      const authToken = user?.access_token;
      if (!authToken) return;

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [user?.access_token]);

  // Refresh function for debugging
  const refreshData = useCallback(() => {
    console.log('🔄 Refreshing payment records data...');
    if (user?.access_token) {
      fetchPurchases();
      fetchUsers();
    }
  }, [user?.access_token, fetchPurchases, fetchUsers]);

  // Load data when component mounts or user changes
  useEffect(() => {
    console.log('🔐 PaymentRecordsManagement: User auth state changed:', {
      hasUser: !!user,
      hasToken: !!user?.access_token,
      userEmail: user?.email
    });

    if (user?.access_token) {
      fetchPurchases();
      fetchUsers();
    }
  }, [user?.access_token, fetchPurchases, fetchUsers]);

  // Load purchases when filters or pagination change
  useEffect(() => {
    if (user?.access_token) {
      fetchPurchases();
    }
  }, [filters.userId, filters.paymentMethod, filters.paymentStatus, filters.dateFrom, filters.dateTo, filters.amountMin, filters.amountMax, pagination.page, fetchPurchases]);

  // Expose refresh function globally for debugging
  useEffect(() => {
    // @ts-expect-error - Exposing refresh function globally for debugging
    window.refreshPaymentRecordsData = refreshData;

    return () => {
      // @ts-expect-error - Clean up global function
      delete window.refreshPaymentRecordsData;
    };
  }, [refreshData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const authToken = user?.access_token;
      if (!authToken) {
        toast.error('Authentication required');
        return;
      }

      const url = editingPurchase 
        ? `/api/admin/purchases/${editingPurchase.id}` 
        : '/api/admin/purchases';
      
      const method = editingPurchase ? 'PUT' : 'POST';
      const body = editingPurchase 
        ? { ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to save purchase');

      toast.success(editingPurchase ? 'Purchase updated' : 'Purchase created');
      setShowCreateModal(false);
      setEditingPurchase(null);
      resetForm();
      fetchPurchases();
    } catch (error) {
      console.error('Error saving purchase:', error);
      toast.error('Failed to save purchase');
    }
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      userId: purchase.userId,
      totalAmount: purchase.totalAmount,
      currencyCode: purchase.currencyCode,
      paymentMethod: purchase.paymentMethod,
      paymentStatus: purchase.paymentStatus,
      transactionId: purchase.transactionId || '',
      notes: purchase.notes || ''
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this purchase?')) return;

    try {
      const authToken = user?.access_token;
      if (!authToken) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/admin/purchases/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete purchase');

      toast.success('Purchase deleted');
      fetchPurchases();
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast.error('Failed to delete purchase');
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      totalAmount: 0,
      currencyCode: 'USD',
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      transactionId: '',
      notes: ''
    });
  };

  const clearFilters = () => {
    setFilters({
      userId: 'all',
      paymentMethod: 'all',
      paymentStatus: 'all',
      dateFrom: '',
      dateTo: '',
      amountMin: undefined,
      amountMax: undefined
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'dashboard-badge-success';
      case 'pending': return 'dashboard-badge-warning';
      case 'failed': return 'dashboard-badge-error';
      case 'refunded': return 'dashboard-badge-info';
      case 'cancelled': return 'dashboard-badge-error';
      default: return 'dashboard-badge';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <DollarSign className="h-4 w-4 dashboard-text-muted" />;
      case 'bank_transfer': return <DollarSign className="h-4 w-4 dashboard-text-muted" />;
      case 'credit_card': return <DollarSign className="h-4 w-4 dashboard-text-muted" />;
      case 'qr_payment': return <DollarSign className="h-4 w-4 dashboard-text-muted" />;
      case 'crypto': return <DollarSign className="h-4 w-4 dashboard-text-muted" />;
      case 'pay_later': return <DollarSign className="h-4 w-4 dashboard-text-muted" />;
      default: return <DollarSign className="h-4 w-4 dashboard-text-muted" />;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="dashboard-container p-6">
        <div className="text-center">
          <h2 className="dashboard-text-primary text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="dashboard-text-secondary">Please log in to access this feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="dashboard-text-primary text-3xl font-bold tracking-tight">
            Purchase Management
          </h2>
          <p className="dashboard-text-secondary">
            Track and manage all purchase transactions for packages
          </p>
        </div>
        <div className="flex gap-2">
          <BaseButton 
            onClick={() => setShowCreateModal(true)} 
            className="dashboard-button-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Purchase
          </BaseButton>
        </div>
      </div>

      {/* Filters */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="dashboard-card-title">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="dashboard-filter-grid">
            <div className="dashboard-filter-item">
              <Label htmlFor="user_id" className="dashboard-filter-label">User</Label>
              <Select 
                value={filters.userId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, userId: value }))}
              >
                <SelectTrigger className="dashboard-select">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="all" className="dashboard-dropdown-item">All users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id} className="dashboard-dropdown-item">
                      {user.fullName || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="dashboard-filter-item">
              <Label htmlFor="payment_method" className="dashboard-filter-label">Payment Method</Label>
              <Select 
                value={filters.paymentMethod} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger className="dashboard-select">
                  <SelectValue placeholder="All payment methods" />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="all" className="dashboard-dropdown-item">All methods</SelectItem>
                  <SelectItem value="cash" className="dashboard-dropdown-item">Cash</SelectItem>
                  <SelectItem value="bank_transfer" className="dashboard-dropdown-item">Bank Transfer</SelectItem>
                  <SelectItem value="qr_payment" className="dashboard-dropdown-item">QR Payment</SelectItem>
                  <SelectItem value="credit_card" className="dashboard-dropdown-item">Credit Card</SelectItem>
                  <SelectItem value="crypto" className="dashboard-dropdown-item">Cryptocurrency</SelectItem>
                  <SelectItem value="pay_later" className="dashboard-dropdown-item">Pay Later</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="dashboard-filter-item">
              <Label htmlFor="payment_status" className="dashboard-filter-label">Payment Status</Label>
              <Select 
                value={filters.paymentStatus} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}
              >
                <SelectTrigger className="dashboard-select">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="all" className="dashboard-dropdown-item">All statuses</SelectItem>
                  <SelectItem value="pending" className="dashboard-dropdown-item">Pending</SelectItem>
                  <SelectItem value="completed" className="dashboard-dropdown-item">Completed</SelectItem>
                  <SelectItem value="failed" className="dashboard-dropdown-item">Failed</SelectItem>
                  <SelectItem value="refunded" className="dashboard-dropdown-item">Refunded</SelectItem>
                  <SelectItem value="cancelled" className="dashboard-dropdown-item">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="dashboard-filter-item">
              <Label htmlFor="date_from" className="dashboard-filter-label">From Date</Label>
              <BaseInput
                id="date_from"
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="dashboard-input"
              />
            </div>

            <div className="dashboard-filter-item">
              <Label htmlFor="date_to" className="dashboard-filter-label">To Date</Label>
              <BaseInput
                id="date_to"
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="dashboard-input"
              />
            </div>

            <div className="dashboard-filter-item">
              <Label htmlFor="amount_min" className="dashboard-filter-label">Min Amount</Label>
              <BaseInput
                id="amount_min"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filters.amountMin || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value ? parseFloat(e.target.value) : undefined }))}
                className="dashboard-input"
              />
            </div>

            <div className="dashboard-filter-item">
              <Label htmlFor="amount_max" className="dashboard-filter-label">Max Amount</Label>
              <BaseInput
                id="amount_max"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filters.amountMax || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value ? parseFloat(e.target.value) : undefined }))}
                className="dashboard-input"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <BaseButton onClick={fetchPurchases} className="dashboard-button-primary">
              <Search className="mr-2 h-4 w-4" />
              Apply Filters
            </BaseButton>
            <BaseButton 
              onClick={clearFilters}
              className="dashboard-button-outline"
            >
              Clear Filters
            </BaseButton>
          </div>
        </CardContent>
      </Card>

      {/* Purchases Table */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="dashboard-card-title">Purchases</CardTitle>
          <CardDescription className="dashboard-card-description">
            All purchase transactions and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700] mx-auto"></div>
              <p className="dashboard-text-secondary mt-2">Loading purchases...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-8">
              <p className="dashboard-text-secondary">No purchases found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="border border-[#C0C0C0]/20 rounded-lg p-4 space-y-3 bg-[#191970]/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 dashboard-text-muted" />
                        <span className="dashboard-text-primary font-medium">
                          {purchase.user?.fullName || purchase.user?.email || 'Unknown User'}
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`dashboard-badge ${getPaymentStatusColor(purchase.paymentStatus)}`}
                      >
                        {purchase.paymentStatus}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <BaseButton
                        size="sm"
                        onClick={() => handleEdit(purchase)}
                        className="dashboard-button-outline"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </BaseButton>
                      <BaseButton
                        size="sm"
                        onClick={() => handleDelete(purchase.id)}
                        className="dashboard-button-danger"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </BaseButton>
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 dashboard-text-muted" />
                      <span className="dashboard-text-primary">
                        {formatCurrency(purchase.totalAmount, purchase.currencyCode)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(purchase.paymentMethod)}
                      <span className="dashboard-text-primary capitalize">
                        {purchase.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 dashboard-text-muted" />
                      <span className="dashboard-text-primary">
                        {formatDate(purchase.purchasedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 dashboard-text-muted" />
                      <span className="dashboard-text-primary">
                        {purchase.userPackages?.length || 0} packages
                      </span>
                    </div>
                  </div>

                  {purchase.transactionId && (
                    <div className="flex items-center gap-2">
                      <span className="dashboard-text-secondary text-sm">Transaction ID:</span>
                      <span className="dashboard-text-primary font-mono text-sm">{purchase.transactionId}</span>
                    </div>
                  )}

                  {purchase.notes && (
                    <div className="dashboard-text-muted text-sm">
                      <strong>Notes:</strong> {purchase.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#191970] border border-[#C0C0C0]/20 rounded-lg p-6 w-full max-w-md">
            <h3 className="dashboard-text-primary text-xl font-bold mb-4">
              {editingPurchase ? 'Edit Purchase' : 'Create Purchase'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="user_id" className="dashboard-label">User</Label>
                <Select 
                  value={formData.userId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, userId: value }))}
                >
                  <SelectTrigger className="dashboard-select">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="dashboard-dropdown-content">
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id} className="dashboard-dropdown-item">
                        {user.fullName || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="total_amount" className="dashboard-label">Total Amount</Label>
                <BaseInput
                  id="total_amount"
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                  className="dashboard-input"
                  required
                />
              </div>

              <div>
                <Label htmlFor="currency_code" className="dashboard-label">Currency</Label>
                <Select 
                  value={formData.currencyCode} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currencyCode: value }))}
                >
                  <SelectTrigger className="dashboard-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dashboard-dropdown-content">
                    <SelectItem value="USD" className="dashboard-dropdown-item">USD</SelectItem>
                    <SelectItem value="EUR" className="dashboard-dropdown-item">EUR</SelectItem>
                    <SelectItem value="GBP" className="dashboard-dropdown-item">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payment_method" className="dashboard-label">Payment Method</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger className="dashboard-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dashboard-dropdown-content">
                    <SelectItem value="cash" className="dashboard-dropdown-item">Cash</SelectItem>
                    <SelectItem value="bank_transfer" className="dashboard-dropdown-item">Bank Transfer</SelectItem>
                    <SelectItem value="qr_payment" className="dashboard-dropdown-item">QR Payment</SelectItem>
                    <SelectItem value="credit_card" className="dashboard-dropdown-item">Credit Card</SelectItem>
                    <SelectItem value="crypto" className="dashboard-dropdown-item">Cryptocurrency</SelectItem>
                    <SelectItem value="pay_later" className="dashboard-dropdown-item">Pay Later</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payment_status" className="dashboard-label">Payment Status</Label>
                <Select 
                  value={formData.paymentStatus} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentStatus: value }))}
                >
                  <SelectTrigger className="dashboard-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dashboard-dropdown-content">
                    <SelectItem value="pending" className="dashboard-dropdown-item">Pending</SelectItem>
                    <SelectItem value="completed" className="dashboard-dropdown-item">Completed</SelectItem>
                    <SelectItem value="failed" className="dashboard-dropdown-item">Failed</SelectItem>
                    <SelectItem value="refunded" className="dashboard-dropdown-item">Refunded</SelectItem>
                    <SelectItem value="cancelled" className="dashboard-dropdown-item">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="transaction_id" className="dashboard-label">Transaction ID</Label>
                <BaseInput
                  id="transaction_id"
                  value={formData.transactionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                  className="dashboard-input"
                  placeholder="Optional"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="dashboard-label">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="dashboard-input"
                  placeholder="Optional notes"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <BaseButton type="submit" className="dashboard-button-primary flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  {editingPurchase ? 'Update' : 'Create'}
                </BaseButton>
                <BaseButton 
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPurchase(null);
                    resetForm();
                  }}
                  className="dashboard-button-outline"
                >
                  Cancel
                </BaseButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentRecordsManagement;
