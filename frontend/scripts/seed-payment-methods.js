#!/usr/bin/env node

/**
 * Payment Methods Seeding Script
 * 
 * This script seeds both payment_methods and payment_method_configs tables
 * to ensure consistency across the application.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting payment methods seeding...');

  try {
    // First, ensure we have currencies
    console.log('💰 Checking currencies...');
    const currencies = await prisma.currency.findMany();
    console.log(`✅ Found ${currencies.length} currencies:`, currencies.map(c => `${c.code} (${c.symbol})`));

    if (currencies.length === 0) {
      console.log('⚠️  No currencies found. Please run the main seed script first.');
      return;
    }

    const usdCurrency = currencies.find(c => c.code === 'USD');
    const eurCurrency = currencies.find(c => c.code === 'EUR');
    const mxnCurrency = currencies.find(c => c.code === 'MXN');

    if (!usdCurrency) {
      console.log('❌ USD currency not found. Please ensure currencies are seeded first.');
      return;
    }

    // 1. Seed payment_methods table (used by client API)
    console.log('💳 Seeding payment_methods table...');
    const paymentMethodsData = [
      {
        name: 'Credit Card (Stripe)',
        description: 'Secure online credit card payments via Stripe',
        currency_id: usdCurrency.id,
        is_active: true
      },
      {
        name: 'Cash Payment',
        description: 'In-person cash payments',
        currency_id: usdCurrency.id,
        is_active: true
      },
      {
        name: 'Bank Transfer',
        description: 'Direct bank transfer payments',
        currency_id: usdCurrency.id,
        is_active: true
      },
      {
        name: 'PayPal',
        description: 'PayPal online payments',
        currency_id: usdCurrency.id,
        is_active: true
      },
      {
        name: 'QR Payment',
        description: 'QR code mobile payments',
        currency_id: usdCurrency.id,
        is_active: true
      },
      {
        name: 'Cryptocurrency',
        description: 'Bitcoin and other cryptocurrency payments',
        currency_id: usdCurrency.id,
        is_active: true
      },
      {
        name: 'Pay Later',
        description: 'Pay after service completion',
        currency_id: usdCurrency.id,
        is_active: true
      }
    ];

    // Add EUR and MXN versions if those currencies exist
    if (eurCurrency) {
      paymentMethodsData.push(
        {
          name: 'Credit Card (EUR)',
          description: 'Credit card payments in Euro',
          currency_id: eurCurrency.id,
          is_active: true
        },
        {
          name: 'Cash Payment (EUR)',
          description: 'Cash payments in Euro',
          currency_id: eurCurrency.id,
          is_active: true
        }
      );
    }

    if (mxnCurrency) {
      paymentMethodsData.push(
        {
          name: 'Efectivo (MXN)',
          description: 'Pagos en efectivo en pesos mexicanos',
          currency_id: mxnCurrency.id,
          is_active: true
        },
        {
          name: 'Transferencia Bancaria (MXN)',
          description: 'Transferencias bancarias en pesos mexicanos',
          currency_id: mxnCurrency.id,
          is_active: true
        }
      );
    }

    // Upsert payment methods
    const paymentMethods = [];
    for (const methodData of paymentMethodsData) {
      // Check if payment method already exists
      const existingMethod = await prisma.payment_methods.findFirst({
        where: {
          name: methodData.name,
          currency_id: methodData.currency_id
        }
      });

      let method;
      if (existingMethod) {
        // Update existing method
        method = await prisma.payment_methods.update({
          where: { id: existingMethod.id },
          data: {
            description: methodData.description,
            is_active: methodData.is_active
          }
        });
      } else {
        // Create new method
        method = await prisma.payment_methods.create({
          data: methodData
        });
      }
      paymentMethods.push(method);
    }

    console.log(`✅ Created/updated ${paymentMethods.length} payment methods`);

    // 2. Seed payment_method_configs table (used by admin API)
    console.log('⚙️  Seeding payment_method_configs table...');
    const paymentMethodConfigsData = [
      {
        name: 'Cash',
        type: 'cash',
        description: 'Cash payment',
        icon: '💵',
        requires_confirmation: false,
        auto_assign_package: true,
        is_active: true
      },
      {
        name: 'Bank Transfer',
        type: 'bank_transfer',
        description: 'Bank transfer payment',
        icon: '🏦',
        requires_confirmation: true,
        auto_assign_package: true,
        is_active: true
      },
      {
        name: 'QR Payment',
        type: 'qr_payment',
        description: 'QR code payment',
        icon: '📱',
        requires_confirmation: false,
        auto_assign_package: true,
        is_active: true
      },
      {
        name: 'Credit Card',
        type: 'credit_card',
        description: 'Credit card payment',
        icon: '💳',
        requires_confirmation: false,
        auto_assign_package: true,
        is_active: true
      },
      {
        name: 'Stripe',
        type: 'stripe',
        description: 'Stripe payment processing',
        icon: '💳',
        requires_confirmation: false,
        auto_assign_package: true,
        is_active: true
      },
      {
        name: 'Cryptocurrency',
        type: 'crypto',
        description: 'Cryptocurrency payment',
        icon: '₿',
        requires_confirmation: true,
        auto_assign_package: true,
        is_active: true
      },
      {
        name: 'Pay Later',
        type: 'pay_later',
        description: 'Pay after service',
        icon: '⏰',
        requires_confirmation: true,
        auto_assign_package: false,
        is_active: true
      }
    ];

    // Upsert payment method configs
    const paymentMethodConfigs = [];
    for (const configData of paymentMethodConfigsData) {
      // Check if payment method config already exists
      const existingConfig = await prisma.paymentMethodConfig.findFirst({
        where: { name: configData.name }
      });

      let config;
      if (existingConfig) {
        // Update existing config
        config = await prisma.paymentMethodConfig.update({
          where: { id: existingConfig.id },
                  data: {
          type: configData.type,
          description: configData.description,
          icon: configData.icon,
          requiresConfirmation: configData.requires_confirmation,
          autoAssignPackage: configData.auto_assign_package,
          isActive: configData.is_active
        }
        });
      } else {
        // Create new config
        config = await prisma.paymentMethodConfig.create({
          data: {
            name: configData.name,
            type: configData.type,
            description: configData.description,
            icon: configData.icon,
            requiresConfirmation: configData.requires_confirmation,
            autoAssignPackage: configData.auto_assign_package,
            isActive: configData.is_active
          }
        });
      }
      paymentMethodConfigs.push(config);
    }

    console.log(`✅ Created/updated ${paymentMethodConfigs.length} payment method configs`);

    // 3. Display summary
    console.log('\n📊 Payment Methods Summary:');
    console.log('='.repeat(50));
    
    console.log('\n💳 Payment Methods (Client API):');
    for (const method of paymentMethods) {
      const currency = currencies.find(c => c.id === method.currency_id);
      console.log(`  • ${method.name} (${currency?.symbol || 'N/A'}) - ${method.is_active ? 'Active' : 'Inactive'}`);
    }

    console.log('\n⚙️  Payment Method Configs (Admin API):');
    for (const config of paymentMethodConfigs) {
      console.log(`  • ${config.name} (${config.type}) - ${config.is_active ? 'Active' : 'Inactive'}`);
    }

    console.log('\n✅ Payment methods seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding payment methods:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
