#!/usr/bin/env node

/**
 * Script de testing del Orquestador Conversacional
 * Ejecutar con: node scripts/test-orchestrator.js
 */

const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function testOrchestrator() {
  console.log('🧪 Iniciando tests del Orquestador Conversacional...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣  Probando health check...');
    const healthResponse = await axios.get(`${BASE_URL}/orchestrator?action=health`);
    console.log('✅ Health check:', healthResponse.data.data.overall ? 'OK' : 'FAILED');
    console.log('   Servicios:', healthResponse.data.data.services);

    // Test 2: Ejemplos de mensajes
    console.log('\n2️⃣  Obteniendo ejemplos de mensajes...');
    const examplesResponse = await axios.get(`${BASE_URL}/orchestrator/test?type=examples`);
    console.log('✅ Ejemplos obtenidos:', examplesResponse.data.data.testMessages.length, 'mensajes');

    // Test 3: Procesar mensaje de prueba
    console.log('\n3️⃣  Probando procesamiento de mensaje...');
    const testMessage = {
      message: 'Hola, ¿qué paquetes tienen disponibles?',
      userId: 'test_user_123',
      testType: 'full'
    };
    
    const processResponse = await axios.post(`${BASE_URL}/orchestrator/test`, testMessage);
    console.log('✅ Mensaje procesado:', processResponse.data.success ? 'OK' : 'FAILED');
    if (processResponse.data.success) {
      console.log('   Tiempo de procesamiento:', processResponse.data.data.processingTime, 'ms');
    }

    // Test 4: Estadísticas
    console.log('\n4️⃣  Obteniendo estadísticas...');
    const statsResponse = await axios.get(`${BASE_URL}/orchestrator/test?type=stats`);
    console.log('✅ Estadísticas obtenidas:', statsResponse.data.success ? 'OK' : 'FAILED');

    console.log('\n🎉 Todos los tests completados exitosamente!');

  } catch (error) {
    console.error('❌ Error en los tests:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
  testOrchestrator();
}

module.exports = { testOrchestrator };
