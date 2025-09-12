import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding booking data...');

  try {
    // 1. Create currencies
    console.log('💰 Creating currencies...');
    const usd = await prisma.currency.upsert({
      where: { code: 'USD' },
      update: {},
      create: {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        is_default: true
      }
    });
    console.log('✅ USD currency created');

    const eur = await prisma.currency.upsert({
      where: { code: 'EUR' },
      update: {},
      create: {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        is_default: false
      }
    });
    console.log('✅ EUR currency created');

    // 2. Create session durations
    console.log('⏱️ Creating session durations...');
    const duration60 = await prisma.sessionDuration.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Standard Session',
        description: '60-minute astrological reading',
        duration_minutes: 60,
        isActive: true
      }
    });
    console.log('✅ 60-minute session duration created');

    const duration90 = await prisma.sessionDuration.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Extended Session',
        description: '90-minute comprehensive astrological reading',
        duration_minutes: 90,
        isActive: true
      }
    });
    console.log('✅ 90-minute session duration created');

    // 3. Create package definitions
    console.log('📦 Creating package definitions...');
    const basicPackage = await prisma.packageDefinition.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Basic Reading',
        description: 'A comprehensive birth chart reading with insights into your personality, strengths, and life path.',
        sessionsCount: 1,
        sessionDurationId: duration60.id,
        packageType: 'individual',
        maxGroupSize: 1,
        isActive: true
      }
    });
    console.log('✅ Basic package created');

    const premiumPackage = await prisma.packageDefinition.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Premium Reading',
        description: 'An extended 90-minute session with detailed analysis of your birth chart, transits, and future guidance.',
        sessionsCount: 1,
        sessionDurationId: duration90.id,
        packageType: 'individual',
        maxGroupSize: 1,
        isActive: true
      }
    });
    console.log('✅ Premium package created');

    const couplePackage = await prisma.packageDefinition.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Couple Compatibility',
        description: 'A special session for couples to explore their astrological compatibility and relationship dynamics.',
        sessionsCount: 1,
        sessionDurationId: duration90.id,
        packageType: 'couple',
        maxGroupSize: 2,
        isActive: true
      }
    });
    console.log('✅ Couple package created');

    // 4. Create package prices
    console.log('💵 Creating package prices...');
    await prisma.packagePrice.upsert({
      where: {
        packageDefinitionId_currencyId: {
          packageDefinitionId: basicPackage.id,
          currencyId: usd.id
        }
      },
      update: {},
      create: {
        packageDefinitionId: basicPackage.id,
        currencyId: usd.id,
        price: 120.00,
        pricingMode: 'custom',
        isActive: true
      }
    });
    console.log('✅ Basic package USD price created');

    await prisma.packagePrice.upsert({
      where: {
        packageDefinitionId_currencyId: {
          packageDefinitionId: premiumPackage.id,
          currencyId: usd.id
        }
      },
      update: {},
      create: {
        packageDefinitionId: premiumPackage.id,
        currencyId: usd.id,
        price: 180.00,
        pricingMode: 'custom',
        isActive: true
      }
    });
    console.log('✅ Premium package USD price created');

    await prisma.packagePrice.upsert({
      where: {
        packageDefinitionId_currencyId: {
          packageDefinitionId: couplePackage.id,
          currencyId: usd.id
        }
      },
      update: {},
      create: {
        packageDefinitionId: couplePackage.id,
        currencyId: usd.id,
        price: 250.00,
        pricingMode: 'custom',
        isActive: true
      }
    });
    console.log('✅ Couple package USD price created');

    // 5. Create schedule templates
    console.log('📅 Creating schedule templates...');
    const daysOfWeek = [
      { day: 1, name: 'Monday' },
      { day: 2, name: 'Tuesday' },
      { day: 3, name: 'Wednesday' },
      { day: 4, name: 'Thursday' },
      { day: 5, name: 'Friday' },
      { day: 6, name: 'Saturday' }
    ];

    const timeSlots = [
      { start: '09:00', end: '10:30' },
      { start: '11:00', end: '12:30' },
      { start: '14:00', end: '15:30' },
      { start: '16:00', end: '17:30' },
      { start: '18:00', end: '19:30' }
    ];

    for (const day of daysOfWeek) {
      for (const slot of timeSlots) {
        // Check if template already exists
        const existingTemplate = await prisma.scheduleTemplate.findFirst({
          where: {
            dayOfWeek: day.day.toString(),
            startTime: slot.start,
            endTime: slot.end,
            sessionDurationId: duration60.id
          }
        });

        if (!existingTemplate) {
          await prisma.scheduleTemplate.create({
            data: {
              dayOfWeek: day.day.toString(),
              startTime: slot.start,
              endTime: slot.end,
              sessionDurationId: duration60.id,
              capacity: 1,
              isAvailable: true
            }
          });
        }
      }
    }
    console.log('✅ Schedule templates created');

    // 6. Create schedule slots for the next 30 days
    console.log('📆 Creating schedule slots for next 30 days...');
    const today = new Date();
    const scheduleTemplates = await prisma.scheduleTemplate.findMany({
      where: { isAvailable: true }
    });

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Skip Sunday (day 0)
      if (dayOfWeek === 0) continue;

      // Find templates for this day of week
      const dayTemplates = scheduleTemplates.filter(template => template.dayOfWeek === dayOfWeek.toString());

      for (const template of dayTemplates) {
        const startTime = new Date(date);
        const [hours, minutes] = template.startTime.split(':');
        startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const endTime = new Date(date);
        const [endHours, endMinutes] = template.endTime.split(':');
        endTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

        // Check if slot already exists
        const existingSlot = await prisma.scheduleSlot.findFirst({
          where: {
            scheduleTemplateId: template.id,
            startTime: startTime,
            endTime: endTime
          }
        });

        if (!existingSlot) {
          await prisma.scheduleSlot.create({
            data: {
              scheduleTemplateId: template.id,
              startTime: startTime,
              endTime: endTime,
              capacity: template.capacity,
              bookedCount: 0,
              isAvailable: true
            }
          });
        }
      }
    }
    console.log('✅ Schedule slots created for next 30 days');

    console.log('🎉 Booking data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding booking data:', error);
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
