#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing Prisma Schema - Replacing NoAction with Restrict...\n');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

try {
  // Read the schema file
  let schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Count occurrences
  const noActionCount = (schema.match(/NoAction/g) || []).length;
  console.log(`📊 Found ${noActionCount} instances of "NoAction"`);
  
  // Replace all NoAction with Restrict
  const updatedSchema = schema.replace(/NoAction/g, 'Restrict');
  
  // Write back to file
  fs.writeFileSync(schemaPath, updatedSchema, 'utf8');
  
  console.log(`✅ Successfully replaced ${noActionCount} instances of "NoAction" with "Restrict"`);
  console.log('📝 Schema updated successfully!\n');
  
  console.log('🚀 Next steps:');
  console.log('1. Run: npx prisma generate');
  console.log('2. Test the schema validation');
  console.log('3. Deploy to Vercel\n');
  
} catch (error) {
  console.error('❌ Error updating schema:', error.message);
  process.exit(1);
}
