import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the booking to verify ownership
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', params.id)
      .eq('client_id', user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found or access denied' }, { status: 404 });
    }

    // Get the session report
    const { data: report, error: reportError } = await supabase
      .from('session_reports')
      .select('*')
      .eq('booking_id', params.id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Session report not found' }, { status: 404 });
    }

    // Get the file from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('session-reports')
      .download(report.file_path);

    if (fileError || !fileData) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Convert to array buffer
    const arrayBuffer = await fileData.arrayBuffer();

    // Return the file with appropriate headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': report.mime_type || 'application/pdf',
        'Content-Disposition': `attachment; filename="${report.original_filename || 'session-report.pdf'}"`,
        'Content-Length': arrayBuffer.byteLength.toString()
      }
    });

  } catch (error) {
    console.error('Error in GET /api/client/bookings/[id]/report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
