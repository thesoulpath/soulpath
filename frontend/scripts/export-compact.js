#!/usr/bin/env node

/**
 * Compact Codebase Export Script
 * 
 * This script exports the essential codebase files as text, excluding unnecessary files
 */

import fs from 'fs';
import path from 'path';

// Only include essential directories
const INCLUDE_DIRS = [
  'app',
  'components',
  'lib',
  'hooks',
  'types',
  'prisma',
  'supabase',
  'utils'
];

// Only include essential file types
const INCLUDE_EXTENSIONS = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.md',
  '.css',
  '.sql',
  '.prisma'
];

// Files to exclude
const EXCLUDE_FILES = [
  '.DS_Store',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'tsconfig.tsbuildinfo',
  '*.log',
  '*.tmp',
  '*.cache',
  '*.backup',
  '*.disabled'
];

// Directories to exclude
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  '.vercel',
  'scripts'
];

function shouldExcludeFile(filePath) {
  const fileName = path.basename(filePath);
  
  // Check if file should be excluded
  if (EXCLUDE_FILES.includes(fileName)) {
    return true;
  }
  
  // Check if it's a backup or disabled file
  if (fileName.includes('.backup') || fileName.includes('.disabled')) {
    return true;
  }
  
  return false;
}

function shouldExcludeDir(dirName) {
  return EXCLUDE_DIRS.includes(dirName);
}

function shouldIncludeDir(dirName) {
  return INCLUDE_DIRS.includes(dirName);
}

function shouldIncludeFile(filePath) {
  const ext = path.extname(filePath);
  return INCLUDE_EXTENSIONS.includes(ext);
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return `[ERROR: Could not read file - ${error.message}]`;
  }
}

function walkDirectory(dirPath, basePath = '') {
  let output = '';
  
  try {
    const items = fs.readdirSync(dirPath);
    
    // Sort items: directories first, then files
    const dirs = [];
    const files = [];
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativePath = path.join(basePath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!shouldExcludeDir(item) && shouldIncludeDir(item)) {
          dirs.push({ name: item, path: fullPath, relativePath });
        }
      } else if (stat.isFile()) {
        if (!shouldExcludeFile(fullPath) && shouldIncludeFile(fullPath)) {
          files.push({ name: item, path: fullPath, relativePath });
        }
      }
    }
    
    // Process directories
    for (const dir of dirs.sort((a, b) => a.name.localeCompare(b.name))) {
      output += `\n📁 ${dir.relativePath}/\n`;
      output += '='.repeat(50) + '\n';
      output += walkDirectory(dir.path, dir.relativePath);
    }
    
    // Process files
    for (const file of files.sort((a, b) => a.name.localeCompare(b.name))) {
      output += `\n📄 ${file.relativePath}\n`;
      output += '-'.repeat(50) + '\n';
      output += readFileContent(file.path);
      output += '\n\n';
    }
    
  } catch (error) {
    output += `[ERROR: Could not read directory ${dirPath} - ${error.message}]\n`;
  }
  
  return output;
}

function generateCompactExport() {
  const projectRoot = process.cwd();
  const outputFile = path.join(projectRoot, 'CODEBASE_COMPACT.txt');
  
  console.log('🚀 Starting compact codebase export...');
  console.log(`📂 Project root: ${projectRoot}`);
  
  // Get project info
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  
  let exportContent = '';
  
  // Header
  exportContent += '='.repeat(80) + '\n';
  exportContent += '                COMPACT CODEBASE EXPORT\n';
  exportContent += '='.repeat(80) + '\n\n';
  
  exportContent += `📦 Project: ${packageJson.name}\n`;
  exportContent += `📝 Description: ${packageJson.description || 'No description'}\n`;
  exportContent += `🏷️  Version: ${packageJson.version}\n`;
  exportContent += `📅 Export Date: ${new Date().toISOString()}\n`;
  exportContent += `🔧 Node Version: ${process.version}\n`;
  exportContent += `💻 Platform: ${process.platform}\n\n`;
  
  exportContent += '📋 Included Directories:\n';
  exportContent += '-'.repeat(50) + '\n';
  INCLUDE_DIRS.forEach(dir => {
    exportContent += `📁 ${dir}/\n`;
  });
  
  exportContent += '\n📋 Included File Types:\n';
  exportContent += '-'.repeat(50) + '\n';
  INCLUDE_EXTENSIONS.forEach(ext => {
    exportContent += `📄 *${ext}\n`;
  });
  
  exportContent += '\n' + '='.repeat(80) + '\n';
  exportContent += '                    FILES CONTENT\n';
  exportContent += '='.repeat(80) + '\n\n';
  
  // Export all files
  exportContent += walkDirectory(projectRoot);
  
  // Footer
  exportContent += '\n' + '='.repeat(80) + '\n';
  exportContent += '                    EXPORT COMPLETE\n';
  exportContent += '='.repeat(80) + '\n';
  exportContent += `📊 Total files exported: ${countFiles(projectRoot)}\n`;
  exportContent += `📅 Export completed: ${new Date().toISOString()}\n`;
  
  // Write to file
  fs.writeFileSync(outputFile, exportContent, 'utf8');
  
  console.log(`✅ Compact export completed successfully!`);
  console.log(`📄 Output file: ${outputFile}`);
  console.log(`📊 File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
  
  return outputFile;
}

function countFiles(projectRoot) {
  let count = 0;
  
  function countInDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!shouldExcludeDir(item) && shouldIncludeDir(item)) {
            countInDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          if (!shouldExcludeFile(fullPath) && shouldIncludeFile(fullPath)) {
            count++;
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  countInDirectory(projectRoot);
  return count;
}

// Run the export
if (require.main === module) {
  try {
    const outputFile = generateCompactExport();
    console.log(`\n🎉 Compact codebase exported to: ${outputFile}`);
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

module.exports = { generateCompactExport };
