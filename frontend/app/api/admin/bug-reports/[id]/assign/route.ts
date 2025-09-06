import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { assigneeId } = body;

    // Update bug report assignment
    const { data: bugReport, error } = await supabase
      .from('bug_reports')
      .update({ assignedTo: assigneeId })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating bug report assignment:', error);
      return NextResponse.json(
        { error: 'Failed to update bug report assignment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bugReport,
      message: 'Bug report assignment updated successfully'
    });

  } catch (error) {
    console.error('Error in update bug assignment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
