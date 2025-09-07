import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🔍 GET /api/admin/content - Starting request...');

    // Authentication with timeout
    const authPromise = requireAuth(request);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Authentication timeout')), 5000)
    );

    const user = await Promise.race([authPromise, timeoutPromise]) as { email?: string } | null;

    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email || 'unknown');

    // Database query with error handling
    console.log('🔍 Fetching content from database...');

    let content;
    try {
      content = await prisma.content.findFirst({
        select: {
          id: true,
          heroTitleEn: true,
          heroTitleEs: true,
          heroSubtitleEn: true,
          heroSubtitleEs: true,
          aboutTitleEn: true,
          aboutTitleEs: true,
          aboutContentEn: true,
          aboutContentEs: true,
          approachTitleEn: true,
          approachTitleEs: true,
          approachContentEn: true,
          approachContentEs: true,
          servicesTitleEn: true,
          servicesTitleEs: true,
          servicesContentEn: true,
          servicesContentEs: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (content) {
        console.log('✅ Content fetched successfully:', Object.keys(content).length, 'fields');

        // Remove timestamps from response for cleaner data
        const { updatedAt, ...cleanContent } = content;

        return NextResponse.json({
          success: true,
          content: cleanContent,
          timestamp: new Date().toISOString(),
          fieldsCount: Object.keys(cleanContent).length
        });
      }
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      // Continue to fallback content
    }

    // Create default content if none exists or database error
    console.log('⚠️ No content found or database error, creating/returning default content...');

    const defaultContent = {
      heroTitleEn: 'Welcome to SOULPATH',
      heroTitleEs: 'Bienvenido a SOULPATH',
      heroSubtitleEn: 'Your journey to wellness starts here',
      heroSubtitleEs: 'Tu camino al bienestar comienza aquí',
      aboutTitleEn: 'About Us',
      aboutTitleEs: 'Sobre Nosotros',
      aboutContentEn: 'We are dedicated to helping you achieve your wellness goals.',
      aboutContentEs: 'Estamos dedicados a ayudarte a alcanzar tus metas de bienestar.',
      approachTitleEn: 'Our Approach',
      approachTitleEs: 'Nuestro Enfoque',
      approachContentEn: 'We use a holistic approach to wellness.',
      approachContentEs: 'Usamos un enfoque holístico para el bienestar.',
      servicesTitleEn: 'Our Services',
      servicesTitleEs: 'Nuestros Servicios',
      servicesContentEn: 'Professional wellness services in a peaceful environment.',
      servicesContentEs: 'Servicios profesionales de bienestar en un ambiente pacífico.'
    };

    // Try to create default content in database (don't fail if it doesn't work)
    try {
      await prisma.content.create({ data: defaultContent });
      console.log('✅ Default content created in database');
    } catch (createError) {
      console.warn('⚠️ Could not create default content in database:', createError);
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Default content returned in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      content: defaultContent,
      timestamp: new Date().toISOString(),
      fieldsCount: Object.keys(defaultContent).length,
      isDefault: true
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Unexpected error in GET /api/admin/content (${processingTime}ms):`, error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      error: 'Internal server error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🔍 PUT /api/admin/content - Starting request...');

    // Authentication with timeout
    const authPromise = requireAuth(request);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Authentication timeout')), 5000)
    );

    const user = await Promise.race([authPromise, timeoutPromise]) as { email?: string } | null;

    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email || 'unknown');

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Invalid JSON in request body:', parseError);
      return NextResponse.json({
        error: 'Invalid request format',
        message: 'Request body must be valid JSON'
      }, { status: 400 });
    }

    const { content } = body;
    console.log('📝 Processing content update...');

    if (!content || typeof content !== 'object') {
      return NextResponse.json({
        error: 'Invalid content data',
        message: 'Content must be a valid object'
      }, { status: 400 });
    }

    // Validate required fields
    const requiredFields = [
      'heroTitleEn', 'heroTitleEs', 'heroSubtitleEn', 'heroSubtitleEs',
      'aboutTitleEn', 'aboutTitleEs', 'aboutContentEn', 'aboutContentEs',
      'approachTitleEn', 'approachTitleEs', 'approachContentEn', 'approachContentEs',
      'servicesTitleEn', 'servicesTitleEs', 'servicesContentEn', 'servicesContentEs'
    ];

    const missingFields = requiredFields.filter(field => !content[field] || typeof content[field] !== 'string');
    if (missingFields.length > 0) {
      console.log('❌ Missing or invalid required fields:', missingFields);
      return NextResponse.json({
        error: 'Missing or invalid required fields',
        missingFields,
        message: 'All content fields must be non-empty strings'
      }, { status: 400 });
    }

    // Sanitize content data
    const sanitizedContent = { ...content };
    Object.keys(sanitizedContent).forEach(key => {
      if (typeof sanitizedContent[key] === 'string') {
        sanitizedContent[key] = sanitizedContent[key].trim();
      }
    });

    console.log('💾 Saving content to database...');

    // Find existing content or create new
    let result;
    const existingContent = await prisma.content.findFirst();

    if (existingContent) {
      // Update existing content
      result = await prisma.content.update({
        where: { id: existingContent.id },
        data: sanitizedContent,
        select: {
          id: true,
          heroTitleEn: true,
          heroTitleEs: true,
          heroSubtitleEn: true,
          heroSubtitleEs: true,
          aboutTitleEn: true,
          aboutTitleEs: true,
          aboutContentEn: true,
          aboutContentEs: true,
          approachTitleEn: true,
          approachTitleEs: true,
          approachContentEn: true,
          approachContentEs: true,
          servicesTitleEn: true,
          servicesTitleEs: true,
          servicesContentEn: true,
          servicesContentEs: true,
          updatedAt: true
        }
      });

      console.log('✅ Content updated successfully');
    } else {
      // Create new content
      result = await prisma.content.create({
        data: sanitizedContent,
        select: {
          id: true,
          heroTitleEn: true,
          heroTitleEs: true,
          heroSubtitleEn: true,
          heroSubtitleEs: true,
          aboutTitleEn: true,
          aboutTitleEs: true,
          aboutContentEn: true,
          aboutContentEs: true,
          approachTitleEn: true,
          approachTitleEs: true,
          approachContentEn: true,
          approachContentEs: true,
          servicesTitleEn: true,
          servicesTitleEs: true,
          servicesContentEn: true,
          servicesContentEs: true,
          createdAt: true,
          updatedAt: true
        }
      });

      console.log('✅ Content created successfully');
    }

    // Trigger revalidation
    try {
      await triggerRevalidation();
      console.log('✅ Page revalidation triggered');
    } catch (revalError) {
      console.warn('⚠️ Revalidation failed:', revalError);
    }

    const processingTime = Date.now() - startTime;

    // Remove timestamps from response
    const { updatedAt, ...cleanResult } = result;

    return NextResponse.json({
      success: true,
      content: cleanResult,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`,
      message: existingContent ? 'Content updated successfully' : 'Content created successfully'
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Unexpected error in PUT /api/admin/content (${processingTime}ms):`, error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      error: 'Internal server error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`
    }, { status: 500 });
  }
}

// Helper function to trigger comprehensive revalidation
async function triggerRevalidation() {
  try {
    console.log('🔄 Triggering comprehensive revalidation...');
    
    // Revalidate all static pages that use this content
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/api/content');
    
    // Revalidate content-related tags
    revalidateTag('content');
    revalidateTag('translations');
    revalidateTag('sections');
    
    // Also trigger the revalidation API for additional pages
    try {
      const revalResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`}/api/revalidate?path=/&tag=content`, {
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
