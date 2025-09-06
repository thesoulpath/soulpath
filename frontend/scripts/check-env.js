#!/usr/bin/env node

/**
 * Environment Variables Check Script
 * 
 * This script helps identify issues with environment variables
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('🔍 Checking Environment Variables...\n');

// Check Supabase variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 Supabase Environment Variables:');
console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Present' : '❌ Missing'}`);
console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Present' : '❌ Missing'}`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Present' : '❌ Missing'}`);

if (supabaseServiceKey) {
  console.log(`  Service Key Length: ${supabaseServiceKey.length} characters`);
  if (supabaseServiceKey.length < 50) {
    console.log('  ⚠️  WARNING: Service role key appears to be truncated!');
    console.log('  💡 A complete Supabase service role key should be 100+ characters long.');
  }
  
  if (!supabaseServiceKey.startsWith('sb_secret_')) {
    console.log('  ⚠️  WARNING: Service role key should start with "sb_secret_"');
  }
}

console.log('\n🔧 To fix the service role key:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to Settings → API');
console.log('3. Copy the complete "service_role" key (not the anon key)');
console.log('4. Update your .env.local file with the complete key');
console.log('5. Restart your development server');

console.log('\n📝 Example .env.local format:');
console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
console.log('SUPABASE_SERVICE_ROLE_KEY=sb_secret_your_complete_service_role_key_here...');
