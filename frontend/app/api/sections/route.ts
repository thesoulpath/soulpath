import { NextResponse } from 'next/server';
import { prisma, ensurePrismaConnected } from '@/lib/prisma';
import { withCache } from '@/lib/cache';

// ISR Configuration - This route will be statically generated and revalidated
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  const startTime = Date.now();

  try {
    console.log('🔍 GET /api/sections - Starting request...');

    // Default sections for fallback
    const defaultSections = [
      {
        id: 'invitation',
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
        id: 'approach',
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
        id: 'session',
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
        id: 'about',
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
        id: 'apply',
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

    // Ensure DB is connected (handles cold starts)
    await ensurePrismaConnected();

    // Try to fetch from database with caching
    let sections;
    try {
      sections = await withCache(
        'sections',
        async () => {
          return await prisma.section.findMany({
            where: { enabled: true },
            orderBy: { order: 'asc' },
            select: {
              sectionId: true,
              type: true,
              title: true,
              description: true,
              icon: true,
              component: true,
              order: true,
              enabled: true,
              mobileConfig: true,
              desktopConfig: true
            }
          });
        },
        10 * 60 * 1000 // Cache for 10 minutes
      );

      if (sections && sections.length > 0) {
        console.log('✅ Sections loaded from database:', sections.length, 'sections');

        // Transform database sections to match the expected format
        const transformedSections = sections.map(section => ({
          id: section.sectionId,
          type: section.type,
          title: section.title,
          description: section.description,
          icon: section.icon,
          component: section.component,
          order: section.order,
          enabled: section.enabled,
          mobileConfig: section.mobileConfig || {},
          desktopConfig: section.desktopConfig || {}
        }));

        const processingTime = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          sections: transformedSections,
          timestamp: new Date().toISOString(),
          processingTime: `${processingTime}ms`,
          source: 'database'
        });
      }
    } catch (dbError) {
      console.error('❌ Database error loading sections:', dbError);
      // Continue to fallback
    }

    // Fallback to default sections
    console.log('⚠️ Using default sections (database unavailable or empty)');

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      sections: defaultSections,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`,
      source: 'default',
      message: 'Using default section configuration'
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Unexpected error in GET /api/sections (${processingTime}ms):`, error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      error: 'Internal server error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`,
      sections: [
        {
          id: 'invitation',
          type: 'hero',
          title: 'Invitation',
          description: 'Main landing section with cosmic theme',
          icon: 'Star',
          component: 'HeroSection',
          order: 0,
          enabled: true
        }
      ]
    }, { status: 500 });
  }
}
