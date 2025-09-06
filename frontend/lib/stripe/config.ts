import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Stripe configuration
export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  currency: 'usd', // Default currency
  mode: 'payment', // or 'subscription'
};

// Lazy initialization of Stripe server instance
let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe | null => {
  if (!stripeInstance) {
    if (!stripeConfig.secretKey) {
      console.warn('STRIPE_SECRET_KEY environment variable is not set - Stripe functionality disabled');
      return null;
    }
    stripeInstance = new Stripe(stripeConfig.secretKey, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });
  }
  return stripeInstance;
};

// Initialize Stripe server instance (for backward compatibility)
export const stripe = getStripe();

// Stripe client-side instance
export const getStripeClient = () => {
  if (typeof window !== 'undefined') {
    return loadStripe(stripeConfig.publishableKey);
  }
  return null;
};

// Payment method types
export const STRIPE_PAYMENT_METHODS = {
  CREDIT_CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  WALLET: 'wallet',
};

// Payment status mapping
export const STRIPE_PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELED: 'canceled',
  PROCESSING: 'processing',
  REQUIRES_ACTION: 'requires_action',
  REQUIRES_CONFIRMATION: 'requires_confirmation',
  REQUIRES_PAYMENT_METHOD: 'requires_payment_method',
};

// Error codes
export const STRIPE_ERROR_CODES = {
  CARD_DECLINED: 'card_declined',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  EXPIRED_CARD: 'expired_card',
  INCORRECT_CVC: 'incorrect_cvc',
  PROCESSING_ERROR: 'processing_error',
  INVALID_REQUEST: 'invalid_request',
};
