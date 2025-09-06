'use client';

import React from 'react';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { BaseCard } from '@/components/ui/BaseCard';
import { BaseButton } from '@/components/ui/BaseButton';
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#191970] to-[#0A0A23] p-4">
      <BaseCard className="max-w-md w-full">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your payment was cancelled. No charges were made to your account.
          </p>

          <div className="space-y-3">
            <Link href="/account/book">
              <BaseButton className="w-full" variant="primary">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </BaseButton>
            </Link>
            
            <Link href="/account">
              <BaseButton className="w-full" variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to My Account
              </BaseButton>
            </Link>
            
            <Link href="/">
              <BaseButton className="w-full" variant="ghost">
                Return to Home
              </BaseButton>
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </BaseCard>
    </div>
  );
}
