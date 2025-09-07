import { NextResponse } from 'next/server';
import { LoggingService } from '@/lib/services/logging-service';

export async function POST() {
  try {
    const loggingService = new LoggingService({
      enabled: true,
      storage: 'database',
      level: 'info'
    });

    const logId = await loggingService.logConversation({
      sessionId: `test_${Date.now()}`,
      userId: 'test_user',
      message: 'Test message from logging test endpoint',
      userMessage: 'Test message from logging test endpoint',
      botResponse: 'Test response from logging test endpoint',
      rasaIntent: 'test',
      rasaConfidence: 0.9,
      rasaEntities: [],
      responseGenerator: 'test',
      bookingStep: null,
      bookingDataSnapshot: null,
      modelVersion: '1.0.0',
      intent: 'test',
      entities: [],
      action: 'test',
      rasaResponse: 'Test response',
      llmResponse: 'Test response',
      apiCalls: [],
      processingTime: 100,
      success: true,
        error: undefined
    });

    return NextResponse.json({
      success: true,
      logId,
      message: 'Test log created successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
