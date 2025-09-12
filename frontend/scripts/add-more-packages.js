import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Adding more packages to test Show More functionality...');

  try {
    // Get existing currencies and session durations
    const usd = await prisma.currency.findUnique({ where: { code: 'USD' } });
    const duration60 = await prisma.sessionDuration.findFirst({ where: { duration_minutes: 60 } });
    const duration90 = await prisma.sessionDuration.findFirst({ where: { duration_minutes: 90 } });

    if (!usd || !duration60 || !duration90) {
      console.error('❌ Required currencies or session durations not found');
      return;
    }

    // Add more packages
    const newPackages = [
      {
        name: 'Family Reading',
        description: 'A special session for families to explore their astrological connections and dynamics.',
        sessionsCount: 1,
        sessionDurationId: duration90.id,
        packageType: 'family',
        maxGroupSize: 4,
        price: 300.00
      },
      {
        name: 'Career Guidance',
        description: 'Focused astrological reading to help you understand your career path and professional opportunities.',
        sessionsCount: 1,
        sessionDurationId: duration60.id,
        packageType: 'individual',
        maxGroupSize: 1,
        price: 150.00
      },
      {
        name: 'Relationship Analysis',
        description: 'Deep dive into relationship compatibility and dynamics for couples.',
        sessionsCount: 1,
        sessionDurationId: duration90.id,
        packageType: 'couple',
        maxGroupSize: 2,
        price: 280.00
      },
      {
        name: 'Yearly Forecast',
        description: 'Comprehensive yearly forecast with monthly breakdowns and important dates.',
        sessionsCount: 1,
        sessionDurationId: duration90.id,
        packageType: 'individual',
        maxGroupSize: 1,
        price: 220.00
      }
    ];

    for (const pkgData of newPackages) {
      // Check if package already exists
      const existingPackage = await prisma.packageDefinition.findFirst({
        where: { name: pkgData.name }
      });

      if (!existingPackage) {
        // Create package definition
        const packageDefinition = await prisma.packageDefinition.create({
          data: {
            name: pkgData.name,
            description: pkgData.description,
            sessionsCount: pkgData.sessionsCount,
            sessionDurationId: pkgData.sessionDurationId,
            packageType: pkgData.packageType,
            maxGroupSize: pkgData.maxGroupSize,
            isActive: true
          }
        });

        // Create package price
        await prisma.packagePrice.create({
          data: {
            packageDefinitionId: packageDefinition.id,
            currencyId: usd.id,
            price: pkgData.price,
            pricingMode: 'custom',
            isActive: true
          }
        });

        console.log(`✅ Created package: ${pkgData.name} - $${pkgData.price}`);
      } else {
        console.log(`⚠️ Package already exists: ${pkgData.name}`);
      }
    }

    console.log('🎉 Additional packages added successfully!');

  } catch (error) {
    console.error('❌ Error adding packages:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
