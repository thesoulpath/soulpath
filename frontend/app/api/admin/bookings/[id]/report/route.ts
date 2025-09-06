import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerClient();

    // Get the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', params.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const notes = formData.get('notes') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.' }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large. Maximum size is 5MB.' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `session-report-${params.id}-${timestamp}-${file.name}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('session-reports')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('session-reports')
      .getPublicUrl(filename);

    // Create session report record
    const { data: report, error: reportError } = await supabase
      .from('session_reports')
      .insert({
        booking_id: params.id,
        file_path: filename,
        original_filename: file.name,
        mime_type: file.type,
        file_size: file.size,
        notes: notes || null,
        uploaded_by: user.id,
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error creating report record:', reportError);
      return NextResponse.json({ error: 'Failed to create report record' }, { status: 500 });
    }

    // Update booking status if needed
    await supabase
      .from('bookings')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id);

    return NextResponse.json({
      success: true,
      data: {
        report,
        publicUrl
      },
      message: 'Session report uploaded successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/admin/bookings/[id]/report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
