const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleSlots() {
  try {
    console.log('Creating sample schedule slots...');

    // First, create a schedule template if it doesn't exist
    const scheduleTemplate = await prisma.scheduleTemplate.upsert({
      where: { id: 1 },
      update: {},
      create: {
        dayOfWeek: 'Monday',
        startTime: '09:00:00',
        endTime: '17:00:00',
        capacity: 3,
        sessionDurationId: 1, // Assuming this exists
        isAvailable: true
      }
    });

    console.log('Schedule template created:', scheduleTemplate.id);

    // Create some sample schedule slots for the next few days
    const today = new Date();
    const slots = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Create 3 slots per day (9 AM, 1 PM, 4 PM)
      const times = ['09:00:00', '13:00:00', '16:00:00'];
      
      for (const time of times) {
        const startTime = new Date(date);
        const [hours, minutes] = time.split(':');
        startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 1); // 1 hour sessions
        
        slots.push({
          scheduleTemplateId: scheduleTemplate.id,
          startTime: startTime,
          endTime: endTime,
          capacity: 3,
          bookedCount: 0,
          isAvailable: true
        });
      }
    }

    // Insert all slots
    const createdSlots = await prisma.scheduleSlot.createMany({
      data: slots,
      skipDuplicates: true
    });

    console.log(`Created ${createdSlots.count} schedule slots`);

  } catch (error) {
    console.error('Error creating sample slots:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleSlots();
