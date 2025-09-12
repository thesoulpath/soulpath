const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSamplePackages() {
  try {
    console.log('🔍 Creating sample packages...');

    // First, create a currency if it doesn't exist
    const currency = await prisma.currency.upsert({
      where: { code: 'USD' },
      update: {},
      create: {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar'
      }
    });

    // Create session duration if it doesn't exist
    const sessionDuration = await prisma.sessionDuration.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        duration_minutes: 60,
        name: 'Standard Session',
        description: 'Standard 60-minute astrology reading session'
      }
    });

    // Create sample packages
    const packages = [
      {
        name: 'Basic Reading',
        description: 'A comprehensive 60-minute astrology reading covering your birth chart, personality traits, and life guidance.',
        sessionsCount: 1,
        packageType: 'Individual',
        maxGroupSize: 1,
        isPopular: false,
        displayOrder: 1,
        isActive: true,
        packagePrices: {
          create: {
            price: 75.00,
            currencyId: currency.id,
            pricingMode: 'custom',
            isActive: true
          }
        },
        sessionDurationId: sessionDuration.id
      },
      {
        name: 'Premium Package',
        description: 'An in-depth 90-minute session including birth chart analysis, relationship compatibility, and career guidance.',
        sessionsCount: 1,
        packageType: 'Individual',
        maxGroupSize: 1,
        isPopular: true,
        displayOrder: 2,
        isActive: true,
        packagePrices: {
          create: {
            price: 120.00,
            currencyId: currency.id,
            pricingMode: 'custom',
            isActive: true
          }
        },
        sessionDurationId: sessionDuration.id
      },
      {
        name: 'Couples Reading',
        description: 'A special 2-hour session for couples focusing on relationship compatibility and shared life path guidance.',
        sessionsCount: 1,
        packageType: 'Couple',
        maxGroupSize: 2,
        isPopular: false,
        displayOrder: 3,
        isActive: true,
        packagePrices: {
          create: {
            price: 180.00,
            currencyId: currency.id,
            pricingMode: 'custom',
            isActive: true
          }
        },
        sessionDurationId: sessionDuration.id
      },
      {
        name: 'Spiritual Journey Package',
        description: 'A comprehensive 3-session package covering personal growth, spiritual development, and life transformation guidance.',
        sessionsCount: 3,
        packageType: 'Series',
        maxGroupSize: 1,
        isPopular: true,
        displayOrder: 4,
        isActive: true,
        packagePrices: {
          create: {
            price: 300.00,
            currencyId: currency.id,
            pricingMode: 'custom',
            isActive: true
          }
        },
        sessionDurationId: sessionDuration.id
      }
    ];

    for (const packageData of packages) {
      const { packagePrices, ...packageInfo } = packageData;
      
      const createdPackage = await prisma.packageDefinition.create({
        data: {
          ...packageInfo,
          packagePrices: packagePrices
        }
      });

      console.log(`✅ Created package: ${createdPackage.name}`);
    }

    console.log('🎉 Sample packages created successfully!');

  } catch (error) {
    console.error('❌ Error creating sample packages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSamplePackages();
