import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function PATCH(
  _request: NextRequest,
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

    // Archive bug report
    const { data: bugReport, error } = await supabase
      .from('bug_reports')
      .update({ 
        status: 'ARCHIVED',
        archivedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error archiving bug report:', error);
      return NextResponse.json(
        { error: 'Failed to archive bug report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bugReport,
      message: 'Bug report archived successfully'
    });

  } catch (error) {
    console.error('Error in archive bug report API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
