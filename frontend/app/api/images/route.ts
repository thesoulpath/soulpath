import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Default images configuration when table is empty
const defaultImages = {
  id: 1,
  profileImage: '/assets/cf4f95a6cc4d03023c0e98479a93fe16d4ef06f2.png',
  heroImage: null,
  aboutImage: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .single();

    if (error) {
      // If table has no rows, return default images
      if (error.code === 'PGRST116') {
        console.log('Images table has no rows, using default images');
        return NextResponse.json({ images: defaultImages });
      }
      
      console.error('Error fetching images:', error);
      return NextResponse.json({ images: defaultImages });
    }

    return NextResponse.json({ images: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ images: defaultImages });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('images')
      .upsert(body, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error updating images:', error);
      return NextResponse.json({ images: defaultImages });
    }

    return NextResponse.json({ images: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ images: defaultImages });
  }
}
