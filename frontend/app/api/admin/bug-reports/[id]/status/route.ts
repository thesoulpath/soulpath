import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

interface BugReportUpdateData {
  status: string;
  resolvedAt?: string;
}

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
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Update bug report status
    const updateData: BugReportUpdateData = { status };
    
    // Set resolvedAt if status is RESOLVED
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date().toISOString();
    }

    const { data: bugReport, error } = await supabase
      .from('bug_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating bug report status:', error);
      return NextResponse.json(
        { error: 'Failed to update bug report status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bugReport,
      message: 'Bug report status updated successfully'
    });

  } catch (error) {
    console.error('Error in update bug status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
