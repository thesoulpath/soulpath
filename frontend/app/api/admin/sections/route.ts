import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/sections - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    // Fetch all sections from database
    const sections = await prisma.section.findMany({
      orderBy: { order: 'asc' }
    });

    console.log('✅ Sections fetched successfully:', sections.length);
    return NextResponse.json({ sections });

  } catch (error) {
    console.error('❌ Error in GET /api/admin/sections:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 PUT /api/admin/sections - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);
    const body = await request.json();
    console.log('📝 Request body:', body);

    const { sections, action = 'replace' } = body;

    if (!Array.isArray(sections)) {
      return NextResponse.json({ error: 'Sections array is required' }, { status: 400 });
    }

    let result;

    if (action === 'replace') {
      // Clear existing sections and create new ones (for full section management)
      await prisma.section.deleteMany({});

      result = await Promise.all(
        sections.map(async (section, index) => {
          return await prisma.section.create({
            data: {
              sectionId: section.id,
              type: section.type || 'content',
              title: section.title,
              description: section.description || '',
              icon: section.icon || 'Circle',
              component: section.component,
              order: section.order ?? index,
              enabled: section.enabled ?? true,
              mobileConfig: section.mobileConfig || {},
              desktopConfig: section.desktopConfig || {}
            }
          });
        })
      );
      console.log('✅ All sections replaced successfully:', result.length);
    } else if (action === 'add') {
      // Add new sections without deleting existing ones
      result = await Promise.all(
        sections.map(async (section) => {
          // Check if section already exists
          const existing = await prisma.section.findUnique({
            where: { sectionId: section.id }
          });

          if (existing) {
            // Update existing section
            return await prisma.section.update({
              where: { sectionId: section.id },
              data: {
                type: section.type || 'content',
                title: section.title,
                description: section.description || '',
                icon: section.icon || 'Circle',
                component: section.component,
                order: section.order ?? existing.order,
                enabled: section.enabled ?? true,
                mobileConfig: section.mobileConfig || {},
                desktopConfig: section.desktopConfig || {}
              }
            });
          } else {
            // Create new section
            return await prisma.section.create({
              data: {
                sectionId: section.id,
                type: section.type || 'content',
                title: section.title,
                description: section.description || '',
                icon: section.icon || 'Circle',
                component: section.component,
                order: section.order ?? 999, // Put new sections at the end
                enabled: section.enabled ?? true,
                mobileConfig: section.mobileConfig || {},
                desktopConfig: section.desktopConfig || {}
              }
            });
          }
        })
      );
      console.log('✅ Sections added/updated successfully:', result.length);
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "replace" or "add"' }, { status: 400 });
    }

    // Trigger revalidation
    await triggerRevalidation();

    return NextResponse.json({ sections: result });

  } catch (error) {
    console.error('❌ Error in PUT /api/admin/sections:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

// Helper function to trigger comprehensive revalidation
async function triggerRevalidation() {
  try {
    console.log('🔄 Triggering comprehensive revalidation for sections...');
    
    // Revalidate all static pages that use sections
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/api/content');
    
    // Revalidate section-related tags
    revalidateTag('content');
    revalidateTag('translations');
    revalidateTag('sections');
    
    // Also trigger the revalidation API for additional pages
    try {
      const revalResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/revalidate?path=/&tag=sections`, {
        method: 'POST'
      });
      
      if (revalResponse.ok) {
        console.log('✅ Additional revalidation triggered successfully');
      } else {
        console.log('⚠️ Additional revalidation failed, but core revalidation succeeded');
      }
    } catch (revalError) {
      console.log('⚠️ Additional revalidation failed, but core revalidation succeeded:', revalError);
    }
    
    console.log('✅ Comprehensive revalidation completed');
  } catch (error) {
    console.error('❌ Error during revalidation:', error);
    // Don't fail the request if revalidation fails
  }
}
