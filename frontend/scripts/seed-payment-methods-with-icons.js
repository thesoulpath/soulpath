#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const paymentMethods = [
  {
    name: 'Credit Card',
    type: 'stripe',
    description: 'Pay with Visa, Mastercard, or American Express',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/visa/visa-original.svg',
    requiresConfirmation: false,
    autoAssignPackage: true,
    isActive: true
  },
  {
    name: 'PayPal',
    type: 'paypal',
    description: 'Pay securely with your PayPal account',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/paypal/paypal-original.svg',
    requiresConfirmation: false,
    autoAssignPackage: true,
    isActive: true
  },
  {
    name: 'Bank Transfer',
    type: 'bank_transfer',
    description: 'Direct bank transfer payment',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bank/bank-original.svg',
    requiresConfirmation: true,
    autoAssignPackage: false,
    isActive: true
  },
  {
    name: 'Cryptocurrency',
    type: 'crypto',
    description: 'Pay with Bitcoin, Ethereum, or other cryptocurrencies',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bitcoin/bitcoin-original.svg',
    requiresConfirmation: true,
    autoAssignPackage: false,
    isActive: true
  },
  {
    name: 'Apple Pay',
    type: 'apple_pay',
    description: 'Pay with Apple Pay on your device',
    icon: 'https://developer.apple.com/assets/elements/icons/apple-pay/apple-pay.svg',
    requiresConfirmation: false,
    autoAssignPackage: true,
    isActive: true
  },
  {
    name: 'Google Pay',
    type: 'google_pay',
    description: 'Pay with Google Pay on your device',
    icon: 'https://developers.google.com/static/pay/api/images/brand-guidelines/google-pay-mark.svg',
    requiresConfirmation: false,
    autoAssignPackage: true,
    isActive: true
  }
];

async function seedPaymentMethods() {
  try {
    console.log('🌱 Seeding payment methods with icons...');

    // Clear existing payment methods
    await prisma.paymentMethodConfig.deleteMany({});
    console.log('✅ Cleared existing payment methods');

    // Create new payment methods
    for (const method of paymentMethods) {
      await prisma.paymentMethodConfig.create({
        data: method
      });
      console.log(`✅ Created payment method: ${method.name}`);
    }

    console.log('🎉 Payment methods seeded successfully!');
    console.log(`📊 Created ${paymentMethods.length} payment methods`);

  } catch (error) {
    console.error('❌ Error seeding payment methods:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedPaymentMethods()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
