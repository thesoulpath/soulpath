#!/usr/bin/env node

/**
 * Script to help set up Vercel environment variables
 */

console.log('🔧 Vercel Environment Variables Setup\n');

console.log('📋 Required Environment Variables:');
console.log('1. DATABASE_URL - Your database connection string');
console.log('2. JWT_SECRET - Secret key for JWT tokens');
console.log('3. NEXT_PUBLIC_APP_URL - Your app\'s public URL\n');

console.log('🌐 NEXT_PUBLIC_APP_URL Setup:');
console.log('Your app URL is: https://soulpath.lat');
console.log('Set this as NEXT_PUBLIC_APP_URL in Vercel\n');

console.log('🔑 JWT_SECRET Setup:');
console.log('Generate a random JWT secret:');
console.log('You can use: openssl rand -base64 32');
console.log('Or any random string (at least 32 characters)\n');

console.log('📊 DATABASE_URL Setup:');
console.log('This should be your database connection string with connection pooling');
console.log('For Supabase: postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1');
console.log('For other providers: Check the fix-vercel-database.js script\n');

console.log('🚀 VERCEL DASHBOARD STEPS:');
console.log('1. Go to https://vercel.com/dashboard');
console.log('2. Select your project (soulpath)');
console.log('3. Go to Settings > Environment Variables');
console.log('4. Add these variables:');
console.log('   - DATABASE_URL: [your database connection string]');
console.log('   - JWT_SECRET: [your JWT secret]');
console.log('   - NEXT_PUBLIC_APP_URL: https://soulpath.lat');
console.log('5. Make sure all are set for "Production" environment');
console.log('6. Redeploy your application\n');

console.log('🧪 TEST AFTER SETUP:');
console.log('1. Wait for deployment to complete');
console.log('2. Visit: https://soulpath.lat');
console.log('3. Go to the booking section');
console.log('4. Check if packages load correctly\n');

console.log('📞 TROUBLESHOOTING:');
console.log('If packages still don\'t load:');
console.log('1. Check Vercel function logs');
console.log('2. Verify DATABASE_URL has connection pooling');
console.log('3. Test database connection from Vercel');
console.log('4. Check for any error messages in browser console\n');
