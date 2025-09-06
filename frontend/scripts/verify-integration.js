#!/usr/bin/env node

/**
 * Script de verificación completa de la integración
 * Rasa + ChatBot + Orquestador Conversacional
 *
 * Uso: node scripts/verify-integration.js
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Configuración
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const RASA_URL = process.env.RASA_URL || 'http://localhost:5005';

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(colors.bright + colors.blue, `🔍 ${message}`);
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(colors.green, `✅ ${message}`);
}

function logError(message) {
  log(colors.red, `❌ ${message}`);
}

function logWarning(message) {
  log(colors.yellow, `⚠️  ${message}`);
}

function logInfo(message) {
  log(colors.blue, `ℹ️  ${message}`);
}

// Función para verificar archivos
async function checkFiles() {
  logHeader('VERIFICANDO ARCHIVOS');

  const requiredFiles = [
    'components/ChatWindow.tsx',
    'app/api/chat/web/route.ts',
    'lib/services/conversational-orchestrator.ts',
    'rasa/config.yml',
    'rasa/domain.yml',
    'rasa/data/nlu.yml',
    'Dockerfile.rasa',
    'docker-compose.yml'
  ];

  let allFilesPresent = true;

  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      logSuccess(`${file} - Presente`);
    } else {
      logError(`${file} - FALTANTE`);
      allFilesPresent = false;
    }
  }

  return allFilesPresent;
}

// Función para verificar variables de entorno
async function checkEnvironment() {
  logHeader('VERIFICANDO VARIABLES DE ENTORNO');

  const requiredEnvVars = {
    'RASA_URL': process.env.RASA_URL,
    'OPENROUTER_API_KEY': process.env.OPENROUTER_API_KEY,
    'TWILIO_ACCOUNT_SID': process.env.TWILIO_ACCOUNT_SID,
    'TWILIO_AUTH_TOKEN': process.env.TWILIO_AUTH_TOKEN,
    'API_BASE_URL': process.env.API_BASE_URL
  };

  let allEnvVarsPresent = true;

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (value && value !== '') {
      logSuccess(`${key} - Configurado`);
    } else {
      logWarning(`${key} - NO CONFIGURADO (usando valores por defecto)`);
      if (key === 'RASA_URL') {
        logInfo(`   Usando: http://localhost:5005`);
      }
    }
  }

  // Variables opcionales
  const optionalEnvVars = {
    'OPENROUTER_MODEL': process.env.OPENROUTER_MODEL,
    'LOGGING_ENABLED': process.env.LOGGING_ENABLED,
    'LOGGING_STORAGE': process.env.LOGGING_STORAGE
  };

  for (const [key, value] of Object.entries(optionalEnvVars)) {
    if (value) {
      logInfo(`${key} - ${value}`);
    }
  }

  return allEnvVarsPresent;
}

// Función para verificar servicios
async function checkServices() {
  logHeader('VERIFICANDO SERVICIOS');

  const services = [
    {
      name: 'API Base',
      url: `${BASE_URL.replace('/api', '')}`,
      description: 'Servidor principal de Next.js'
    }
  ];

  // Solo verificar Rasa si no estamos en producción
  if (process.env.NODE_ENV !== 'production') {
    services.push({
      name: 'Rasa Server',
      url: RASA_URL,
      description: 'Servidor de Rasa (ML/NLU)'
    });
  }

  let allServicesRunning = true;

  for (const service of services) {
    try {
      logInfo(`Probando ${service.name}...`);
      const response = await axios.get(service.url, { timeout: 5000 });

      if (response.status === 200) {
        logSuccess(`${service.name} - OK (${service.url})`);
      } else {
        logWarning(`${service.name} - Respuesta inesperada: ${response.status}`);
      }
    } catch (error) {
      if (service.name === 'Rasa Server' && process.env.NODE_ENV !== 'production') {
        logWarning(`${service.name} - No ejecutándose (${service.url})`);
        logInfo(`   Para iniciar: ./scripts/rasa-docker.sh start`);
        allServicesRunning = false;
      } else {
        logError(`${service.name} - Error: ${error.message}`);
        allServicesRunning = false;
      }
    }
  }

  return allServicesRunning;
}

// Función para verificar endpoints de API
async function checkAPIEndpoints() {
  logHeader('VERIFICANDO ENDPOINTS DE API');

  const endpoints = [
    {
      name: 'Chat Web API',
      url: `${BASE_URL}/chat/web`,
      method: 'GET',
      description: 'Endpoint principal del chat web'
    },
    {
      name: 'Orchestrator Health',
      url: `${BASE_URL}/orchestrator?action=health`,
      method: 'GET',
      description: 'Health check del orquestador'
    },
    {
      name: 'WhatsApp Webhook',
      url: `${BASE_URL}/whatsapp/webhook`,
      method: 'GET',
      description: 'Webhook de WhatsApp'
    }
  ];

  let allEndpointsWorking = true;

  for (const endpoint of endpoints) {
    try {
      logInfo(`Probando ${endpoint.name}...`);
      const response = await axios.get(endpoint.url, { timeout: 10000 });

      if (response.status === 200) {
        logSuccess(`${endpoint.name} - OK`);
      } else {
        logWarning(`${endpoint.name} - Respuesta inesperada: ${response.status}`);
      }
    } catch (error) {
      logError(`${endpoint.name} - Error: ${error.message}`);
      allEndpointsWorking = false;
    }
  }

  return allEndpointsWorking;
}

// Función para verificar integración completa
async function checkIntegration() {
  logHeader('VERIFICANDO INTEGRACIÓN COMPLETA');

  try {
    logInfo('Probando flujo completo de chat...');

    // Simular un mensaje de chat
    const testMessage = {
      message: 'Hola, ¿qué paquetes tienen disponibles?',
      userId: `test_integration_${Date.now()}`,
      language: 'es',
      timestamp: new Date().toISOString()
    };

    const response = await axios.post(`${BASE_URL}/chat/web`, testMessage, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data.success) {
      logSuccess('Flujo de chat - OK');
      logInfo(`   Respuesta: ${response.data.data.response.substring(0, 100)}...`);

      // Verificar que incluye información contextual
      if (response.data.data.response.includes('paquetes') ||
          response.data.data.response.includes('disponibles')) {
        logSuccess('Respuesta contextual - OK');
      } else {
        logWarning('Respuesta contextual - Puede necesitar ajuste');
      }

      return true;
    } else {
      logError('Flujo de chat - Falló');
      logInfo(`   Respuesta: ${JSON.stringify(response.data)}`);
      return false;
    }

  } catch (error) {
    logError(`Flujo de chat - Error: ${error.message}`);
    return false;
  }
}

// Función para verificar configuración de Rasa
async function checkRasaConfig() {
  logHeader('VERIFICANDO CONFIGURACIÓN DE RASA');

  try {
    // Verificar archivos de configuración
    const rasaFiles = [
      'rasa/config.yml',
      'rasa/domain.yml',
      'rasa/data/nlu.yml',
      'rasa/data/rules.yml',
      'rasa/credentials.yml'
    ];

    let rasaConfigValid = true;

    for (const file of rasaFiles) {
      if (fs.existsSync(file)) {
        logSuccess(`${file} - OK`);

        // Leer contenido básico
        const content = fs.readFileSync(file, 'utf8');

        if (file.includes('nlu.yml') && content.includes('intent:')) {
          logSuccess('   Intents detectados en NLU');
        }

        if (file.includes('domain.yml') && content.includes('responses:')) {
          logSuccess('   Responses configuradas');
        }

      } else {
        logError(`${file} - FALTANTE`);
        rasaConfigValid = false;
      }
    }

    return rasaConfigValid;

  } catch (error) {
    logError(`Error verificando configuración de Rasa: ${error.message}`);
    return false;
  }
}

// Función para mostrar recomendaciones
function showRecommendations(results) {
  logHeader('RECOMENDACIONES PARA PRODUCCIÓN');

  const recommendations = [];

  if (!results.files) {
    recommendations.push('❌ Faltan archivos importantes - revisa la instalación');
  }

  if (!results.environment) {
    recommendations.push('⚠️  Variables de entorno no configuradas completamente');
  }

  if (!results.services) {
    recommendations.push('🚀 Inicia Rasa: ./scripts/rasa-docker.sh start');
  }

  if (!results.endpoints) {
    recommendations.push('🔧 Revisa configuración de API endpoints');
  }

  if (!results.integration) {
    recommendations.push('🔗 Prueba la integración completa');
  }

  if (!results.rasa) {
    recommendations.push('🤖 Entrena modelo de Rasa: ./scripts/rasa-docker.sh train');
  }

  if (recommendations.length === 0) {
    logSuccess('🎉 ¡TODO ESTÁ LISTO PARA PRODUCCIÓN!');
    console.log('\n' + '='.repeat(60));
    log(colors.bright + colors.green, '🚀 PRÓXIMOS PASOS:');
    console.log('='.repeat(60));
    console.log('1. Desplegar en Render.com: ./scripts/setup-render-deployment.sh');
    console.log('2. Actualizar variables de entorno en Vercel');
    console.log('3. Probar integración en producción');
    console.log('4. Configurar monitoreo y alertas');
    console.log('5. ¡Tu chatbot estará funcionando! 🎉');
  } else {
    console.log('\n' + '='.repeat(60));
    log(colors.bright + colors.yellow, '⚠️  ACCIONES PENDIENTES:');
    console.log('='.repeat(60));

    recommendations.forEach(rec => console.log(rec));
  }
}

// Función principal
async function main() {
  console.log('\n' + '='.repeat(60));
  log(colors.bright + colors.magenta, '🤖 VERIFICACIÓN COMPLETA DEL SISTEMA');
  log(colors.bright + colors.magenta, '    Rasa + ChatBot + Orquestador Conversacional');
  console.log('='.repeat(60));

  const results = {
    files: false,
    environment: false,
    services: false,
    endpoints: false,
    integration: false,
    rasa: false
  };

  try {
    // Verificar archivos
    results.files = await checkFiles();

    // Verificar entorno
    results.environment = await checkEnvironment();

    // Verificar servicios
    results.services = await checkServices();

    // Verificar endpoints
    results.endpoints = await checkAPIEndpoints();

    // Verificar configuración de Rasa
    results.rasa = await checkRasaConfig();

    // Verificar integración completa
    results.integration = await checkIntegration();

    // Mostrar resumen
    logHeader('RESUMEN DE VERIFICACIÓN');

    const totalChecks = Object.keys(results).length;
    const passedChecks = Object.values(results).filter(Boolean).length;

    console.log(`\n📊 Resultados: ${passedChecks}/${totalChecks} verificaciones pasaron`);

    Object.entries(results).forEach(([check, passed]) => {
      const status = passed ? colors.green + '✅' : colors.red + '❌';
      const name = check.charAt(0).toUpperCase() + check.slice(1);
      console.log(`${status} ${name}`);
    });

    // Mostrar recomendaciones
    showRecommendations(results);

  } catch (error) {
    logError(`Error en verificación: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { main };

