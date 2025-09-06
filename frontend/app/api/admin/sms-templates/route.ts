import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/sms-templates - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    const supabase = createAdminClient();
    console.log('🔍 Fetching SMS templates from email_config table...');
    
    // Fetch SMS templates from email_config table
    const { data, error } = await supabase
      .from('email_config')
      .select('sms_otp_template_en, sms_otp_template_es, sms_booking_template_en, sms_booking_template_es')
      .single();

    if (error) {
      console.log('⚠️ email_config table might not exist, using default templates:', error.message);
      
      // Return default SMS templates if table doesn't exist
      const defaultTemplates = {
        sms_otp_template_en: 'Your SoulPath verification code is: {{otpCode}}. This code expires in 10 minutes.',
        sms_otp_template_es: 'Su código de verificación de SoulPath es: {{otpCode}}. Este código expira en 10 minutos.',
        sms_booking_template_en: 'Your SoulPath session is confirmed for {{bookingDate}} at {{bookingTime}}. We look forward to seeing you!',
        sms_booking_template_es: 'Su sesión de SoulPath está confirmada para el {{bookingDate}} a las {{bookingTime}}. ¡Esperamos verte!'
      };
      
      console.log('✅ Returning default SMS templates');
      return NextResponse.json({ templates: defaultTemplates });
    }

    console.log('✅ SMS templates fetched successfully:', data);
    return NextResponse.json({ templates: data });
  } catch (error) {
    console.error('❌ Unexpected error in GET /api/admin/sms-templates:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 PUT /api/admin/sms-templates - Starting request...');
    
    const user = await requireAuth(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);
    const body = await request.json();
    console.log('📝 Request body:', body);
    
    const supabase = createAdminClient();
    
    // Update SMS templates in email_config table
    const { data, error } = await supabase
      .from('email_config')
      .upsert({
        sms_otp_template_en: body.sms_otp_template_en,
        sms_otp_template_es: body.sms_otp_template_es,
        sms_booking_template_en: body.sms_booking_template_en,
        sms_booking_template_es: body.sms_booking_template_es
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.log('⚠️ email_config table might not exist, cannot update:', error.message);
      return NextResponse.json({ 
        error: 'SMS templates configuration table does not exist. Please run the database setup first.',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ SMS templates updated successfully:', data);
    return NextResponse.json({ templates: data });
  } catch (error) {
    console.error('❌ Unexpected error in PUT /api/admin/sms-templates:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}
