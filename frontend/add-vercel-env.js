#!/usr/bin/env node

/**
 * Vercel Environment Variables Setup Script (Node.js version)
 * This script adds RASA_URL and OPENROUTER_API_KEY to Vercel
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Environment variables to add
const ENV_VARS = {
  RASA_URL: 'https://codebase-x.onrender.com',
  OPENROUTER_API_KEY: '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'
};

function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ Error: ${description} failed`);
    console.error(error.message);
    throw error;
  }
}

function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkVercelAuth() {
  try {
    execSync('vercel whoami', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

async function addEnvironmentVariable(key, value, environment) {
  const command = `echo "${value}" | vercel env add ${key} ${environment}`;
  return runCommand(command, `Adding ${key} to ${environment}`);
}

async function main() {
  console.log('🚀 Vercel Environment Variables Setup');
  console.log('=====================================');
  console.log('');

  // Check if Vercel CLI is installed
  if (!checkVercelCLI()) {
    console.log('❌ Vercel CLI not found. Installing...');
    try {
      runCommand('npm install -g vercel', 'Installing Vercel CLI');
    } catch (error) {
      console.error('❌ Failed to install Vercel CLI. Please install manually:');
      console.error('   npm install -g vercel');
      process.exit(1);
    }
  }

  // Check if user is logged in
  if (!checkVercelAuth()) {
    console.log('❌ Not logged in to Vercel. Please login first:');
    console.log('   vercel login');
    process.exit(1);
  }

  console.log('✅ Vercel CLI ready');
  console.log('');

  // Add environment variables
  const environments = ['production', 'preview', 'development'];
  
  for (const [key, value] of Object.entries(ENV_VARS)) {
    console.log(`📋 Adding ${key}:`);
    console.log(`   Value: ${value}`);
    console.log('');

    for (const env of environments) {
      try {
        await addEnvironmentVariable(key, value, env);
      } catch (error) {
        console.error(`❌ Failed to add ${key} to ${env}`);
        // Continue with other environments
      }
    }
    console.log('');
  }

  // Show current environment variables
  console.log('📊 Current Environment Variables:');
  console.log('=================================');
  try {
    const output = runCommand('vercel env ls', 'Listing environment variables');
    console.log(output);
  } catch (error) {
    console.log('Could not list environment variables');
  }

  console.log('');
  console.log('🎉 Success! Environment variables added to Vercel');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Add other required variables manually in Vercel dashboard:');
  console.log('   - DATABASE_URL (from Supabase/PlanetScale)');
  console.log('   - REDIS_URL (from Upstash/Redis Cloud)');
  console.log('   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)');
  console.log('   - NEXTAUTH_URL (your Vercel domain)');
  console.log('');
  console.log('2. Redeploy your application:');
  console.log('   vercel --prod');
  console.log('');
  console.log('3. Or trigger redeploy from Vercel dashboard');
  console.log('');
  console.log('✅ Ready to deploy!');

  rl.close();
}

main().catch(console.error);