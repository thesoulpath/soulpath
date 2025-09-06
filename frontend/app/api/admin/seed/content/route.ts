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
    const { content } = body;

    if (!content) {
      return NextResponse.json({ 
        error: 'Content data is required' 
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('content')
      .upsert(content, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error seeding content:', error);
      return NextResponse.json({ error: 'Failed to seed content' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Content seeded successfully',
      content: data
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
