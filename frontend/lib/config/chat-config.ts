export interface ChatConfig {
  // UI Configuration
  ui: {
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    size: {
      width: number;
      height: number;
      minimizedHeight: number;
    };
    animations: {
      enabled: boolean;
      duration: number;
      easing: string;
    };
    theme: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
      accent: string;
    };
  };

  // Behavior Configuration
  behavior: {
    autoOpen: boolean;
    autoOpenDelay: number;
    keepOpenOnNavigation: boolean;
    clearOnClose: boolean;
    maxMessages: number;
    typingIndicator: boolean;
    soundEnabled: boolean;
  };

  // API Configuration
  api: {
    endpoint: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };

  // Features Configuration
  features: {
    fileUpload: boolean;
    emojiPicker: boolean;
    messageHistory: boolean;
    quickReplies: boolean;
    userTyping: boolean;
    messageReactions: boolean;
  };

  // Content Configuration
  content: {
    welcomeMessage: {
      es: string;
      en: string;
    };
    placeholder: {
      es: string;
      en: string;
    };
    assistantName: {
      es: string;
      en: string;
    };
    offlineMessage: {
      es: string;
      en: string;
    };
  };

  // Business Hours Configuration
  businessHours: {
    enabled: boolean;
    timezone: string;
    schedule: {
      monday: { start: string; end: string; enabled: boolean };
      tuesday: { start: string; end: string; enabled: boolean };
      wednesday: { start: string; end: string; enabled: boolean };
      thursday: { start: string; end: string; enabled: boolean };
      friday: { start: string; end: string; enabled: boolean };
      saturday: { start: string; end: string; enabled: boolean };
      sunday: { start: string; end: string; enabled: boolean };
    };
    customMessage: {
      es: string;
      en: string;
    };
  };

  // Analytics Configuration
  analytics: {
    enabled: boolean;
    trackMessages: boolean;
    trackUserBehavior: boolean;
    trackErrors: boolean;
    customEvents: string[];
  };

  // Accessibility Configuration
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    screenReaderSupport: boolean;
    keyboardNavigation: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

export const defaultChatConfig: ChatConfig = {
  ui: {
    position: 'bottom-right',
    size: {
      width: 384, // 96 * 4 (Tailwind w-96)
      height: 500,
      minimizedHeight: 60
    },
    animations: {
      enabled: true,
      duration: 0.3,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    },
    theme: {
      primary: '#FFD700',
      secondary: '#191970',
      background: '#0A0A23',
      text: '#EAEAEA',
      accent: '#FFD700'
    }
  },

  behavior: {
    autoOpen: false,
    autoOpenDelay: 3000,
    keepOpenOnNavigation: false,
    clearOnClose: false,
    maxMessages: 50,
    typingIndicator: true,
    soundEnabled: false
  },

  api: {
    endpoint: '/api/chat/web',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },

  features: {
    fileUpload: false,
    emojiPicker: false,
    messageHistory: true,
    quickReplies: true,
    userTyping: true,
    messageReactions: false
  },

  content: {
    welcomeMessage: {
      es: '¡Hola! Soy tu asistente de astrología. ¿En qué puedo ayudarte hoy?\n\n📅 Agendar citas\n📦 Consultar paquetes\n💳 Información de pagos\n📊 Estado de solicitudes\n❓ Preguntas generales',
      en: 'Hello! I\'m your astrology assistant. How can I help you today?\n\n📅 Schedule appointments\n📦 View packages\n💳 Payment information\n📊 Request status\n❓ General questions'
    },
    placeholder: {
      es: 'Escribe tu mensaje...',
      en: 'Type your message...'
    },
    assistantName: {
      es: 'Asistente Astrológico',
      en: 'Astrology Assistant'
    },
    offlineMessage: {
      es: 'El asistente no está disponible en este momento. Por favor intenta más tarde.',
      en: 'The assistant is not available at the moment. Please try again later.'
    }
  },

  businessHours: {
    enabled: true,
    timezone: 'America/Mexico_City',
    schedule: {
      monday: { start: '09:00', end: '18:00', enabled: true },
      tuesday: { start: '09:00', end: '18:00', enabled: true },
      wednesday: { start: '09:00', end: '18:00', enabled: true },
      thursday: { start: '09:00', end: '18:00', enabled: true },
      friday: { start: '09:00', end: '18:00', enabled: true },
      saturday: { start: '10:00', end: '16:00', enabled: true },
      sunday: { start: '10:00', end: '16:00', enabled: false }
    },
    customMessage: {
      es: 'Actualmente fuera del horario de atención. Nuestro horario es de lunes a sábado de 9:00 a 18:00.',
      en: 'Currently outside business hours. Our hours are Monday to Saturday from 9:00 AM to 6:00 PM.'
    }
  },

  analytics: {
    enabled: true,
    trackMessages: true,
    trackUserBehavior: true,
    trackErrors: true,
    customEvents: ['chat_opened', 'message_sent', 'message_received', 'chat_closed']
  },

  accessibility: {
    highContrast: false,
    reducedMotion: false,
    screenReaderSupport: true,
    keyboardNavigation: true,
    fontSize: 'medium'
  }
};

// Helper functions
export const isBusinessHours = (config: ChatConfig): boolean => {
  if (!config.businessHours.enabled) return true;

  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' }) as keyof typeof config.businessHours.schedule;
  const schedule = config.businessHours.schedule[day];

  if (!schedule.enabled) return false;

  const currentTime = now.getHours() * 100 + now.getMinutes();
  const startTime = parseInt(schedule.start.replace(':', ''));
  const endTime = parseInt(schedule.end.replace(':', ''));

  return currentTime >= startTime && currentTime <= endTime;
};

export const getPositionClasses = (position: ChatConfig['ui']['position']): string => {
  switch (position) {
    case 'bottom-left':
      return 'bottom-24 left-6';
    case 'top-right':
      return 'top-24 right-6';
    case 'top-left':
      return 'top-24 left-6';
    case 'bottom-right':
    default:
      return 'bottom-24 right-6';
  }
};

export const getTogglePositionClasses = (position: ChatConfig['ui']['position']): string => {
  switch (position) {
    case 'bottom-left':
      return 'bottom-6 left-6';
    case 'top-right':
      return 'top-6 right-6';
    case 'top-left':
      return 'top-6 left-6';
    case 'bottom-right':
    default:
      return 'bottom-6 right-6';
  }
};
