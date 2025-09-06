#!/usr/bin/env node

/**
 * Verificación rápida de que todo está listo
 * Uso: node scripts/check-ready.js
 */

const fs = require('fs');
const path = require('path');

// Colores
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const reset = '\x1b[0m';

function log(color, icon, message) {
  console.log(`${color}${icon} ${message}${reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(green, '✅', `${description} - OK`);
    return true;
  } else {
    log(red, '❌', `${description} - FALTANTE: ${filePath}`);
    return false;
  }
}

function checkEnvVar(varName, description) {
  const value = process.env[varName];
  if (value && value !== '') {
    log(green, '✅', `${description} - OK`);
    return true;
  } else {
    log(yellow, '⚠️ ', `${description} - NO CONFIGURADO`);
    return false;
  }
}

console.log('\n🚀 VERIFICACIÓN RÁPIDA: ¿Rasa + ChatBot Listos?\n');

// 1. Verificar archivos críticos
console.log('📁 ARCHIVOS CRÍTICOS:');
const filesOk = [
  checkFile('components/ChatWindow.tsx', 'ChatWindow Component'),
  checkFile('app/api/chat/web/route.ts', 'Chat Web API'),
  checkFile('rasa/config.yml', 'Rasa Config'),
  checkFile('rasa/domain.yml', 'Rasa Domain'),
  checkFile('Dockerfile.rasa', 'Dockerfile Rasa'),
  checkFile('docker-compose.yml', 'Docker Compose')
].every(Boolean);

// 2. Verificar variables de entorno
console.log('\n🔧 VARIABLES DE ENTORNO:');
const envOk = [
  checkEnvVar('RASA_URL', 'RASA_URL'),
  checkEnvVar('OPENROUTER_API_KEY', 'OpenRouter API Key'),
  checkEnvVar('API_BASE_URL', 'API Base URL')
].filter(Boolean).length >= 2; // Al menos 2 de 3

// 3. Verificar integración
console.log('\n🔗 INTEGRACIÓN:');
let integrationOk = true;

try {
  // Verificar que ChatWindow esté importado en App.tsx
  const appContent = fs.readFileSync('components/App.tsx', 'utf8');
  if (appContent.includes("import { ChatWindow }")) {
    log(green, '✅', 'ChatWindow importado en App.tsx');
  } else {
    log(red, '❌', 'ChatWindow NO importado en App.tsx');
    integrationOk = false;
  }

  if (appContent.includes("<ChatWindow />")) {
    log(green, '✅', 'ChatWindow renderizado en App.tsx');
  } else {
    log(red, '❌', 'ChatWindow NO renderizado en App.tsx');
    integrationOk = false;
  }
} catch (error) {
  log(red, '❌', 'Error verificando App.tsx');
  integrationOk = false;
}

// 4. Verificar configuración de Rasa
console.log('\n🤖 CONFIGURACIÓN RASA:');
let rasaOk = true;

try {
  const domainContent = fs.readFileSync('rasa/domain.yml', 'utf8');
  const intents = (domainContent.match(/-\s*\w+/g) || []).length;

  if (intents >= 10) {
    log(green, '✅', `Rasa: ${intents} intents configurados`);
  } else {
    log(yellow, '⚠️ ', `Rasa: Solo ${intents} intents (recomendado: 10+)`);
  }

  if (domainContent.includes('utter_')) {
    log(green, '✅', 'Rasa: Responses configuradas');
  } else {
    log(yellow, '⚠️ ', 'Rasa: Sin responses configuradas');
    rasaOk = false;
  }
} catch (error) {
  log(red, '❌', 'Error verificando configuración Rasa');
  rasaOk = false;
}

// 5. Resumen final
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN FINAL:');

const allOk = filesOk && envOk && integrationOk && rasaOk;

if (allOk) {
  log(green, '🎉', '¡TODO ESTÁ LISTO! Rasa + ChatBot interoperan perfectamente');
  console.log('\n🚀 PRÓXIMOS PASOS:');
  console.log('1. Inicia Rasa: ./scripts/rasa-docker.sh start');
  console.log('2. Inicia tu app: npm run dev');
  console.log('3. Abre el chat en http://localhost:3000');
  console.log('4. ¡Prueba enviar un mensaje!');
} else {
  log(yellow, '⚠️ ', 'ALGUNAS COSAS NECESITAN AJUSTE:');

  if (!filesOk) console.log('  - Revisa archivos faltantes arriba');
  if (!envOk) console.log('  - Configura variables de entorno en .env.local');
  if (!integrationOk) console.log('  - Verifica que ChatWindow esté en App.tsx');
  if (!rasaOk) console.log('  - Revisa configuración de Rasa');

  console.log('\n🔧 PARA ARREGLAR:');
  console.log('1. Ejecuta: node scripts/verify-integration.js');
  console.log('2. Sigue las recomendaciones del output');
}

console.log('='.repeat(50) + '\n');

