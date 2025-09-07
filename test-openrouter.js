// Test script to verify OpenRouter vs Fallback responses
const { OpenRouterService } = require('./frontend/lib/services/openrouter-service.ts');

async function testOpenRouter() {
  console.log('🧪 Testing OpenRouter Service...\n');
  
  // Test with dummy key (should fail)
  console.log('1. Testing with dummy API key:');
  try {
    const service1 = new OpenRouterService('sk-or-v1-1234567890abcdef');
    const response1 = await service1.generateContextualResponse(
      'I want to book a session',
      'book_session',
      {},
      null,
      []
    );
    console.log('✅ OpenRouter Response:', response1);
  } catch (error) {
    console.log('❌ OpenRouter Failed:', error.message);
    console.log('   → Bot will use FALLBACK responses\n');
  }
  
  // Test with real key (if available)
  const realKey = process.env.OPENROUTER_API_KEY;
  if (realKey && realKey !== 'sk-or-v1-1234567890abcdef') {
    console.log('2. Testing with real API key:');
    try {
      const service2 = new OpenRouterService(realKey);
      const response2 = await service2.generateContextualResponse(
        'I want to book a session',
        'book_session',
        {},
        null,
        []
      );
      console.log('✅ OpenRouter Response:', response2);
    } catch (error) {
      console.log('❌ OpenRouter Failed:', error.message);
    }
  } else {
    console.log('2. No real API key found - get one from https://openrouter.ai/settings/keys');
  }
}

testOpenRouter();
