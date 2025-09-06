import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { seo } = body;

    if (!seo) {
      return NextResponse.json({ 
        error: 'SEO data is required' 
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('seo')
      .upsert(seo, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error seeding SEO:', error);
      return NextResponse.json({ error: 'Failed to seed SEO' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'SEO seeded successfully',
      seo: data
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
