'use client';

import React, { useState } from 'react';
import { StripeInlineForm } from './StripeInlineForm';
import { BaseButton } from '@/components/ui/BaseButton';
import { CreditCard, X, CheckCircle, AlertCircle } from 'lucide-react';

interface StripePaymentButtonProps {
  amount: number; // Amount in cents
  currency: string;
  description: string;
  customerEmail?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  buttonText?: string;
  buttonVariant?: 'primary' | 'secondary' | 'outline';
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  appearance?: {
    theme?: 'stripe' | 'night' | 'flat';
    variables?: Record<string, string>;
    rules?: Record<string, Record<string, string>>;
  };
}

export function StripePaymentButton({
  amount,
  currency,
  description,
  customerEmail,
  customerId,
  metadata,
  buttonText,
  buttonVariant = 'primary',
  onSuccess,
  onError,
  className = '',
  appearance
}: StripePaymentButtonProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    setPaymentStatus('success');
    onSuccess?.(paymentIntentId);

    // Auto-close after 3 seconds on success
    setTimeout(() => {
      setShowPaymentForm(false);
      setPaymentStatus('idle');
    }, 3000);
  };

  const handlePaymentError = (error: string) => {
    setPaymentStatus('error');
    onError?.(error);

    // Auto-clear error after 5 seconds
    setTimeout(() => {
      setPaymentStatus('idle');
    }, 5000);
  };

  const handleClose = () => {
    setShowPaymentForm(false);
    setPaymentStatus('idle');
  };

  if (showPaymentForm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Payment status overlay */}
          {paymentStatus !== 'idle' && (
            <div className="absolute inset-0 bg-white bg-opacity-95 z-10 flex items-center justify-center rounded-lg">
              {paymentStatus === 'success' ? (
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-800 mb-2">Payment Successful!</h3>
                  <p className="text-green-600">Your payment has been processed.</p>
                </div>
              ) : (
                <div className="text-center max-w-xs">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-red-800 mb-2">Payment Failed</h3>
                  <p className="text-red-600 text-sm">Please try again or contact support.</p>
                </div>
              )}
            </div>
          )}

          <StripeInlineForm
            amount={amount}
            currency={currency}
            description={description}
            customerEmail={customerEmail}
            customerId={customerId}
            metadata={metadata}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={handleClose}
            appearance={appearance}
          />
        </div>
      </div>
    );
  }

  return (
    <BaseButton
      onClick={() => setShowPaymentForm(true)}
      variant={buttonVariant}
      className={className}
    >
      <CreditCard className="w-4 h-4 mr-2" />
      {buttonText || `Pay ${formatAmount(amount, currency)}`}
    </BaseButton>
  );
}

export default StripePaymentButton;
