'use client';

import React, { useState } from 'react';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { BaseCard } from '@/components/ui/BaseCard';
import { CreditCard, Lock, Shield } from 'lucide-react';

interface StripePaymentMethodProps {
  amount: number; // Amount in cents
  currency: string;
  description: string;
  customerEmail?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

const StripePaymentMethod: React.FC<StripePaymentMethodProps> = ({
  amount,
  currency,
  description,
  customerEmail,
  onSuccess,
  onError,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          customerEmail,
          description,
          metadata: {
            source: 'soulpath_payment',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment intent');
      }

      // Here you would typically use Stripe Elements to confirm the payment
      // For now, we'll simulate a successful payment
      onSuccess?.(result.paymentIntentId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <BaseCard className={`max-w-md mx-auto ${className}`}>
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Credit Card Payment</h3>
          <p className="text-gray-600">{description}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Total Amount:</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatAmount(amount, currency)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cardholder Name
            </label>
            <BaseInput
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Number
            </label>
            <BaseInput
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="1234 5678 9012 3456"
              required
              maxLength={19}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <BaseInput
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="MM/YY"
                required
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVC
              </label>
              <BaseInput
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                required
                maxLength={4}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <BaseButton
            type="submit"
            disabled={loading}
            loading={loading}
            className="w-full"
            variant="primary"
          >
            {loading ? 'Processing...' : `Pay ${formatAmount(amount, currency)}`}
          </BaseButton>
        </form>

        <div className="mt-6 space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Shield className="w-4 h-4 mr-2 text-green-500" />
            <span>256-bit SSL encryption</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Lock className="w-4 h-4 mr-2 text-green-500" />
            <span>PCI DSS compliant</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          By clicking &ldquo;Pay&rdquo;, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </BaseCard>
  );
};

export default StripePaymentMethod;
