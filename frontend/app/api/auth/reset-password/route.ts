import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(user.email || '', {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/account/profile?reset=true`
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return NextResponse.json({ error: 'Failed to send password reset email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/auth/reset-password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
