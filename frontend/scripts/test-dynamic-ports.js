#!/usr/bin/env node

/**
 * Test script for dynamic port detection
 * Tests both Next.js and Rasa server port detection
 */

const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

async function testPortDetection() {
  console.log('🔍 Testing Dynamic Port Detection...\n');

  // Test 1: Check if Next.js server is running
  console.log('1. Testing Next.js server detection:');
  try {
    const { stdout: nextjsPort } = await execAsync('lsof -ti:3000,3001,3002,3003,3004,3005 | head -1');
    if (nextjsPort.trim()) {
      console.log(`   ✅ Found Next.js server on port: ${nextjsPort.trim()}`);
    } else {
      console.log('   ⚠️  No Next.js server found on common ports');
    }
  } catch (error) {
    console.log('   ⚠️  No Next.js server found on common ports');
  }

  // Test 2: Check if Rasa server is running
  console.log('\n2. Testing Rasa server detection:');
  try {
    const { stdout: rasaPort } = await execAsync('lsof -ti:5007,5008,5009,5010,5011 | head -1');
    if (rasaPort.trim()) {
      console.log(`   ✅ Found Rasa server on port: ${rasaPort.trim()}`);
    } else {
      console.log('   ⚠️  No Rasa server found on common ports');
    }
  } catch (error) {
    console.log('   ⚠️  No Rasa server found on common ports');
  }

  // Test 3: Test API endpoints with dynamic ports
  console.log('\n3. Testing API endpoints:');
  
  // Test Next.js API
  const nextjsPorts = [3000, 3001, 3002, 3003, 3004, 3005];
  for (const port of nextjsPorts) {
    try {
      const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/api/health`);
      if (stdout.trim() === '200') {
        console.log(`   ✅ Next.js API responding on port ${port}`);
        break;
      }
    } catch (error) {
      // Port not responding, continue
    }
  }

  // Test Rasa API
  const rasaPorts = [5007, 5008, 5009, 5010, 5011];
  for (const port of rasaPorts) {
    try {
      const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:${port}/model/parse -H "Content-Type: application/json" -d '{"text":"test"}'`);
      if (stdout.trim() === '200') {
        console.log(`   ✅ Rasa API responding on port ${port}`);
        break;
      }
    } catch (error) {
      // Port not responding, continue
    }
  }

  // Test 4: Environment variables
  console.log('\n4. Environment variables:');
  console.log(`   PORT: ${process.env.PORT || 'not set (default: 3000)'}`);
  console.log(`   RASA_PORT: ${process.env.RASA_PORT || 'not set (default: 5007)'}`);
  console.log(`   NEXT_PUBLIC_BASE_URL: ${process.env.NEXT_PUBLIC_BASE_URL || 'not set'}`);
  console.log(`   RASA_URL: ${process.env.RASA_URL || 'not set'}`);

  console.log('\n✅ Port detection test completed!');
}

// Run the test
testPortDetection().catch(console.error);
