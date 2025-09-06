'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BaseModal } from '@/components/ui/BaseModal';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, CreditCard, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { colors, spacing, typography } from '@/lib/design-system';


interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  description: string | null;
  icon: string | null;
  requiresConfirmation: boolean;
  autoAssignPackage: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    type: 'custom',
    description: '',
    icon: '',
    requiresConfirmation: false,
    autoAssignPackage: true,
    isActive: true
  });

  // Fetch payment methods
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/admin/payment-methods');
      const result = await response.json();
      
      if (result.success) {
        setPaymentMethods(result.data);
      } else {
        toast.error('Failed to fetch payment methods');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };


  const handleCreate = async () => {
    try {
      const response = await fetch('/api/admin/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Payment method created successfully');
        setIsCreateModalOpen(false);
        resetForm();
        fetchPaymentMethods();
      } else {
        toast.error(result.message || 'Failed to create payment method');
      }
    } catch (error) {
      console.error('Error creating payment method:', error);
      toast.error('Failed to create payment method');
    }
  };

  const handleUpdate = async () => {
    if (!editingPaymentMethod) return;
    
    try {
      const response = await fetch(`/api/admin/payment-methods?id=${editingPaymentMethod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Payment method updated successfully');
        setIsEditModalOpen(false);
        resetForm();
        setEditingPaymentMethod(null);
        fetchPaymentMethods();
      } else {
        toast.error(result.message || 'Failed to update payment method');
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast.error('Failed to update payment method');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    
    try {
      const response = await fetch(`/api/admin/payment-methods?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Payment method deleted successfully');
        fetchPaymentMethods();
      } else {
        toast.error(result.message || 'Failed to delete payment method');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'custom',
      description: '',
      icon: '',
      requiresConfirmation: false,
      autoAssignPackage: true,
      isActive: true
    });
  };

  const openEditModal = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setFormData({
      name: paymentMethod.name,
      type: paymentMethod.type,
      description: paymentMethod.description || '',
      icon: paymentMethod.icon || '',
      requiresConfirmation: paymentMethod.requiresConfirmation,
      autoAssignPackage: paymentMethod.autoAssignPackage,
      isActive: paymentMethod.isActive
    });
    setIsEditModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] text-[${colors.text.secondary}]`}>
        Loading payment methods...
      </div>
    );
  }

  return (
    <div className={`space-y-[${spacing[6]}]`}>
      {/* Header */}
      <div className={`flex items-center justify-between`}>
        <div>
          <h1 className={`text-[${typography.fontSize['3xl']}] font-[${typography.fontWeight.bold}] text-[${colors.text.primary}]`}>
            Payment Methods
          </h1>
          <p className={`text-[${colors.text.secondary}] mt-[${spacing[2]}]`}>
            Manage payment methods and their associated currencies
          </p>
        </div>
        <BaseButton
          onClick={openCreateModal}
          variant="primary"
          size="lg"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Payment Method
        </BaseButton>
      </div>

      {/* Payment Methods Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[${spacing[6]}]`}>
        {paymentMethods.map((method) => (
          <Card key={method.id} className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}]`}>
            <CardHeader className={`pb-[${spacing[3]}]`}>
              <div className="flex items-center justify-between">
                <CardTitle className={`text-[${typography.fontSize.lg}] text-[${colors.text.primary}]`}>
                  {method.name}
                </CardTitle>
                <Badge 
                  variant={method.isActive ? "default" : "secondary"}
                  className={method.isActive ? `bg-[${colors.status.success}] text-white` : `bg-[${colors.status.error}] text-white`}
                >
                  {method.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {method.description && (
                <p className={`text-[${colors.text.secondary}] text-[${typography.fontSize.sm}]`}>
                  {method.description}
                </p>
              )}
            </CardHeader>
            
            <CardContent className={`space-y-[${spacing[4]}]`}>
              <div className={`flex items-center space-x-[${spacing[2]}] text-[${colors.text.secondary}]`}>
                <CreditCard className="w-4 h-4" />
                <span className={`text-[${typography.fontSize.sm}]`}>
                  Type: {method.type}
                </span>
              </div>
              
              {method.icon && (
                <div className={`flex items-center space-x-[${spacing[2]}] text-[${colors.text.secondary}]`}>
                  <img src={method.icon} alt={method.name} className="w-4 h-4" />
                  <span className={`text-[${typography.fontSize.sm}]`}>
                    Icon available
                  </span>
                </div>
              )}
              
              <div className={`flex items-center space-x-[${spacing[2]}] text-[${colors.text.secondary}]`}>
                <DollarSign className="w-4 h-4" />
                <span className={`text-[${typography.fontSize.sm}]`}>
                  Created: {new Date(method.createdAt).toLocaleDateString()}
                </span>
              </div>

              <Separator className={`bg-[${colors.border[500]}]/20`} />

              <div className={`flex space-x-[${spacing[2]}]`}>
                <BaseButton
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(method)}
                  className="flex-1"
                  leftIcon={<Edit className="w-4 h-4" />}
                >
                  Edit
                </BaseButton>
                <BaseButton
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(method.id)}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Delete
                </BaseButton>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Modal */}
      <BaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Payment Method"
        description="Create a new payment method with its associated currency"
        size="lg"
        variant="default"
      >
        <BaseModal.Content>
          <div className={`space-y-[${spacing[4]}]`}>
            <div>
              <Label htmlFor="name" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Name *
              </Label>
              <BaseInput
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Credit Card, PayPal"
              />
            </div>

            <div>
              <Label htmlFor="type" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Type *
              </Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}] text-[${colors.text.primary}]`}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className={`bg-[${colors.semantic.surface.secondary}] border-[${colors.border[500]}]`}>
                  <SelectItem value="stripe" className={`text-[${colors.text.primary}] hover:bg-[${colors.semantic.surface.tertiary}]`}>
                    Stripe
                  </SelectItem>
                  <SelectItem value="paypal" className={`text-[${colors.text.primary}] hover:bg-[${colors.semantic.surface.tertiary}]`}>
                    PayPal
                  </SelectItem>
                  <SelectItem value="bank" className={`text-[${colors.text.primary}] hover:bg-[${colors.semantic.surface.tertiary}]`}>
                    Bank Transfer
                  </SelectItem>
                  <SelectItem value="crypto" className={`text-[${colors.text.primary}] hover:bg-[${colors.semantic.surface.tertiary}]`}>
                    Cryptocurrency
                  </SelectItem>
                  <SelectItem value="apple" className={`text-[${colors.text.primary}] hover:bg-[${colors.semantic.surface.tertiary}]`}>
                    Apple Pay
                  </SelectItem>
                  <SelectItem value="google" className={`text-[${colors.text.primary}] hover:bg-[${colors.semantic.surface.tertiary}]`}>
                    Google Pay
                  </SelectItem>
                  <SelectItem value="custom" className={`text-[${colors.text.primary}] hover:bg-[${colors.semantic.surface.tertiary}]`}>
                    Custom
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}] text-[${colors.text.primary}] placeholder:text-[${colors.text.tertiary}]`}
              />
            </div>

            <div>
              <Label htmlFor="icon" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Icon URL
              </Label>
              <BaseInput
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="https://example.com/icon.png"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requiresConfirmation"
                  checked={formData.requiresConfirmation}
                  onChange={(e) => setFormData({ ...formData, requiresConfirmation: e.target.checked })}
                  className={`rounded border-[${colors.border[500]}] bg-[${colors.semantic.surface.primary}]`}
                />
                <Label htmlFor="requiresConfirmation" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                  Requires Confirmation
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoAssignPackage"
                  checked={formData.autoAssignPackage}
                  onChange={(e) => setFormData({ ...formData, autoAssignPackage: e.target.checked })}
                  className={`rounded border-[${colors.border[500]}] bg-[${colors.semantic.surface.primary}]`}
                />
                <Label htmlFor="autoAssignPackage" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                  Auto Assign Package
                </Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className={`rounded border-[${colors.border[500]}] bg-[${colors.semantic.surface.primary}]`}
              />
              <Label htmlFor="isActive" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Active
              </Label>
            </div>
          </div>
        </BaseModal.Content>

        <BaseModal.Footer>
          <BaseButton
            variant="outline"
            onClick={() => setIsCreateModalOpen(false)}
          >
            Cancel
          </BaseButton>
          <BaseButton
            onClick={handleCreate}
            disabled={!formData.name || !formData.type}
            variant="primary"
          >
            Create
          </BaseButton>
        </BaseModal.Footer>
      </BaseModal>

      {/* Edit Modal */}
      <BaseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Payment Method"
        description="Update the payment method configuration"
        size="lg"
        variant="default"
      >
        <BaseModal.Content>
          <div className={`space-y-[${spacing[4]}]`}>
            <div>
              <Label htmlFor="edit-name" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Name *
              </Label>
              <BaseInput
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Credit Card, PayPal"
              />
            </div>

            <div>
              <Label htmlFor="edit-type" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Type *
              </Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}] text-[${colors.text.primary}]`}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className={`bg-[${colors.semantic.surface.secondary}] border-[${colors.border[500]}]`}>
                  <SelectItem value="stripe" className={`text-[${colors.text.primary}] hover:bg-[${colors.semantic.surface.tertiary}]`}>
                    Stripe
                  </SelectItem>
                  <SelectItem value="paypal" className={`text-[${colors.text.primary}] hover:bg-[${colors.semantic.surface.tertiary}]`}>
                    PayPal
                  </SelectItem>
                  <SelectItem value="bank" className={`text-[${colors.text.primary}] hover:bg-[${colors.semantic.surface.tertiary}]`}>
                    Bank Transfer
                  </SelectItem>
                  <SelectItem value="crypto" className={`text-[${colors.text.primary}] hover:bg-[${colors.semantic.surface.tertiary}]`}>
                    Cryptocurrency
                  </SelectItem>
                  <SelectItem value="apple" className={`text-[${colors.text.primary}] hover:bg-[${colors.semantic.surface.tertiary}]`}>
                    Apple Pay
                  </SelectItem>
                  <SelectItem value="google" className={`text-[${colors.text.primary}] hover:bg-[${colors.semantic.surface.tertiary}]`}>
                    Google Pay
                  </SelectItem>
                  <SelectItem value="custom" className={`text-[${colors.text.primary}] hover:bg-[${colors.semantic.surface.tertiary}]`}>
                    Custom
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-description" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                className={`bg-[${colors.semantic.surface.primary}] border-[${colors.border[500]}] text-[${colors.text.primary}] placeholder:text-[${colors.text.tertiary}]`}
              />
            </div>

            <div>
              <Label htmlFor="edit-icon" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Icon URL
              </Label>
              <BaseInput
                id="edit-icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="https://example.com/icon.png"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-requiresConfirmation"
                  checked={formData.requiresConfirmation}
                  onChange={(e) => setFormData({ ...formData, requiresConfirmation: e.target.checked })}
                  className={`rounded border-[${colors.border[500]}] bg-[${colors.semantic.surface.primary}]`}
                />
                <Label htmlFor="edit-requiresConfirmation" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                  Requires Confirmation
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-autoAssignPackage"
                  checked={formData.autoAssignPackage}
                  onChange={(e) => setFormData({ ...formData, autoAssignPackage: e.target.checked })}
                  className={`rounded border-[${colors.border[500]}] bg-[${colors.semantic.surface.primary}]`}
                />
                <Label htmlFor="edit-autoAssignPackage" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                  Auto Assign Package
                </Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className={`rounded border-[${colors.border[500]}] bg-[${colors.semantic.surface.primary}]`}
              />
              <Label htmlFor="edit-isActive" className={`text-[${typography.fontSize.sm}] font-[${typography.fontWeight.medium}] text-[${colors.text.secondary}]`}>
                Active
              </Label>
            </div>
          </div>
        </BaseModal.Content>

        <BaseModal.Footer>
          <BaseButton
            variant="outline"
            onClick={() => setIsEditModalOpen(false)}
          >
            Cancel
          </BaseButton>
          <BaseButton
            onClick={handleUpdate}
            disabled={!formData.name || !formData.type}
            variant="primary"
          >
            Update
          </BaseButton>
        </BaseModal.Footer>
      </BaseModal>
    </div>
  );
}
