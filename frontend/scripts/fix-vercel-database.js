#!/usr/bin/env node

/**
 * Script to help fix Vercel database connection issues
 * This will help you get the correct DATABASE_URL for Vercel
 */

console.log('🔧 Vercel Database Connection Fix\n');

console.log('📋 Common Vercel Database Issues:');
console.log('1. Missing connection pooling');
console.log('2. Wrong SSL configuration');
console.log('3. Incorrect connection string format');
console.log('4. Database not accessible from Vercel\n');

console.log('🔍 Database Provider Solutions:\n');

console.log('📊 SUPABASE:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Go to Settings > Database');
console.log('3. Copy the "Connection pooling" URL (NOT the direct connection)');
console.log('4. It should look like: postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1');
console.log('5. Add this as DATABASE_URL in Vercel\n');

console.log('🌍 PLANETSCALE:');
console.log('1. Go to your PlanetScale dashboard');
console.log('2. Click on your database');
console.log('3. Go to "Connect" tab');
console.log('4. Select "Node.js" and copy the connection string');
console.log('5. It should look like: mysql://[user]:[password]@[host]/[database]?sslaccept=strict');
console.log('6. Add this as DATABASE_URL in Vercel\n');

console.log('🚂 RAILWAY:');
console.log('1. Go to your Railway project dashboard');
console.log('2. Click on your PostgreSQL service');
console.log('3. Go to "Connect" tab');
console.log('4. Copy the connection string');
console.log('5. Add this as DATABASE_URL in Vercel\n');

console.log('☁️ NEON:');
console.log('1. Go to your Neon dashboard');
console.log('2. Select your project');
console.log('3. Go to "Connection Details"');
console.log('4. Copy the connection string');
console.log('5. Add this as DATABASE_URL in Vercel\n');

console.log('🔧 VERCEL DASHBOARD STEPS:');
console.log('1. Go to https://vercel.com/dashboard');
console.log('2. Select your project (soulpath)');
console.log('3. Go to Settings > Environment Variables');
console.log('4. Add/update DATABASE_URL with the correct connection string');
console.log('5. Make sure it\'s set for "Production" environment');
console.log('6. Redeploy your application\n');

console.log('🧪 TEST YOUR CONNECTION:');
console.log('After updating the DATABASE_URL, test it by:');
console.log('1. Going to your Vercel dashboard');
console.log('2. Click on "Functions" tab');
console.log('3. Look for /api/packages function logs');
console.log('4. Check for any database connection errors\n');

console.log('📞 NEED HELP?');
console.log('If you\'re still having issues:');
console.log('1. Check Vercel function logs for specific error messages');
console.log('2. Verify your database is accessible from external connections');
console.log('3. Ensure you\'re using connection pooling (required for Vercel)');
console.log('4. Contact your database provider\'s support\n');

console.log('✅ QUICK CHECKLIST:');
console.log('□ DATABASE_URL is set in Vercel');
console.log('□ Using connection pooling (pgbouncer=true for PostgreSQL)');
console.log('□ SSL is properly configured');
console.log('□ Database allows external connections');
console.log('□ Redeployed after adding environment variables');
