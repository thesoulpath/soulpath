import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestPurchases() {
  try {
    console.log('🌱 Seeding test purchases...');

    // First, get or create a test user
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          fullName: 'Test User',
          phone: '+1234567890',
          role: 'user',
          status: 'active',
          language: 'en'
        }
      });
      console.log('✅ Created test user:', testUser.email);
    }

    // Get or create a package price
    let packagePrice = await prisma.packagePrice.findFirst({
      where: { isActive: true }
    });

    if (!packagePrice) {
      // Create a package definition first
      const packageDefinition = await prisma.packageDefinition.create({
        data: {
          name: 'Test Package',
          description: 'A test package for development',
          sessionsCount: 5,
          packageType: 'individual',
          isActive: true,
          sessionDurationId: 1 // Assuming session duration with ID 1 exists
        }
      });

      // Create a package price
      packagePrice = await prisma.packagePrice.create({
        data: {
          packageDefinitionId: packageDefinition.id,
          price: 100.00,
          currencyCode: 'USD',
          pricingMode: 'custom',
          isActive: true
        }
      });
      console.log('✅ Created test package price:', packagePrice.id);
    }

    // Create test purchases
    const testPurchases = [
      {
        userId: testUser.id,
        totalAmount: 100.00,
        currencyCode: 'USD',
        paymentMethod: 'stripe',
        paymentStatus: 'completed',
        transactionId: 'txn_test_001',
        notes: 'Test purchase 1',
        purchasedAt: new Date('2024-01-15'),
        confirmedAt: new Date('2024-01-15')
      },
      {
        userId: testUser.id,
        totalAmount: 150.00,
        currencyCode: 'USD',
        paymentMethod: 'paypal',
        paymentStatus: 'pending',
        transactionId: 'txn_test_002',
        notes: 'Test purchase 2',
        purchasedAt: new Date('2024-01-20')
      },
      {
        userId: testUser.id,
        totalAmount: 200.00,
        currencyCode: 'USD',
        paymentMethod: 'bank',
        paymentStatus: 'failed',
        transactionId: 'txn_test_003',
        notes: 'Test purchase 3',
        purchasedAt: new Date('2024-01-25')
      }
    ];

    for (const purchaseData of testPurchases) {
      const existingPurchase = await prisma.purchase.findFirst({
        where: { transactionId: purchaseData.transactionId }
      });

      if (!existingPurchase) {
        const purchase = await prisma.purchase.create({
          data: purchaseData
        });

        // Create user package
        await prisma.userPackage.create({
          data: {
            userId: testUser.id,
            purchaseId: purchase.id,
            packagePriceId: packagePrice.id,
            quantity: 1,
            sessionsUsed: 0,
            isActive: true,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
          }
        });

        // Create payment record
        await prisma.paymentRecord.create({
          data: {
            userId: testUser.id,
            purchaseId: purchase.id,
            amount: purchaseData.totalAmount,
            currencyCode: purchaseData.currencyCode,
            paymentMethod: purchaseData.paymentMethod,
            paymentStatus: purchaseData.paymentStatus,
            transactionId: purchaseData.transactionId,
            paymentDate: purchaseData.purchasedAt
          }
        });

        console.log('✅ Created test purchase:', purchase.id, purchaseData.transactionId);
      }
    }

    console.log('🎉 Test purchases seeded successfully!');
    console.log('📊 Created test data for user:', testUser.email);

  } catch (error) {
    console.error('❌ Error seeding test purchases:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestPurchases();
