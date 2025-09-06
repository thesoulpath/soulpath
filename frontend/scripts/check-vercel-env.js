#!/usr/bin/env node

/**
 * Script to check Vercel environment variables and database connection
 * Run this to debug Vercel deployment issues
 */

import { PrismaClient } from '@prisma/client';

async function checkEnvironment() {
  console.log('🔍 Checking environment variables...\n');
  
  // Check required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  const missingVars = [];
  const presentVars = [];
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      presentVars.push(varName);
      console.log(`✅ ${varName}: ${varName === 'DATABASE_URL' ? 'Set (hidden)' : 'Set'}`);
    } else {
      missingVars.push(varName);
      console.log(`❌ ${varName}: Missing`);
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Present: ${presentVars.length}/${requiredVars.length}`);
  console.log(`❌ Missing: ${missingVars.length}/${requiredVars.length}`);
  
  if (missingVars.length > 0) {
    console.log(`\n🚨 Missing environment variables:`);
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log(`\n💡 To fix this, add these variables in your Vercel dashboard:`);
    console.log(`   1. Go to your project in Vercel dashboard`);
    console.log(`   2. Go to Settings > Environment Variables`);
    console.log(`   3. Add the missing variables`);
    console.log(`   4. Redeploy your application`);
    return false;
  }
  
  // Test database connection
  console.log(`\n🔗 Testing database connection...`);
  
  try {
    const prisma = new PrismaClient({
      log: ['error'],
      errorFormat: 'minimal',
    });
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test package query
    const packageCount = await prisma.packageDefinition.count();
    console.log(`✅ Found ${packageCount} packages in database`);
    
    // Test active packages
    const activePackageCount = await prisma.packageDefinition.count({
      where: { isActive: true }
    });
    console.log(`✅ Found ${activePackageCount} active packages`);
    
    await prisma.$disconnect();
    console.log('✅ Database test completed successfully');
    
    return true;
    
  } catch (error) {
    console.log('❌ Database connection failed:');
    console.log(`   Error: ${error.message}`);
    
    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      console.log(`\n💡 Database connection issues:`);
      console.log(`   1. Check if your DATABASE_URL is correct`);
      console.log(`   2. Ensure your database is accessible from Vercel`);
      console.log(`   3. Check if you're using a connection pooler (recommended for Vercel)`);
      console.log(`   4. Verify your database credentials`);
    }
    
    return false;
  }
}

// Run the check
checkEnvironment()
  .then(success => {
    if (success) {
      console.log(`\n🎉 Environment check passed! Your Vercel deployment should work.`);
      process.exit(0);
    } else {
      console.log(`\n🚨 Environment check failed! Please fix the issues above.`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
