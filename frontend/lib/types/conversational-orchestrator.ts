// Conversational Orchestrator Types
export interface WhatsAppMessage {
  from: string;
  to: string;
  body: string;
  messageId: string;
  timestamp: string;
  profileName?: string;
}

export interface RasaResponse {
  intent: {
    name: string;
    confidence: number;
  };
  entities: Array<{
    entity: string;
    value: string;
    confidence: number;
    start: number;
    end: number;
  }>;
  text: string;
  intent_ranking?: Array<{
    name: string;
    confidence: number;
  }>;
}

export interface RasaAction {
  action: string;
  confidence: number;
  parameters?: Record<string, any>;
}

export interface APICallResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
}

export interface LLMRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model: string;
  temperature?: number;
  max_tokens?: number;
}

export interface LLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ConversationLog {
  id: string;
  userId: string;
  message: string;
  intent: string;
  entities: Array<{
    entity: string;
    value: string;
    confidence: number;
  }>;
  action: string;
  rasaResponse: string;
  llmResponse: string;
  apiCalls: APICallResult[];
  timestamp: string;
  processingTime: number;
  success: boolean;
  error?: string;
}

export interface OrchestratorConfig {
  rasa: {
    url: string;
    model: string;
    confidence_threshold: number;
  };
  openrouter: {
    apiKey: string;
    baseUrl: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
    webhookUrl: string;
  };
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    storage: 'database' | 'file' | 'console';
  };
  apis: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
}

export interface IntentActionMapping {
  [intent: string]: {
    action: string;
    apiEndpoint?: string;
    requiredEntities?: string[];
    optionalEntities?: string[];
    description: string;
  };
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  lastIntent?: string;
  lastEntities?: Record<string, any>;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    message: string;
    timestamp: string;
  }>;
  userPreferences?: {
    language: string;
    timezone: string;
    notificationSettings: any;
  };
}

export interface SystemPrompt {
  role: 'system';
  content: string;
}

export interface UserPrompt {
  role: 'user';
  content: string;
}

export interface AssistantPrompt {
  role: 'assistant';
  content: string;
}

export type PromptMessage = SystemPrompt | UserPrompt | AssistantPrompt;

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
}

export interface SuccessResponse {
  success: true;
  data: any;
  message?: string;
}

export type OrchestratorResponse = ErrorResponse | SuccessResponse;
