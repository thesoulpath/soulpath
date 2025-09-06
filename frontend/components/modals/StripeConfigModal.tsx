'use client';

import React, { useState } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { CreditCard, Settings, Eye, EyeOff } from 'lucide-react';

interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  currency: string;
  supportedCountries: string[];
  automaticTaxes: boolean;
  allowPromotionCodes: boolean;
}

interface StripeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: StripeConfig) => void;
  initialConfig?: StripeConfig;
}

const CURRENCIES = [
  { code: 'usd', name: 'US Dollar ($)' },
  { code: 'eur', name: 'Euro (€)' },
  { code: 'gbp', name: 'British Pound (£)' },
  { code: 'cad', name: 'Canadian Dollar (C$)' },
  { code: 'aud', name: 'Australian Dollar (A$)' },
  { code: 'jpy', name: 'Japanese Yen (¥)' },
  { code: 'mxn', name: 'Mexican Peso (MXN$)' },
  { code: 'brl', name: 'Brazilian Real (R$)' },
];

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
];

const StripeConfigModal: React.FC<StripeConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
}) => {
  const [config, setConfig] = useState<StripeConfig>(
    initialConfig || {
      publishableKey: '',
      secretKey: '',
      webhookSecret: '',
      currency: 'usd',
      supportedCountries: ['US', 'CA', 'MX'],
      automaticTaxes: true,
      allowPromotionCodes: true,
    }
  );

  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!config.publishableKey.trim()) {
      newErrors.publishableKey = 'Publishable key is required';
    } else if (!config.publishableKey.startsWith('pk_')) {
      newErrors.publishableKey = 'Invalid publishable key format (should start with pk_)';
    }

    if (!config.secretKey.trim()) {
      newErrors.secretKey = 'Secret key is required';
    } else if (!config.secretKey.startsWith('sk_')) {
      newErrors.secretKey = 'Invalid secret key format (should start with sk_)';
    }

    if (!config.webhookSecret.trim()) {
      newErrors.webhookSecret = 'Webhook secret is required';
    } else if (!config.webhookSecret.startsWith('whsec_')) {
      newErrors.webhookSecret = 'Invalid webhook secret format (should start with whsec_)';
    }

    if (config.supportedCountries.length === 0) {
      newErrors.supportedCountries = 'At least one country must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateConfig()) {
      onSave(config);
      onClose();
    }
  };

  const handleCountryToggle = (countryCode: string) => {
    setConfig(prev => ({
      ...prev,
      supportedCountries: prev.supportedCountries.includes(countryCode)
        ? prev.supportedCountries.filter(c => c !== countryCode)
        : [...prev.supportedCountries, countryCode],
    }));
  };

  const handleReset = () => {
    setConfig(initialConfig || {
      publishableKey: '',
      secretKey: '',
      webhookSecret: '',
      currency: 'usd',
      supportedCountries: ['US', 'CA', 'MX'],
      automaticTaxes: true,
      allowPromotionCodes: true,
    });
    setErrors({});
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Stripe Configuration"
      size="6xl"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-[var(--color-border-500)]">
          <div className="w-8 h-8 bg-[var(--color-accent-100)] rounded-lg flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-[var(--color-accent-600)]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Configure Stripe Payment Gateway</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Set up your Stripe account credentials and payment preferences
            </p>
          </div>
        </div>

        {/* API Keys Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
            <Settings className="w-4 h-4" />
            API Configuration
          </h4>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publishableKey" className="text-sm font-medium text-[var(--color-text-primary)]">
                Publishable Key
              </Label>
              <BaseInput
                id="publishableKey"
                type="text"
                value={config.publishableKey}
                onChange={(e) => setConfig(prev => ({ ...prev, publishableKey: e.target.value }))}
                placeholder="pk_test_..."
                className={errors.publishableKey ? 'border-[var(--color-status-error)]' : ''}
              />
              {errors.publishableKey && (
                <p className="text-sm text-[var(--color-status-error)]">{errors.publishableKey}</p>
              )}
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Found in your Stripe Dashboard under Developers → API keys
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey" className="text-sm font-medium text-[var(--color-text-primary)]">
                Secret Key
              </Label>
              <div className="relative">
                <BaseInput
                  id="secretKey"
                  type={showSecretKey ? 'text' : 'password'}
                  value={config.secretKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                  placeholder="sk_test_..."
                  className={errors.secretKey ? 'border-[var(--color-status-error)]' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                >
                  {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.secretKey && (
                <p className="text-sm text-[var(--color-status-error)]">{errors.secretKey}</p>
              )}
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Keep this secure and never expose it in client-side code
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhookSecret" className="text-sm font-medium text-[var(--color-text-primary)]">
              Webhook Secret
            </Label>
            <div className="relative">
              <BaseInput
                id="webhookSecret"
                type={showWebhookSecret ? 'text' : 'password'}
                value={config.webhookSecret}
                onChange={(e) => setConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                placeholder="whsec_..."
                className={errors.webhookSecret ? 'border-[var(--color-status-error)]' : ''}
              />
              <button
                type="button"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.webhookSecret && (
              <p className="text-sm text-[var(--color-status-error)]">{errors.webhookSecret}</p>
            )}
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Found in your Stripe Dashboard under Developers → Webhooks
            </p>
          </div>
        </div>

        {/* Payment Preferences Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[var(--color-text-primary)]">Payment Preferences</h4>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-sm font-medium text-[var(--color-text-primary)]">
                Default Currency
              </Label>
              <Select
                value={config.currency}
                onValueChange={(value) => setConfig(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger className="dashboard-select">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code} className="dashboard-dropdown-item">
                      {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[var(--color-text-primary)]">
                Supported Countries
              </Label>
              <div className="max-h-32 overflow-y-auto border border-[var(--color-border-500)] rounded-md p-2 bg-[var(--color-surface-secondary)]">
                {COUNTRIES.map((country) => (
                  <label key={country.code} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={config.supportedCountries.includes(country.code)}
                      onChange={() => handleCountryToggle(country.code)}
                      className="rounded border-[var(--color-border-500)] text-[var(--color-accent-500)] focus:ring-[var(--color-accent-500)] bg-[var(--color-surface-secondary)]"
                    />
                    <span className="text-sm text-[var(--color-text-primary)]">{country.name}</span>
                  </label>
                ))}
              </div>
              {errors.supportedCountries && (
                <p className="text-sm text-[var(--color-status-error)]">{errors.supportedCountries}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="automaticTaxes" className="text-sm font-medium text-[var(--color-text-primary)]">
                Enable Automatic Tax Calculation
              </Label>
              <Switch
                id="automaticTaxes"
                checked={config.automaticTaxes}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, automaticTaxes: checked }))}
              />
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Automatically calculate and collect sales tax based on customer location
            </p>

            <div className="flex items-center justify-between">
              <Label htmlFor="allowPromotionCodes" className="text-sm font-medium text-[var(--color-text-primary)]">
                Allow Promotion Codes
              </Label>
              <Switch
                id="allowPromotionCodes"
                checked={config.allowPromotionCodes}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, allowPromotionCodes: checked }))}
              />
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Allow customers to enter Stripe promotion codes during checkout
            </p>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-[var(--color-accent-50)] border border-[var(--color-accent-200)] rounded-lg p-3">
          <h5 className="text-xs font-medium text-[var(--color-accent-900)] mb-1">Need Help?</h5>
          <ul className="text-xs text-[var(--color-accent-800)] space-y-0.5">
            <li>• Get your API keys from the <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline">Stripe Dashboard</a></li>
            <li>• Set up webhooks at <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="underline">Stripe Webhooks</a></li>
            <li>• Test with <a href="https://stripe.com/docs/testing" target="_blank" rel="noopener noreferrer" className="underline">Stripe test cards</a></li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3 border-t border-[var(--color-border-500)]">
          <BaseButton
            onClick={handleSave}
            variant="primary"
            className="flex-1"
          >
            Save Configuration
          </BaseButton>
          <BaseButton
            onClick={handleReset}
            variant="outline"
          >
            Reset
          </BaseButton>
          <BaseButton
            onClick={onClose}
            variant="ghost"
          >
            Cancel
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
};

export default StripeConfigModal;
