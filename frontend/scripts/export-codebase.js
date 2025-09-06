#!/usr/bin/env node

/**
 * Codebase Export Script
 * 
 * This script exports the entire codebase as text, excluding unnecessary files
 */

import fs from 'fs';
import path from 'path';

// Directories and files to exclude
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  '.vercel'
];

const EXCLUDE_FILES = [
  '.DS_Store',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.env',
  '.env.local',
  '.env.production',
  '.env.backup',
  '.env.local.backup',
  'tsconfig.tsbuildinfo',
  '*.log',
  '*.tmp',
  '*.cache'
];

const EXCLUDE_EXTENSIONS = [
  '.log',
  '.tmp',
  '.cache',
  '.lock',
  '.map'
];

// File extensions to include
const INCLUDE_EXTENSIONS = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.md',
  '.css',
  '.scss',
  '.html',
  '.sql',
  '.prisma',
  '.yml',
  '.yaml',
  '.txt',
  '.sh',
  '.bat',
  '.ps1'
];

function shouldExcludeFile(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);
  
  // Check if file should be excluded
  if (EXCLUDE_FILES.includes(fileName)) {
    return true;
  }
  
  // Check if extension should be excluded
  if (EXCLUDE_EXTENSIONS.includes(ext)) {
    return true;
  }
  
  // Check if it's an environment file
  if (fileName.startsWith('.env')) {
    return true;
  }
  
  return false;
}

function shouldExcludeDir(dirName) {
  return EXCLUDE_DIRS.includes(dirName);
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
        if (!shouldExcludeDir(item)) {
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

function generateExport() {
  const projectRoot = process.cwd();
  const outputFile = path.join(projectRoot, 'CODEBASE_EXPORT.txt');
  
  console.log('🚀 Starting codebase export...');
  console.log(`📂 Project root: ${projectRoot}`);
  
  // Get project info
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  
  let exportContent = '';
  
  // Header
  exportContent += '='.repeat(80) + '\n';
  exportContent += '                    CODEBASE EXPORT\n';
  exportContent += '='.repeat(80) + '\n\n';
  
  exportContent += `📦 Project: ${packageJson.name}\n`;
  exportContent += `📝 Description: ${packageJson.description || 'No description'}\n`;
  exportContent += `🏷️  Version: ${packageJson.version}\n`;
  exportContent += `📅 Export Date: ${new Date().toISOString()}\n`;
  exportContent += `🔧 Node Version: ${process.version}\n`;
  exportContent += `💻 Platform: ${process.platform}\n\n`;
  
  exportContent += '📋 Table of Contents:\n';
  exportContent += '-'.repeat(50) + '\n';
  
  // Generate TOC first
  const toc = generateTableOfContents(projectRoot);
  exportContent += toc;
  
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
  
  console.log(`✅ Export completed successfully!`);
  console.log(`📄 Output file: ${outputFile}`);
  console.log(`📊 File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
  
  return outputFile;
}

function generateTableOfContents(projectRoot, basePath = '') {
  let toc = '';
  
  try {
    const items = fs.readdirSync(projectRoot);
    
    const dirs = [];
    const files = [];
    
    for (const item of items) {
      const fullPath = path.join(projectRoot, item);
      const relativePath = path.join(basePath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!shouldExcludeDir(item)) {
          dirs.push({ name: item, path: fullPath, relativePath });
        }
      } else if (stat.isFile()) {
        if (!shouldExcludeFile(fullPath) && shouldIncludeFile(fullPath)) {
          files.push({ name: item, path: fullPath, relativePath });
        }
      }
    }
    
    // Add directories to TOC
    for (const dir of dirs.sort((a, b) => a.name.localeCompare(b.name))) {
      toc += `📁 ${dir.relativePath}/\n`;
      toc += generateTableOfContents(dir.path, dir.relativePath);
    }
    
    // Add files to TOC
    for (const file of files.sort((a, b) => a.name.localeCompare(b.name))) {
      toc += `  📄 ${file.relativePath}\n`;
    }
    
  } catch (error) {
    toc += `[ERROR: Could not read directory ${projectRoot}]\n`;
  }
  
  return toc;
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
          if (!shouldExcludeDir(item)) {
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
    const outputFile = generateExport();
    console.log(`\n🎉 Codebase exported to: ${outputFile}`);
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

module.exports = { generateExport };
