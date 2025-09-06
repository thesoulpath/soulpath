'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { BaseCard } from '@/components/ui/BaseCard';
import { BaseButton } from '@/components/ui/BaseButton';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (sessionId) {
      // You can fetch payment details here if needed
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#191970] to-[#0A0A23]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#C0C0C0]">Processing payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#191970] to-[#0A0A23] p-4">
      <BaseCard className="max-w-md w-full">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for your payment. Your transaction has been completed successfully.
          </p>

          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Transaction ID:</span> {sessionId}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/account">
              <BaseButton className="w-full" variant="primary">
                Go to My Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </BaseButton>
            </Link>
            
            <Link href="/">
              <BaseButton className="w-full" variant="outline">
                Return to Home
              </BaseButton>
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            A confirmation email has been sent to your email address.
          </p>
        </div>
      </BaseCard>
    </div>
  );
}
