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

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[];

export type EntitiesMap = Record<string, string | number | boolean | null>;

export interface RasaAction {
  action: string;
  confidence: number;
  parameters?: Record<string, JSONValue>;
  response?: string;
}

export interface APICallResult {
  success: boolean;
  data?: JSONValue;
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
  id: string | number;
  sessionId: string;
  userId: string | null;
  message: string;
  userMessage: string;
  botResponse: string | null;
  llmResponse?: string;
  rasaResponse?: string;
  timestamp: string;
  intent?: string;
  rasaIntent: string | null;
  confidence?: number;
  rasaConfidence: number | null;
  entities?: RasaResponse['entities'];
  rasaEntities: RasaResponse['entities'] | null;
  action?: string;
  responseGenerator: string;
  bookingStep: string | null;
  bookingData?: JSONValue;
  bookingDataSnapshot: JSONValue | null;
  modelVersion: string | null;
  success?: boolean;
  apiCalls?: Array<APICallResult | APICallResult[]>;
  processingTime?: number;
  error?: string;
  feedback?: UserFeedback[];
}

export interface UserFeedback {
  id: number;
  conversationLogId: number;
  sessionId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewedForTraining: boolean;
}

export interface ConversationStats {
  totalLogs: number;
  lowConfidenceLogs: number;
  highConfidenceLogs: number;
  logsWithFeedback: number;
  averageConfidence: number;
  topIntents: Array<{intent: string, count: number}>;
}

export interface ConversationLogsResponse {
  success: boolean;
  data: ConversationLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  statistics: ConversationStats;
  error?: string;
  message?: string;
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
    description?: string;
  };
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  lastIntent?: string;
  lastEntities?: EntitiesMap;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    message: string;
    timestamp: string;
  }>;
  userPreferences?: {
    language: string;
    timezone: string;
    notificationSettings: JSONValue;
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
  details?: JSONValue;
}

export interface SuccessResponse {
  success: true;
  data: JSONValue;
  message?: string;
}

export type OrchestratorResponse = ErrorResponse | SuccessResponse;
