interface OpenRouterResponse {
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

interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1';
  private defaultModel: string = 'meta-llama/llama-3.3-8b-instruct:free';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ OpenRouter API key is not set. OpenRouter features will be disabled.');
    }
  }

  /**
   * Generate a dynamic, empathetic response for the booking flow
   */
  async generateBookingResponse(context: {
    userMessage: string;
    bookingState: any;
    missingDetails: string[];
    emotionalTone?: 'urgent' | 'calm' | 'confused' | 'excited';
    persona: 'empathetic' | 'professional' | 'spiritual';
  }): Promise<string> {
    if (!this.apiKey) {
      return "I'd be happy to help you with your booking. Please let me know what type of session you're interested in.";
    }
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(context);

    const response = await this.makeRequest({
      model: this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || 'I apologize, but I had trouble generating a response. Could you please try again?';
  }

  /**
   * Handle NLU fallback when Rasa confidence is low
   */
  async extractEntitiesFromFallback(context: {
    userMessage: string;
    conversationHistory: Array<{ role: string; content: string }>;
    requiredEntities: string[];
  }): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, any>;
  }> {
    const systemPrompt = `You are an expert at extracting structured information from natural language. 
    Extract booking-related entities from user messages and return them in JSON format.
    
    Required entities: ${context.requiredEntities.join(', ')}
    
    Return format:
    {
      "intent": "book_reading" | "provide_info" | "chitchat" | "nlu_fallback",
      "confidence": 0.0-1.0,
      "entities": {
        "person_name": "extracted name",
        "email_address": "extracted email",
        "phone_number": "extracted phone",
        "birth_date": "extracted birth date",
        "birth_time": "extracted birth time",
        "birth_place": "extracted birth place",
        "question_text": "extracted question",
        "language_preference": "extracted language"
      }
    }`;

    const userPrompt = `Extract entities from this message: "${context.userMessage}"
    
    Conversation history:
    ${context.conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;

    const response = await this.makeRequest({
      model: this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    try {
      const extracted = JSON.parse(response.choices[0]?.message?.content || '{}');
      return {
        intent: extracted.intent || 'nlu_fallback',
        confidence: extracted.confidence || 0.5,
        entities: extracted.entities || {}
      };
    } catch (error) {
      console.error('Error parsing OpenRouter response:', error);
      return {
        intent: 'nlu_fallback',
        confidence: 0.3,
        entities: {}
      };
    }
  }

  /**
   * Handle general questions and chitchat
   */
  async handleChitchat(context: {
    userMessage: string;
    conversationHistory: Array<{ role: string; content: string }>;
    brandContext: {
      astrologerName: string;
      services: string[];
      specialties: string[];
    };
  }): Promise<string> {
    const systemPrompt = `You are a knowledgeable and empathetic assistant for SoulPath Wellness, representing ${context.brandContext.astrologerName}.
    
    About our services:
    - ${context.brandContext.services.join('\n- ')}
    
    Our specialties:
    - ${context.brandContext.specialties.join('\n- ')}
    
    Keep responses SHORT and CONCISE (1-2 sentences max). Be warm and helpful. 
    
    IMPORTANT: If the user introduces themselves or mentions their name (in Spanish or English), acknowledge it warmly and ask how you can help them.
    
    If you don't know something specific, gently guide the user to book a reading for personalized answers.`;

    const userPrompt = `User question: "${context.userMessage}"
    
    Conversation context:
    ${context.conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;

    const response = await this.makeRequest({
      model: this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 150,
      temperature: 0.8
    });

    return response.choices[0]?.message?.content || 'I\'d be happy to help you with that! Would you like to book a reading to get personalized insights?';
  }

  /**
   * Generate training data variations for Rasa
   */
  async generateTrainingVariations(originalMessage: string, intent: string): Promise<string[]> {
    const systemPrompt = `Generate 5 different ways to express the same intent as the given message. 
    Keep the same meaning but use different words, phrasing, and style. Make them sound natural and conversational.
    
    Intent: ${intent}
    Original message: "${originalMessage}"`;

    const response = await this.makeRequest({
      model: this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate variations for: "${originalMessage}"` }
      ],
      max_tokens: 300,
      temperature: 0.9
    });

    const content = response.choices[0]?.message?.content || '';
    return content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('-'))
      .slice(0, 5);
  }

  private buildSystemPrompt(context: any): string {
    const basePrompt = `You are an empathetic, intuitive, and spiritually aware astrology booking assistant for SoulPath Wellness. 
    You help users book readings with Jose Garfias, a renowned astrologer.
    
    Your personality:
    - Warm and welcoming
    - Patient and understanding
    - Spiritually aware and intuitive
    - Professional yet personal
    - Encouraging and supportive
    
    Current booking state: ${JSON.stringify(context.bookingState, null, 2)}
    Missing details: ${context.missingDetails.join(', ')}
    
    Your goal is to gently guide the user through the booking process while maintaining a spiritual, 
    empathetic tone that reflects the transformative nature of astrology readings.`;

    if (context.persona === 'spiritual') {
      return basePrompt + `\n\nEmphasize the spiritual and transformative aspects of the reading. 
      Use language that speaks to the soul and personal growth.`;
    } else if (context.persona === 'professional') {
      return basePrompt + `\n\nMaintain a professional yet warm tone. Focus on the practical aspects 
      of the booking while being helpful and efficient.`;
    }

    return basePrompt;
  }

  private buildUserPrompt(context: any): string {
    let prompt = `User message: "${context.userMessage}"\n\n`;
    
    if (context.missingDetails.length > 0) {
      prompt += `The user still needs to provide: ${context.missingDetails.join(', ')}\n\n`;
    }
    
    if (context.emotionalTone) {
      prompt += `Emotional tone detected: ${context.emotionalTone}\n\n`;
    }
    
    prompt += `Please respond in a way that moves the conversation forward while being empathetic and helpful.`;
    
    return prompt;
  }

  /**
   * Generate an error response when something goes wrong
   */
  async generateErrorResponse(
    errorMessage: string,
    userMessage: string,
    intent: string
  ): Promise<string> {
    const systemPrompt = `You are a helpful astrology booking assistant. Something went wrong, but be helpful and guide them toward booking a reading.

Error: ${errorMessage}
User: "${userMessage}"
Intent: ${intent}

Keep response SHORT (1-2 sentences).`;

    const response = await this.makeRequest({
      model: this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || 'I apologize, but I encountered an issue. Please try again or contact support for assistance.';
  }

  /**
   * Generate a clarification response when intent is ambiguous
   */
  async generateClarificationResponse(
    userMessage: string,
    alternativeIntents: any[],
    entities: Record<string, any>
  ): Promise<string> {
    const systemPrompt = `You are a helpful astrology booking assistant. The user's message was unclear, and you need to ask for clarification.

User's message: "${userMessage}"
Possible intents: ${alternativeIntents.map(i => i.name).join(', ')}
Extracted entities: ${JSON.stringify(entities)}

Please ask a clarifying question to help the user get the assistance they need.`;

    const response = await this.makeRequest({
      model: this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || 'I want to make sure I understand you correctly. Could you please clarify what you need help with?';
  }

  /**
   * Generate a contextual response with full conversation context
   */
  async generateContextualResponse(
    userMessage: string,
    intent: string,
    entities: Record<string, any>,
    apiData: any,
    conversationHistory: any[]
  ): Promise<string> {
    const systemPrompt = `You are a helpful astrology booking assistant for SoulPath Wellness. Help users book readings with Jose Garfias.

Intent: ${intent}
Entities: ${JSON.stringify(entities)}
API Data: ${JSON.stringify(apiData)}

IMPORTANT: Keep responses SHORT and CONCISE (1-2 sentences max). Be warm but brief.`;

    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    conversationHistory.slice(-10).forEach(msg => {
      messages.push({
        role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant' | 'system',
        content: msg.message || msg.content
      });
    });

    // Add current message
    messages.push({ role: 'user', content: userMessage });

    const response = await this.makeRequest({
      model: this.defaultModel,
      messages,
      max_tokens: 300,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || 'I\'m here to help you with your astrology reading needs. How can I assist you today?';
  }

  /**
   * Health check for OpenRouter service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest({
        model: this.defaultModel,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello' }
        ],
        max_tokens: 10,
        temperature: 0.1
      });
      return response.choices && response.choices.length > 0;
    } catch (error) {
      console.error('OpenRouter health check failed:', error);
      return false;
    }
  }

  private async makeRequest(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
        'X-Title': 'SoulPath Wellness Platform'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('OpenRouter API key invalid or missing');
      }
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export default OpenRouterService;