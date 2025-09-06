import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSections() {
  try {
    console.log('🌱 Seeding sections table...');
    
    // Clear existing sections
    await prisma.section.deleteMany({});
    console.log('✅ Existing sections cleared');
    
    // Default sections configuration
    const defaultSections = [
      {
        sectionId: 'invitation',
        type: 'hero',
        title: 'Invitation',
        description: 'Main landing section with cosmic theme',
        icon: 'Star',
        component: 'HeroSection',
        order: 0,
        enabled: true,
        mobileConfig: {
          padding: 'pt-20 pb-12',
          layout: 'center',
          imageSize: 'large'
        },
        desktopConfig: {
          padding: 'pt-16 pb-20',
          layout: 'center',
          imageSize: 'large'
        }
      },
      {
        sectionId: 'approach',
        type: 'content',
        title: 'Our Approach',
        description: 'How we work and our methodology',
        icon: 'Compass',
        component: 'ApproachSection',
        order: 1,
        enabled: true,
        mobileConfig: {
          padding: 'pt-20 pb-12',
          layout: 'stack',
          imageSize: 'medium'
        },
        desktopConfig: {
          padding: 'pt-16 pb-20',
          layout: 'grid',
          imageSize: 'medium'
        }
      },
      {
        sectionId: 'session',
        type: 'content',
        title: 'Sessions & Services',
        description: 'Available services and session types',
        icon: 'Clock',
        component: 'SessionSection',
        order: 2,
        enabled: true,
        mobileConfig: {
          padding: 'pt-20 pb-12',
          layout: 'stack',
          imageSize: 'medium'
        },
        desktopConfig: {
          padding: 'pt-16 pb-20',
          layout: 'grid',
          imageSize: 'medium'
        }
      },
      {
        sectionId: 'about',
        type: 'content',
        title: 'About SoulPath',
        description: 'Information about José and SoulPath',
        icon: 'User',
        component: 'AboutSection',
        order: 3,
        enabled: true,
        mobileConfig: {
          padding: 'pt-20 pb-12',
          layout: 'stack',
          imageSize: 'large'
        },
        desktopConfig: {
          padding: 'pt-16 pb-20',
          layout: 'grid',
          imageSize: 'large'
        }
      },
      {
        sectionId: 'apply',
        type: 'form',
        title: 'Book Your Session',
        description: 'Booking form and scheduling',
        icon: 'Calendar',
        component: 'BookingSection',
        order: 4,
        enabled: true,
        mobileConfig: {
          padding: 'pt-20 pb-12',
          layout: 'center',
          imageSize: 'small'
        },
        desktopConfig: {
          padding: 'pt-16 pb-20',
          layout: 'center',
          imageSize: 'small'
        }
      }
    ];
    
    // Create sections
    const createdSections = await Promise.all(
      defaultSections.map(async (section) => {
        return await prisma.section.create({
          data: section
        });
      })
    );
    
    console.log('✅ Sections seeded successfully:', createdSections.length);
    createdSections.forEach(section => {
      console.log(`   - ${section.title} (${section.sectionId})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding sections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSections();
