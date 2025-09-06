'use client';

import React, { useState } from 'react';
import { StripeInlineForm } from './StripeInlineForm';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseCard } from '@/components/ui/BaseCard';
import { CheckCircle, AlertCircle, DollarSign } from 'lucide-react';

export function StripePaymentDemo() {
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePaymentSuccess = (intentId: string) => {
    setPaymentIntentId(intentId);
    setPaymentStatus('success');
    setErrorMessage(null);
    console.log('Payment successful:', intentId);
  };

  const handlePaymentError = (error: string) => {
    setErrorMessage(error);
    setPaymentStatus('error');
    setPaymentIntentId(null);
    console.error('Payment failed:', error);
  };

  const resetDemo = () => {
    setPaymentStatus('idle');
    setPaymentIntentId(null);
    setErrorMessage(null);
  };

  // Demo payment amounts
  const demoPayments = [
    {
      amount: 2500, // $25.00
      currency: 'usd',
      description: 'Basic Consultation Session',
      id: 'basic'
    },
    {
      amount: 5000, // $50.00
      currency: 'usd',
      description: 'Extended Consultation Session',
      id: 'extended'
    },
    {
      amount: 10000, // $100.00
      currency: 'usd',
      description: 'Premium Consultation Package',
      id: 'premium'
    }
  ];

  const [selectedPayment, setSelectedPayment] = useState(demoPayments[0]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Stripe Inline Payment Demo
        </h1>
        <p className="text-gray-600 mb-8">
          Experience seamless payments with manual card entry and Stripe Link integration
        </p>
      </div>

      {/* Payment Status */}
      {paymentStatus !== 'idle' && (
        <BaseCard className="border-2">
          <div className="p-6">
            {paymentStatus === 'success' ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h2>
                <p className="text-green-700 mb-4">
                  Your payment has been processed successfully.
                </p>
                {paymentIntentId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-800">
                      <strong>Payment Intent ID:</strong> {paymentIntentId}
                    </p>
                  </div>
                )}
                <BaseButton onClick={resetDemo} variant="outline">
                  Make Another Payment
                </BaseButton>
              </div>
            ) : (
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-800 mb-2">Payment Failed</h2>
                <p className="text-red-700 mb-4">{errorMessage}</p>
                <BaseButton onClick={resetDemo} variant="outline">
                  Try Again
                </BaseButton>
              </div>
            )}
          </div>
        </BaseCard>
      )}

      {/* Payment Selection */}
      {paymentStatus === 'idle' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Choose a Payment Amount</h2>

          <div className="grid md:grid-cols-3 gap-4">
            {demoPayments.map((payment) => (
              <BaseCard
                key={payment.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedPayment.id === payment.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPayment(payment)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      ${(payment.amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{payment.description}</h3>
                  <p className="text-sm text-gray-600">{payment.currency.toUpperCase()}</p>
                </div>
              </BaseCard>
            ))}
          </div>
        </div>
      )}

      {/* Payment Form */}
      {paymentStatus === 'idle' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Complete Your Payment</h2>
            <p className="text-gray-600">
              Selected: <strong>${(selectedPayment.amount / 100).toFixed(2)}</strong> for {selectedPayment.description}
            </p>
          </div>

          <StripeInlineForm
            amount={selectedPayment.amount}
            currency={selectedPayment.currency}
            description={selectedPayment.description}
            customerEmail="demo@example.com"
            metadata={{
              source: 'demo_payment',
              payment_type: selectedPayment.id,
              timestamp: new Date().toISOString(),
            }}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            appearance={{
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
            }}
          />
        </div>
      )}

      {/* Features Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Manual Card Entry</h4>
              <p className="text-sm text-gray-600">Enter card details manually with real-time validation</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Stripe Link Integration</h4>
              <p className="text-sm text-gray-600">One-click checkout for returning customers</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">3D Secure Support</h4>
              <p className="text-sm text-gray-600">Automatic handling of strong customer authentication</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Mobile Optimized</h4>
              <p className="text-sm text-gray-600">Responsive design that works on all devices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <BaseCard>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Implementation Guide</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">1. Import the Component</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { StripeInlineForm } from '@/components/stripe/StripeInlineForm';`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">2. Basic Usage</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<StripeInlineForm
  amount={2500} // $25.00 in cents
  currency="usd"
  description="Consultation Session"
  customerEmail="user@example.com"
  onSuccess={(paymentIntentId) => {
    console.log('Payment successful:', paymentIntentId);
  }}
  onError={(error) => {
    console.error('Payment failed:', error);
  }}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">3. Environment Variables Required</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...`}
              </pre>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  );
}

export default StripePaymentDemo;
