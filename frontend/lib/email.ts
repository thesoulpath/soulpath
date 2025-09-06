import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface EmailTemplate {
  en: {
    subject: string;
    html: string;
    videoConferenceLink?: {
      isActive: boolean;
      url: string;
      includeInTemplate: boolean;
    };
  };
  es: {
    subject: string;
    html: string;
    videoConferenceLink?: {
      isActive: boolean;
      url: string;
      includeInTemplate: boolean;
    };
  };
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
}

export async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const { data, error } = await supabase
      .from('email_config')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching email config:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching email config:', error);
    return null;
  }
}

export async function getEmailTemplates(): Promise<EmailTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching email templates:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return null;
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const config = await getEmailConfig();
    if (!config) {
      console.error('Email config not found');
      return false;
    }

    // For now, we'll use a simple approach
    // In production, you'd integrate with a service like SendGrid, Mailgun, etc.
    console.log('Sending email:', {
      to,
      subject,
      html: html.substring(0, 100) + '...',
      config: {
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        fromEmail: config.fromEmail
      }
    });

    // TODO: Implement actual email sending logic
    // This is a placeholder for the email sending implementation
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendBookingConfirmation(
  clientEmail: string,
  scheduleData: any,
  language: 'en' | 'es' = 'en'
): Promise<boolean> {
  try {
    const templates = await getEmailTemplates();
    if (!templates) {
      console.error('Email templates not found');
      return false;
    }

    const template = templates[language];
    const subject = template.subject;
    
    let html = template.html;
    
    // Replace placeholders with actual data
    html = html.replace('{{clientName}}', scheduleData.clientName || 'Client');
    html = html.replace('{{date}}', scheduleData.date);
    html = html.replace('{{time}}', scheduleData.time);
    html = html.replace('{{duration}}', scheduleData.duration);
    
    // Add video conference link if enabled
    if (template.videoConferenceLink?.isActive && template.videoConferenceLink?.includeInTemplate) {
      html += `<p><strong>Video Conference Link:</strong> <a href="${template.videoConferenceLink.url}">${template.videoConferenceLink.url}</a></p>`;
    }

    return await sendEmail(clientEmail, subject, html);
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
    return false;
  }
}
