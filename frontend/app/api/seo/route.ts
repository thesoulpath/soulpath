import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('seo')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching SEO settings:', error);
      return NextResponse.json({ error: 'Failed to fetch SEO settings' }, { status: 500 });
    }

    return NextResponse.json({ seo: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const { data, error } = await supabase
      .from('seo')
      .upsert(body, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error updating SEO settings:', error);
      return NextResponse.json({ error: 'Failed to update SEO settings' }, { status: 500 });
    }

    return NextResponse.json({ seo: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
