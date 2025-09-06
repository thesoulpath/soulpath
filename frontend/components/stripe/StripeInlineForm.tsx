'use client';

import React, { useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseCard } from '@/components/ui/BaseCard';
import { CreditCard, Lock, Shield, CheckCircle, Link as LinkIcon, AlertCircle, Loader2 } from 'lucide-react';

interface StripeInlineFormProps {
  amount: number; // Amount in cents
  currency: string;
  description: string;
  customerEmail?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
  appearance?: {
    theme?: 'stripe' | 'night' | 'flat';
    variables?: Record<string, string>;
    rules?: Record<string, Record<string, string>>;
  };
}

// Card element options
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d',
      fontFamily: '"Inter", "Helvetica Neue", Helvetica, sans-serif',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
  hidePostalCode: true,
};

// Stripe Elements wrapper component
function StripeFormInner({
  amount,
  currency,
  description,
  customerEmail,
  customerId,
  metadata,
  onSuccess,
  onError,
  onCancel
}: Omit<StripeInlineFormProps, 'className' | 'appearance'>) {
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [email, setEmail] = useState(customerEmail || '');

  // Create payment intent on mount
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            currency,
            description,
            customerEmail: email || customerEmail,
            customerId,
            metadata,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to create payment intent');
        }

        setClientSecret(result.clientSecret);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (stripe && elements) {
      createPaymentIntent();
    }
  }, [stripe, elements, amount, currency, description, customerEmail, customerId, metadata, email, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm the payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: email || customerEmail,
          },
        },
        return_url: window.location.origin + '/payment/success',
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess?.(paymentIntent.id);
      } else if (paymentIntent?.status === 'requires_action') {
        // Handle 3D Secure or other authentication
        const { error: actionError } = await stripe.confirmCardPayment(clientSecret);
        if (actionError) {
          throw new Error(actionError.message || 'Authentication failed');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">Total Amount:</span>
          <span className="text-2xl font-bold text-gray-900">
            {formatAmount(amount, currency)}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      {/* Email field (if not provided) */}
      {!customerEmail && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
            required
          />
        </div>
      )}

      {/* Card element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="border border-gray-300 rounded-md p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Stripe Link notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center">
          <LinkIcon className="w-5 h-5 text-blue-600 mr-2" />
          <span className="text-sm text-blue-800">
            <strong>Fast checkout:</strong> If you&apos;ve used Stripe Link before, your saved card will appear here automatically.
          </span>
        </div>
      </div>

      {/* Security badges */}
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center">
          <Shield className="w-4 h-4 mr-1 text-green-500" />
          <span>256-bit SSL</span>
        </div>
        <div className="flex items-center">
          <Lock className="w-4 h-4 mr-1 text-green-500" />
          <span>PCI Compliant</span>
        </div>
        <div className="flex items-center">
          <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
          <span>Secure Payment</span>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Submit button */}
      <BaseButton
        type="submit"
        disabled={!stripe || !elements || isLoading || !clientSecret}
        loading={isLoading}
        className="w-full"
        variant="primary"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay {formatAmount(amount, currency)}
          </>
        )}
      </BaseButton>

      {/* Cancel button */}
      {onCancel && (
        <BaseButton
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          variant="outline"
          className="w-full mt-2"
        >
          Cancel
        </BaseButton>
      )}

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center">
        By clicking &ldquo;Pay&rdquo;, you agree to our terms of service and privacy policy.
      </p>
    </form>
  );
}

// Main component with Stripe Elements provider
export function StripeInlineForm({
  amount,
  currency,
  description,
  customerEmail,
  customerId,
  metadata,
  onSuccess,
  onError,
  onCancel,
  className = '',
  appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0066cc',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '2px',
      borderRadius: '6px',
    },
  }
}: StripeInlineFormProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        console.log('🔍 Initializing Stripe...');
        console.log('🔍 Publishable key available:', !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

        if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
          throw new Error('Stripe publishable key is not configured. Please contact support.');
        }

        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
        if (!stripe) {
          throw new Error('Failed to initialize Stripe');
        }
        console.log('✅ Stripe initialized successfully');
        setStripePromise(Promise.resolve(stripe));
      } catch (err) {
        console.error('❌ Stripe initialization error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load Stripe';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    };

    initializeStripe();
  }, [onError]);

  if (error) {
    return (
      <BaseCard className={`max-w-md mx-auto ${className}`}>
        <div className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment System Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <BaseButton onClick={() => window.location.reload()} variant="outline">
            Retry
          </BaseButton>
        </div>
      </BaseCard>
    );
  }

  if (!stripePromise) {
    return (
      <BaseCard className={`max-w-md mx-auto ${className}`}>
        <div className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading payment system...</p>
        </div>
      </BaseCard>
    );
  }

  const options = {
    mode: 'payment' as const,
    amount,
    currency: currency.toLowerCase(),
    appearance,
  };

  return (
    <BaseCard className={`max-w-md mx-auto ${className}`}>
      <div className="p-6">
        <Elements stripe={stripePromise} options={options}>
          <StripeFormInner
            amount={amount}
            currency={currency}
            description={description}
            customerEmail={customerEmail}
            customerId={customerId}
            metadata={metadata}
            onSuccess={onSuccess}
            onError={onError}
            onCancel={onCancel}
          />
        </Elements>
      </div>
    </BaseCard>
  );
}

export default StripeInlineForm;
