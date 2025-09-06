'use client';

import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calculator, Globe, Save, X, Package } from 'lucide-react';



interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  isDefault: boolean;
  exchangeRate: number;
}

interface PackageDefinition {
  id: number;
  name: string;
  sessionsCount: number;
  packageType: 'individual' | 'group' | 'mixed';
  maxGroupSize: number | null;
}

interface PackagePrice {
  id: number;
  packageDefinitionId: number;
  currencyId: number;
  price: number;
  pricingMode: 'custom' | 'calculated';
  isActive: boolean;
  packageDefinition: PackageDefinition;
  currency: Currency;
}

interface PackagePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  packagePrice?: PackagePrice | null;
  packageDefinitions: PackageDefinition[];
  currencies: Currency[];
  mode: 'create' | 'edit';
}

const PackagePriceModal: React.FC<PackagePriceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  packagePrice,
  packageDefinitions,
  currencies,
  mode
}) => {
  const [formData, setFormData] = useState({
    packageDefinitionId: '',
    currencyId: '',
    price: '',
    pricingMode: 'calculated' as 'custom' | 'calculated',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  useEffect(() => {
    if (packagePrice && mode === 'edit') {
      setFormData({
        packageDefinitionId: packagePrice.packageDefinitionId.toString(),
        currencyId: packagePrice.currencyId.toString(),
        price: packagePrice.price.toString(),
        pricingMode: packagePrice.pricingMode,
        isActive: packagePrice.isActive
      });
    } else {
      resetForm();
    }
  }, [packagePrice, mode]);

  useEffect(() => {
    if (formData.packageDefinitionId && formData.currencyId && formData.pricingMode === 'calculated') {
      calculatePrice();
    }
  }, [formData.packageDefinitionId, formData.currencyId, formData.pricingMode]);

  const resetForm = () => {
    setFormData({
      packageDefinitionId: '',
      currencyId: '',
      price: '',
      pricingMode: 'calculated',
      isActive: true
    });
    setErrors({});

    setCalculatedPrice(null);
    setExchangeRate(null);
  };

  const calculatePrice = () => {
    // This would implement the actual price calculation logic
    // For now, just set a placeholder
    setCalculatedPrice(99.99);
  };

  const handlePricingModeChange = (mode: 'custom' | 'calculated') => {
    setFormData(prev => ({ ...prev, pricingMode: mode }));
    if (mode === 'calculated') {
      setFormData(prev => ({ ...prev, price: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.packageDefinitionId) {
      newErrors.packageDefinitionId = 'Package definition is required';
    }

    if (!formData.currencyId) {
      newErrors.currencyId = 'Currency is required';
    }

    if (formData.pricingMode === 'custom' && !formData.price) {
      newErrors.price = 'Price is required for custom pricing';
    }

    if (formData.price && parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      price: formData.pricingMode === 'calculated' ? calculatedPrice : parseFloat(formData.price)
    };

    onSubmit(submitData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedPackage = packageDefinitions.find(p => p.id.toString() === formData.packageDefinitionId);
  const selectedCurrency = currencies.find(c => c.id.toString() === formData.currencyId);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Create New Price' : 'Edit Package Price'}
      description={mode === 'create' 
        ? 'Set pricing for a package in a specific currency'
        : 'Update the package pricing configuration'
      }
      size="xl"
      variant="default"
    >
      <BaseModal.Header icon={<DollarSign className="w-5 h-5" />}>
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-medium text-white">
            {mode === 'create' ? 'Create New Price' : 'Edit Package Price'}
          </h3>
        </div>
      </BaseModal.Header>

      <BaseModal.Content>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">
                Package Definition *
              </Label>
              <Select
                value={formData.packageDefinitionId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, packageDefinitionId: value }))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {packageDefinitions.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id.toString()} className="text-white hover:bg-gray-600">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {pkg.name} ({pkg.sessionsCount} sessions)
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.packageDefinitionId && (
                <p className="text-red-500 text-sm">
                  {errors.packageDefinitionId}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">
                Currency *
              </Label>
              <Select
                value={formData.currencyId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currencyId: value }))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id.toString()} className="text-white hover:bg-gray-600">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {currency.code} - {currency.name}
                        {currency.isDefault && (
                          <Badge className="bg-blue-500 text-white">
                            Default
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currencyId && (
                <p className="text-red-500 text-sm">
                  {errors.currencyId}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">
                Pricing Mode *
              </Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="calculated"
                    name="pricingMode"
                    value="calculated"
                    checked={formData.pricingMode === 'calculated'}
                    onChange={() => handlePricingModeChange('calculated')}
                    className="rounded-full border-gray-600 bg-gray-800"
                  />
                  <Label htmlFor="calculated" className="text-sm font-medium text-gray-300 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Calculated (from Exchange Rate)
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="custom"
                    name="pricingMode"
                    value="custom"
                    checked={formData.pricingMode === 'custom'}
                    onChange={() => handlePricingModeChange('custom')}
                    className="rounded-full border-gray-600 bg-gray-800"
                  />
                  <Label htmlFor="custom" className="text-sm font-medium text-gray-300 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Custom Price
                    </div>
                  </Label>
                </div>
              </div>
            </div>

            {formData.pricingMode === 'custom' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">
                  Custom Price *
                </Label>
                <BaseInput
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  variant={errors.price ? 'error' : 'default'}
                  error={errors.price}
                />
              </div>
            )}

            {formData.pricingMode === 'calculated' && calculatedPrice && (
              <div className="p-4 bg-gray-800 rounded-md border border-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">
                    Calculated Price:
                  </span>
                  <span className="text-lg font-bold text-white">
                    {selectedCurrency?.symbol} {calculatedPrice}
                  </span>
                </div>
                {exchangeRate && (
                  <div className="text-xs text-gray-400 mt-1">
                    Exchange Rate: 1 USD = {exchangeRate} {selectedCurrency?.code}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive" className="text-sm font-medium text-gray-300">
              Active Price
            </Label>
          </div>

          {selectedPackage && selectedCurrency && (
            <div className="p-4 bg-gray-800 rounded-md border border-gray-600">
              <h4 className="text-sm font-medium text-white mb-2">
                Package Summary
              </h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>{selectedPackage.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  <span>{selectedPackage.sessionsCount} sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>{selectedCurrency.code} - {selectedCurrency.name}</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </BaseModal.Content>

      <BaseModal.Footer>
        <BaseButton
          variant="outline"
          onClick={handleClose}
          leftIcon={<X className="w-4 h-4" />}
        >
          Cancel
        </BaseButton>
        <BaseButton
          variant="primary"
          onClick={handleSubmit}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {mode === 'create' ? 'Create Price' : 'Update Price'}
        </BaseButton>
      </BaseModal.Footer>
    </BaseModal>
  );
};

export default PackagePriceModal;
