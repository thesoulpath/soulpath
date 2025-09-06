export interface Placeholder {
  key: string;
  description: string;
  category: string;
  example?: string;
  isConditional?: boolean;
}

export const EMAIL_PLACEHOLDERS: Record<string, Placeholder[]> = {
  basic: [
    { key: '{{userName}}', description: 'User\'s full name', category: 'basic', example: 'John Doe' },
    { key: '{{userEmail}}', description: 'User\'s email address', category: 'basic', example: 'john@example.com' },
    { key: '{{bookingId}}', description: 'Unique booking ID', category: 'basic', example: 'BK-12345' },
    { key: '{{language}}', description: 'Session language', category: 'basic', example: 'English' },
    { key: '{{adminEmail}}', description: 'Admin contact email', category: 'basic', example: 'admin@soulpath.lat' },
    { key: '{{submissionDate}}', description: 'When the booking was submitted', category: 'basic', example: '2024-01-15' }
  ],
  booking: [
    { key: '{{birthDate}}', description: 'Client\'s birth date', category: 'booking', example: '1990-05-15' },
    { key: '{{birthTime}}', description: 'Client\'s birth time', category: 'booking', example: '14:30' },
    { key: '{{birthPlace}}', description: 'Client\'s birth location', category: 'booking', example: 'New York, USA' },
    { key: '{{clientQuestion}}', description: 'Client\'s specific question', category: 'booking', example: 'What does my future hold?' },
    { key: '{{bookingDate}}', description: 'Scheduled session date', category: 'booking', example: '2024-01-20' },
    { key: '{{bookingTime}}', description: 'Scheduled session time', category: 'booking', example: '10:00 AM' },
    { key: '{{reminderDate}}', description: 'Date reminder was sent', category: 'booking', example: '2024-01-19' }
  ],
  scheduling: [
    { key: '{{newDate}}', description: 'New rescheduled date', category: 'scheduling', example: '2024-01-25' },
    { key: '{{newTime}}', description: 'New rescheduled time', category: 'scheduling', example: '2:00 PM' },
    { key: '{{oldDate}}', description: 'Previous date', category: 'scheduling', example: '2024-01-20' },
    { key: '{{oldTime}}', description: 'Previous time', category: 'scheduling', example: '10:00 AM' },
    { key: '{{rescheduleReason}}', description: 'Reason for rescheduling', category: 'scheduling', example: 'Emergency' },
    { key: '{{rescheduleDate}}', description: 'Date of reschedule', category: 'scheduling', example: '2024-01-18' }
  ],
  video: [
    { key: '{{videoConferenceLink}}', description: 'Video session link (when active)', category: 'video', example: 'https://meet.google.com/abc-defg-hij', isConditional: true },
    { key: '{{VIDEO_LINK}}', description: 'Direct video link placeholder', category: 'video', example: 'https://meet.google.com/abc-defg-hij' },
    { key: '{{#if videoConferenceLink}}...{{/if}}', description: 'Conditional video link block', category: 'video', example: '{{#if videoConferenceLink}}Join here: {{videoConferenceLink}}{{/if}}', isConditional: true }
  ]
};

export const SMS_PLACEHOLDERS: Record<string, Placeholder[]> = {
  basic: [
    { key: '{{userName}}', description: 'User\'s full name', category: 'basic', example: 'John Doe' },
    { key: '{{bookingId}}', description: 'Unique booking ID', category: 'basic', example: 'BK-12345' },
    { key: '{{language}}', description: 'Session language', category: 'basic', example: 'English' }
  ],
  verification: [
    { key: '{{otpCode}}', description: 'OTP verification code', category: 'verification', example: '123456' },
    { key: '{{expiryTime}}', description: 'OTP expiry time', category: 'verification', example: '10 minutes' }
  ],
  booking: [
    { key: '{{bookingDate}}', description: 'Scheduled session date', category: 'booking', example: '2024-01-20' },
    { key: '{{bookingTime}}', description: 'Scheduled session time', category: 'booking', example: '10:00 AM' },
    { key: '{{sessionType}}', description: 'Type of session', category: 'booking', example: 'Individual Reading' }
  ],
  scheduling: [
    { key: '{{newDate}}', description: 'New rescheduled date', category: 'scheduling', example: '2024-01-25' },
    { key: '{{newTime}}', description: 'New rescheduled time', category: 'scheduling', example: '2:00 PM' },
    { key: '{{rescheduleReason}}', description: 'Reason for rescheduling', category: 'scheduling', example: 'Emergency' }
  ]
};

export function getPlaceholders(type: 'email' | 'sms', category?: string): Placeholder[] {
  const placeholderMap = type === 'email' ? EMAIL_PLACEHOLDERS : SMS_PLACEHOLDERS;
  
  if (category && placeholderMap[category]) {
    return placeholderMap[category];
  }
  
  // Return all placeholders if no category specified
  return Object.values(placeholderMap).flat();
}

export function getPlaceholdersGrouped(type: 'email' | 'sms'): Record<string, Placeholder[]> {
  return type === 'email' ? EMAIL_PLACEHOLDERS : SMS_PLACEHOLDERS;
}

export function replacePlaceholders(content: string, data: Record<string, any>): string {
  let result = content;
  
  // Replace simple placeholders
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value || ''));
  });
  
  // Handle conditional blocks (simple implementation)
  result = result.replace(/\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs, (_, condition, content) => {
    if (data[condition]) {
      return content;
    }
    return '';
  });
  
  return result;
}

export function validatePlaceholders(content: string, type: 'email' | 'sms'): { valid: boolean; missing: string[] } {
  const placeholders = getPlaceholders(type);
  const placeholderKeys = placeholders.map(p => p.key.replace(/[{}]/g, ''));
  
  const usedPlaceholders = content.match(/\{\{(\w+)\}\}/g) || [];
  const usedKeys = usedPlaceholders.map(p => p.replace(/[{}]/g, ''));
  
  const missing = usedKeys.filter(key => !placeholderKeys.includes(key));
  
  return {
    valid: missing.length === 0,
    missing
  };
}
