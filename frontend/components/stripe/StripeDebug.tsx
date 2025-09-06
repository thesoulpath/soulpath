'use client';

import React from 'react';
import { BaseCard } from '@/components/ui/BaseCard';

export function StripeDebug() {
  return (
    <BaseCard className="max-w-md mx-auto">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Stripe Debug Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Publishable Key:</span>
            <span className={`font-mono ${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'text-green-400' : 'text-red-400'}`}>
              {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Key Value:</span>
            <span className="font-mono text-xs text-gray-300">
              {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'undefined'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Environment:</span>
            <span className="text-blue-400">{typeof window !== 'undefined' ? 'Client' : 'Server'}</span>
          </div>
        </div>
      </div>
    </BaseCard>
  );
}
