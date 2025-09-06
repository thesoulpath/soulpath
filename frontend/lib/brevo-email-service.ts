interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface BrevoConfig {
  apiKey: string;
  senderEmail: string;
  senderName: string;
}

export class BrevoEmailService {
  private config: BrevoConfig;
  private baseUrl = 'https://api.brevo.com/v3';

  constructor(config: BrevoConfig) {
    this.config = config;
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const payload = {
        sender: {
          name: this.config.senderName,
          email: this.config.senderEmail
        },
        to: [
          {
            email: emailData.to,
            name: emailData.to.split('@')[0] // Use email prefix as name
          }
        ],
        subject: emailData.subject,
        htmlContent: emailData.html,
        textContent: emailData.text || this.stripHtml(emailData.html)
      };

      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Brevo API error:', errorData);
        throw new Error(`Brevo API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Email sent successfully via Brevo:', result);
      return true;
    } catch (error) {
      console.error('Failed to send email via Brevo:', error);
      return false;
    }
  }

  // Generic method to send any email using database templates
  async sendTemplateEmail(
    to: string,
    templateHtml: string,
    templateSubject: string,
    replacements: Record<string, string>
  ): Promise<boolean> {
    // Replace placeholders in the template
    let html = templateHtml;
    let subject = templateSubject;
    
    Object.entries(replacements).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      html = html.replace(new RegExp(placeholder, 'g'), value);
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
    });

    return this.sendEmail({
      to,
      subject,
      html
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '')
               .replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .trim();
  }
}

// Factory function to create email service from database config
export async function createEmailService(): Promise<BrevoEmailService | null> {
  try {
    // Try to fetch config from database first
    let config: BrevoConfig | null = null;
    
    try {
      // Import Supabase client dynamically to avoid SSR issues
      const { createServerClient } = await import('@/lib/supabase/server');
      const supabase = await createServerClient();
      
      const { data: emailConfig, error } = await supabase
        .from('email_config')
        .select('brevo_api_key, sender_email, sender_name')
        .single();
      
      if (!error && emailConfig) {
        config = {
          apiKey: emailConfig.brevo_api_key || process.env.BREVO_API_KEY || '',
          senderEmail: emailConfig.sender_email || process.env.BREVO_SENDER_EMAIL || 'info@matmax.store',
          senderName: emailConfig.sender_name || process.env.BREVO_SENDER_NAME || 'SoulPath'
        };
      }
    } catch (_dbError) {
      console.log('Could not fetch email config from database, using environment variables');
    }
    
    // Fallback to environment variables if database config is not available
    if (!config) {
      config = {
        apiKey: process.env.BREVO_API_KEY || '',
        senderEmail: process.env.BREVO_SENDER_EMAIL || 'info@matmax.store',
        senderName: process.env.BREVO_SENDER_NAME || 'SoulPath'
      };
    }

    if (!config.apiKey) {
      console.error('Brevo API key not configured in database or environment variables');
      return null;
    }

    return new BrevoEmailService(config);
  } catch (error) {
    console.error('Failed to create email service:', error);
    return null;
  }
}
