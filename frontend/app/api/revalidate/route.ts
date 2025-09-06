import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const tag = searchParams.get('tag');

    if (!path && !tag) {
      return NextResponse.json(
        { error: 'Missing path or tag parameter' },
        { status: 400 }
      );
    }

    console.log('🔄 Revalidation request:', { path, tag });

    if (path) {
      // Revalidate specific path
      revalidatePath(path);
      console.log(`✅ Path revalidated: ${path}`);
    }

    if (tag) {
      // Revalidate specific tag
      revalidateTag(tag);
      console.log(`✅ Tag revalidated: ${tag}`);
    }

    // Always revalidate the home page when content changes
    revalidatePath('/');
    revalidatePath('/admin');
    
    // Revalidate content-related tags
    revalidateTag('content');
    revalidateTag('translations');
    revalidateTag('sections');

    console.log('✅ Revalidation completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Revalidation completed',
      revalidated: {
        path: path || null,
        tag: tag || null,
        home: '/',
        admin: '/admin',
        contentTags: ['content', 'translations', 'sections']
      }
    });

  } catch (error) {
    console.error('❌ Revalidation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Revalidation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Revalidation endpoint is working',
    usage: {
      method: 'POST',
      parameters: {
        path: 'Optional: Path to revalidate (e.g., /api/revalidate?path=/about)',
        tag: 'Optional: Tag to revalidate (e.g., /api/revalidate?tag=content)'
      },
      examples: [
        'POST /api/revalidate?path=/',
        'POST /api/revalidate?tag=content',
        'POST /api/revalidate?path=/&tag=translations'
      ]
    }
  });
}
