#!/usr/bin/env node

/**
 * Test the port detection utility functions
 */

const { getBaseUrl, getRasaUrl, findAvailableRasaPort, findAvailableNextJSPort } = require('../lib/utils/port-detection');

async function testPortUtility() {
  console.log('🔍 Testing Port Detection Utility...\n');

  // Test 1: Base URL generation
  console.log('1. Testing getBaseUrl():');
  console.log(`   Default: ${getBaseUrl()}`);
  
  // Test with different PORT environment variable
  process.env.PORT = '3001';
  console.log(`   With PORT=3001: ${getBaseUrl()}`);
  
  // Reset
  delete process.env.PORT;
  process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com';
  console.log(`   With NEXT_PUBLIC_BASE_URL: ${getBaseUrl()}`);
  
  // Reset
  delete process.env.NEXT_PUBLIC_BASE_URL;

  // Test 2: Rasa URL generation
  console.log('\n2. Testing getRasaUrl():');
  console.log(`   Default: ${getRasaUrl()}`);
  
  // Test with different RASA_PORT environment variable
  process.env.RASA_PORT = '5008';
  console.log(`   With RASA_PORT=5008: ${getRasaUrl()}`);
  
  // Reset
  delete process.env.RASA_PORT;
  process.env.RASA_URL = 'https://rasa.example.com';
  console.log(`   With RASA_URL: ${getRasaUrl()}`);
  
  // Reset
  delete process.env.RASA_URL;

  // Test 3: Dynamic port detection
  console.log('\n3. Testing findAvailableRasaPort():');
  try {
    const rasaUrl = await findAvailableRasaPort();
    console.log(`   Found Rasa server at: ${rasaUrl}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n4. Testing findAvailableNextJSPort():');
  try {
    const nextjsUrl = await findAvailableNextJSPort();
    console.log(`   Found Next.js server at: ${nextjsUrl}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n✅ Port utility test completed!');
}

// Run the test
testPortUtility().catch(console.error);
