import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(
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
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Insert comment
    const { data: comment, error } = await supabase
      .from('bug_comments')
      .insert({
        content: content.trim(),
        authorId: user.id,
        bugReportId: id
      })
      .select(`
        *,
        author:users!bug_comments_author_id_fkey(id, fullName, email)
      `)
      .single();

    if (error) {
      console.error('Error inserting comment:', error);
      return NextResponse.json(
        { error: 'Failed to add comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comment,
      message: 'Comment added successfully'
    });

  } catch (error) {
    console.error('Error in add comment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
