import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/email/config - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    const supabase = createAdminClient();
    console.log('🔍 Fetching from email_config table...');
    
    // Try to fetch from database first
    const { data, error } = await supabase
      .from('email_config')
      .select('*')
      .single();

    if (error) {
      console.log('⚠️ email_config table might not exist, using default config:', error.message);
      
      // Return default email configuration if table doesn't exist
      const defaultConfig = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: '',
        smtp_pass: '',
        from_email: 'noreply@soulpath.lat',
        from_name: 'SOULPATH',
        brevo_api_key: '',
        sender_email: '',
        sender_name: '',
        admin_email: '',
        // SMS/Labsmobile Configuration
        sms_provider: 'labsmobile',
        labsmobile_username: '',
        labsmobile_token: '',
        sms_sender_name: 'SoulPath',
        sms_enabled: false,
        // SMS Templates
        sms_otp_template_en: 'Your SoulPath verification code is: {{otpCode}}. This code expires in 10 minutes.',
        sms_otp_template_es: 'Su código de verificación de SoulPath es: {{otpCode}}. Este código expira en 10 minutos.',
        sms_booking_template_en: 'Your SoulPath session is confirmed for {{bookingDate}} at {{bookingTime}}. We look forward to seeing you!',
        sms_booking_template_es: 'Su sesión de SoulPath está confirmada para el {{bookingDate}} a las {{bookingTime}}. ¡Esperamos verte!'
      };
      
      console.log('✅ Returning default email config');
      return NextResponse.json({ config: defaultConfig });
    }

    console.log('✅ Email config fetched successfully:', data);
    return NextResponse.json({ config: data });
  } catch (error) {
    console.error('❌ Unexpected error in GET /api/admin/email/config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 PUT /api/admin/email/config - Starting request...');
    
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
      .from('email_config')
      .upsert(body, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.log('⚠️ email_config table might not exist, cannot update:', error.message);
      return NextResponse.json({ 
        error: 'Email configuration table does not exist. Please run the database setup first.',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Email config updated successfully:', data);
    return NextResponse.json({ config: data });
  } catch (error) {
    console.error('❌ Unexpected error in PUT /api/admin/email/config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}
