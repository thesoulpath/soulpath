'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, CreditCard, Wallet, Banknote, QrCode, Bitcoin, Clock, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentMethodConfig, PaymentMethod } from '@/lib/types';
import { useAuth } from '../hooks/useAuth';
import StripeConfigModal from './modals/StripeConfigModal';


interface PaymentMethodFormData {
  name: string;
  type: PaymentMethod;
  description: string;
  icon: string;
  requiresConfirmation: boolean;
  autoAssignPackage: boolean;
}

interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  currency: string;
  supportedCountries: string[];
  automaticTaxes: boolean;
  allowPromotionCodes: boolean;
}

interface StripeConfigData {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  mode: 'test' | 'live';
}

const PaymentMethodManagement: React.FC = () => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStripeConfig, setShowStripeConfig] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null);
  const [stripeConfig, setStripeConfig] = useState<StripeConfig | StripeConfigData | null>(null);
    const [formData, setFormData] = useState<PaymentMethodFormData>({
    name: '',
    type: 'cash',
    description: '',
    icon: '',
    requiresConfirmation: false,
    autoAssignPackage: true
  });

  const fetchPaymentMethods = useCallback(async () => {
    try {
      console.log('🔍 fetchPaymentMethods called');
      
      const authToken = user?.access_token;
      if (!authToken) {
        console.log('❌ No auth token for payment methods');
        return;
      }

      const response = await fetch('/api/admin/payment-methods', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Payment methods response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch payment methods:', response.status, response.statusText);
        console.error('❌ Error response body:', errorText);
        throw new Error('Failed to fetch payment methods');
      }

      const result = await response.json();
      console.log('✅ Payment methods loaded successfully:', result.data?.length || 0, 'items');
      setPaymentMethods(result.data || []);
    } catch (error) {
      console.error('❌ Error fetching payment methods:', error);
      toast.error('Failed to fetch payment methods');
    }
  }, [user?.access_token]);

  const fetchAllData = useCallback(async () => {
    try {
      console.log('🔍 fetchAllData called, user:', user);
      console.log('🔍 access_token exists:', !!user?.access_token);
      console.log('🔍 access_token length:', user?.access_token?.length);

      if (!user?.access_token) {
        console.log('❌ No access token, cannot load payment methods data');
        return;
      }

      setLoading(true);
      console.log('Loading payment methods data...');

      await fetchPaymentMethods();

      setLastLoaded(new Date());
      console.log('✅ Payment methods data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching payment methods data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, fetchPaymentMethods]);

  // Add a manual refresh function that can be called from parent components
  const refreshPaymentMethodsData = useCallback(() => {
    if (user?.access_token) {
      console.log('Manual refresh requested...');
      fetchAllData();
    }
  }, [user?.access_token, fetchAllData]);

  useEffect(() => {
    if (user?.access_token) {
      console.log('User authenticated, loading payment methods data...');
      fetchAllData();
    } else {
      console.log('User not authenticated, clearing payment methods data...');
      setPaymentMethods([]);
      setLoading(false);
    }
  }, [user?.access_token, fetchAllData]);

  // Refresh data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.access_token && paymentMethods.length === 0) {
        console.log('Component became visible, refreshing payment methods data...');
        fetchAllData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.access_token, paymentMethods.length, fetchAllData]);

  // Additional effect to handle component mounting/navigation
  useEffect(() => {
    if (user?.access_token && paymentMethods.length === 0) {
      console.log('Component mounted or navigated to, loading payment methods data...');
      fetchAllData();
    }
  }, [user?.access_token, paymentMethods.length, fetchAllData]);

  // Expose refresh function to parent components if needed
  useEffect(() => {
    // @ts-expect-error - Exposing refresh function globally for debugging
    window.refreshPaymentMethodsData = refreshPaymentMethodsData;

    return () => {
      // @ts-expect-error - Clean up global function
      delete window.refreshPaymentMethodsData;
    };
  }, [refreshPaymentMethodsData]);

  // Listen for navigation events and refresh data when needed
  useEffect(() => {
    const handleNavigation = () => {
      // Small delay to ensure the component is fully mounted
      setTimeout(() => {
        if (user?.access_token && paymentMethods.length === 0) {
          console.log('Navigation detected, refreshing payment methods data...');
          fetchAllData();
        }
      }, 100);
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, [user?.access_token, paymentMethods.length, fetchAllData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Stripe configuration if type is stripe
    if (formData.type === 'stripe' && !stripeConfig) {
      toast.error('Stripe configuration is required for Stripe payment method');
      return;
    }
    
    try {
      const authToken = user?.access_token;
      if (!authToken) {
        toast.error('Authentication required');
        return;
      }

      const url = editingMethod 
        ? '/api/admin/payment-methods' 
        : '/api/admin/payment-methods';
      
      const method = editingMethod ? 'PUT' : 'POST';
      const body = editingMethod 
        ? { id: editingMethod.id, ...formData, stripeConfig: formData.type === 'stripe' ? stripeConfig : undefined }
        : { ...formData, stripeConfig: formData.type === 'stripe' ? stripeConfig : undefined };

      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to save payment method');

      toast.success(editingMethod ? 'Payment method updated' : 'Payment method created');
      setShowCreateModal(false);
      setEditingMethod(null);
      resetForm();
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast.error('Failed to save payment method');
    }
  };

  const handleEdit = (method: PaymentMethodConfig) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      description: method.description || '',
      icon: method.icon || '',
      requiresConfirmation: method.requiresConfirmation,
      autoAssignPackage: method.autoAssignPackage
    });
    setStripeConfig(method.stripeConfig || null);
    setShowCreateModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      const authToken = user?.access_token;
      if (!authToken) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/admin/payment-methods?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete payment method');

      toast.success('Payment method deleted');
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'cash',
      description: '',
      icon: '',
      requiresConfirmation: false,
      autoAssignPackage: true
    });
    setStripeConfig(null);
  };

  const handleStripeConfigSave = (config: StripeConfig) => {
    setStripeConfig(config);
    setShowStripeConfig(false);
  };

  const handleTypeChange = (type: PaymentMethod) => {
    setFormData(prev => ({ ...prev, type }));
    // Reset Stripe config if changing from Stripe type
    if (type !== 'stripe') {
      setStripeConfig(null);
    }
  };

  const getMethodIcon = (type: PaymentMethod) => {
    switch (type) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'bank_transfer': return <CreditCard className="h-4 w-4" />;
      case 'qr_payment': return <QrCode className="h-4 w-4" />;
      case 'credit_card': return <CreditCard className="h-4 w-4" />;
      case 'stripe': return <Zap className="h-4 w-4" />;
      case 'crypto': return <Bitcoin className="h-4 w-4" />;
      case 'pay_later': return <Clock className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  const getMethodTypeLabel = (type: PaymentMethod) => {
    switch (type) {
      case 'cash': return 'Cash';
      case 'bank_transfer': return 'Bank Transfer';
      case 'qr_payment': return 'QR Payment';
      case 'credit_card': return 'Credit Card';
      case 'stripe': return 'Stripe (Credit Card)';
      case 'crypto': return 'Cryptocurrency';
      case 'pay_later': return 'Pay Later';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  if (!user?.access_token) {
    return (
      <div className="dashboard-container p-6">
        <div className="dashboard-loading">
          <div className="dashboard-loading-spinner">Authentication required...</div>
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
            Payment Methods
          </h2>
          <p className="dashboard-text-secondary">
            Configure payment methods and their behavior for package purchases and bookings
          </p>
          {lastLoaded && (
            <p className="text-sm text-gray-400 mt-1">
              Last updated: {lastLoaded.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <BaseButton 
            onClick={refreshPaymentMethodsData}
            disabled={loading}
            variant="outline"
            className="dashboard-button-outline"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </BaseButton>
          <BaseButton 
            onClick={() => setShowCreateModal(true)} 
            className="dashboard-button-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Payment Method
          </BaseButton>
        </div>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paymentMethods.filter(method => method).map((method) => (
          <Card key={method.id} className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                {getMethodIcon(method?.type || 'custom')}
                <CardTitle className="dashboard-card-title">{method?.name || 'Unnamed Method'}</CardTitle>
              </div>
              <Badge 
                variant={method?.isActive ? 'default' : 'secondary'}
                className="dashboard-badge"
              >
                {method?.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="dashboard-text-secondary text-sm">Type:</span>
                <Badge variant="outline" className="dashboard-badge">
                  {getMethodTypeLabel(method?.type || 'custom')}
                </Badge>
              </div>
              
              {method?.description && (
                <p className="dashboard-text-secondary text-sm">{method.description}</p>
              )}
              
              {method?.type === 'stripe' && method?.stripeConfig && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Zap className="w-4 h-4" />
                  <span>Stripe configured</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="dashboard-text-secondary text-sm">Requires Confirmation:</span>
                <Switch checked={method?.requiresConfirmation || false} disabled />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="dashboard-text-secondary text-sm">Auto-assign Package:</span>
                <Switch checked={method?.autoAssignPackage || false} disabled />
              </div>
              
              <div className="flex gap-2 pt-2">
                <BaseButton
                  size="sm"
                  onClick={() => handleEdit(method)}
                  className="dashboard-button-outline"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </BaseButton>
                <BaseButton
                  size="sm"
                  onClick={() => handleDelete(method?.id || 0)}
                  className="dashboard-button-danger"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </BaseButton>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="dashboard-card w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="dashboard-card-title">
                {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </CardTitle>
              <CardDescription className="dashboard-card-description">
                Configure payment method settings and behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="dashboard-filter-label">Name</Label>
                  <BaseInput
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Payment method name"
                    className="dashboard-input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="dashboard-filter-label">Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={handleTypeChange}
                  >
                    <SelectTrigger className="dashboard-select">
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent className="dashboard-dropdown-content">
                      <SelectItem value="cash" className="dashboard-dropdown-item">Cash</SelectItem>
                      <SelectItem value="bank_transfer" className="dashboard-dropdown-item">Bank Transfer</SelectItem>
                      <SelectItem value="qr_payment" className="dashboard-dropdown-item">QR Payment</SelectItem>
                      <SelectItem value="credit_card" className="dashboard-dropdown-item">Credit Card</SelectItem>
                      <SelectItem value="stripe" className="dashboard-dropdown-item">Stripe (Credit Card)</SelectItem>
                      <SelectItem value="crypto" className="dashboard-dropdown-item">Cryptocurrency</SelectItem>
                      <SelectItem value="pay_later" className="dashboard-dropdown-item">Pay Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stripe Configuration Section */}
                {formData.type === 'stripe' && (
                  <div className="space-y-4 p-4 border border-[var(--color-accent-200)] rounded-lg bg-[var(--color-accent-50)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[var(--color-accent-600)]" />
                        <h4 className="text-sm font-medium text-[var(--color-accent-900)]">Stripe Configuration</h4>
                      </div>
                      <BaseButton
                        type="button"
                        onClick={() => setShowStripeConfig(true)}
                        className="bg-[var(--color-accent-800)] text-white hover:bg-[var(--color-primary-500)] hover:text-[var(--color-text-inverse)] border border-[var(--color-accent-600)] hover:border-[var(--color-primary-500)] rounded-md px-4 py-2 font-medium transition-all duration-200"
                      >
                        {stripeConfig ? 'Edit Configuration' : 'Configure Stripe'}
                      </BaseButton>
                    </div>
                    
                    {stripeConfig ? (
                      <div className="text-sm text-[var(--color-accent-800)]">
                        <p>✅ Stripe is configured</p>
                        <p className="text-xs text-[var(--color-accent-700)] mt-1">
                          Currency: {'currency' in stripeConfig ? stripeConfig.currency?.toUpperCase() || 'USD' : 'USD'} |
                          Countries: {'supportedCountries' in stripeConfig ? stripeConfig.supportedCountries?.length || 0 : 0} supported
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-[var(--color-accent-800)]">
                        <p className="text-[var(--color-text-primary)] font-medium">⚠️ Stripe configuration required</p>
                        <p className="text-xs text-[var(--color-accent-700)] mt-1">
                          Click &ldquo;Configure Stripe&rdquo; to set up your payment gateway
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description" className="dashboard-filter-label">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Payment method description"
                    className="dashboard-input"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon" className="dashboard-filter-label">Icon (optional)</Label>
                  <BaseInput
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="Icon class or identifier"
                    className="dashboard-input"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="requiresConfirmation" className="dashboard-filter-label">
                    Requires Manual Confirmation
                  </Label>
                  <Switch
                    id="requiresConfirmation"
                    checked={formData.requiresConfirmation}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresConfirmation: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="autoAssignPackage" className="dashboard-filter-label">
                    Auto-assign Package on Payment
                  </Label>
                  <Switch
                    id="autoAssignPackage"
                    checked={formData.autoAssignPackage}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoAssignPackage: checked }))}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <BaseButton type="submit" className="dashboard-button-primary flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    {editingMethod ? 'Update' : 'Create'}
                  </BaseButton>
                  <BaseButton
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingMethod(null);
                      resetForm();
                    }}
                    className="dashboard-button-outline"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </BaseButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stripe Configuration Modal */}
      <StripeConfigModal
        isOpen={showStripeConfig}
        onClose={() => setShowStripeConfig(false)}
        onSave={handleStripeConfigSave}
        initialConfig={stripeConfig && 'currency' in stripeConfig ? stripeConfig : undefined}
      />
    </div>
  );
};

export default PaymentMethodManagement;
