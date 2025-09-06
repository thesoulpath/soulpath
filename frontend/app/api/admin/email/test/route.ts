import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { to, language = 'en' } = body;

    if (!to) {
      return NextResponse.json({ 
        error: 'Recipient email is required' 
      }, { status: 400 });
    }

    // Send test email
    const success = await sendEmail(
      to,
      'Test Email - SOULPATH',
      `
        <h2>Test Email</h2>
        <p>This is a test email from the SOULPATH system.</p>
        <p>If you received this email, the email configuration is working correctly.</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
        <p>Language: ${language}</p>
      `
    );

    if (success) {
      return NextResponse.json({ 
        success: true,
        message: 'Test email sent successfully'
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to send test email' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
