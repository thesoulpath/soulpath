import { NextRequest, NextResponse } from 'next/server';
import { OpenRouterService } from '@/lib/services/openrouter-service';

export async function GET(request: NextRequest) {
  try {
    const openRouterService = new OpenRouterService();
    
    // Test with a simple message
    const response = await openRouterService.handleChitchat({
      userMessage: "Hello, test message",
      conversationHistory: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there! How can I help you today?" }
      ],
      brandContext: {
        astrologerName: "Jose Garfias",
        services: ["Astrology Reading", "Spiritual Guidance"],
        specialties: ["Natal Chart Analysis", "Career Guidance", "Relationship Counseling"]
      }
    });

    return NextResponse.json({
      success: true,
      message: "OpenRouter is working",
      response: response,
      apiKey: process.env.OPENROUTER_API_KEY ? "Set" : "Not set"
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      apiKey: process.env.OPENROUTER_API_KEY ? "Set" : "Not set"
    }, { status: 500 });
  }
}
