import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/communication/config - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    const supabase = createAdminClient();
    console.log('🔍 Fetching from communication_config table...');
    
    // Try to fetch from database first
    const { data, error } = await supabase
      .from('communication_config')
      .select('*')
      .single();

    if (error) {
      console.log('⚠️ communication_config table might not exist, using default config:', error.message);
      
      // Return default communication configuration if table doesn't exist
      const defaultConfig = {
        email_enabled: true,
        brevo_api_key: '',
        sender_email: 'noreply@soulpath.lat',
        sender_name: 'SOULPATH',
        admin_email: 'admin@soulpath.lat',
        sms_enabled: false,
        sms_provider: 'labsmobile',
        labsmobile_username: '',
        labsmobile_token: '',
        sms_sender_name: 'SoulPath'
      };
      
      console.log('✅ Returning default communication config');
      return NextResponse.json({ config: defaultConfig });
    }

    console.log('✅ Communication config fetched successfully:', data);
    return NextResponse.json({ config: data });
  } catch (error) {
    console.error('❌ Unexpected error in GET /api/admin/communication/config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 PUT /api/admin/communication/config - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);
    const body = await request.json();
    console.log('📝 Request body:', body);
    
    const supabase = createAdminClient();
    
    // Try to update the table
    const { data, error } = await supabase
      .from('communication_config')
      .upsert(body, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.log('⚠️ communication_config table might not exist, cannot update:', error.message);
      return NextResponse.json({ 
        error: 'Communication configuration table does not exist. Please run the database setup first.',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Communication config updated successfully:', data);
    return NextResponse.json({ config: data });
  } catch (error) {
    console.error('❌ Unexpected error in PUT /api/admin/communication/config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}
