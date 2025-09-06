#!/usr/bin/env node

/**
 * Script para aplicar migraciones de APIs externas
 * Uso: node scripts/migrate-external-apis.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Iniciando migración de APIs externas...\n');

// Paso 1: Generar migración
console.log('📝 Generando migración de Prisma...');
try {
  execSync('npx prisma migrate dev --name add_external_api_configs', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Migración generada exitosamente');
} catch (error) {
  console.error('❌ Error generando migración:', error.message);
  process.exit(1);
}

// Paso 2: Generar cliente de Prisma
console.log('\n🔧 Generando cliente de Prisma...');
try {
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Cliente generado exitosamente');
} catch (error) {
  console.error('❌ Error generando cliente:', error.message);
  process.exit(1);
}

// Paso 3: Verificar que los modelos existen
console.log('\n🔍 Verificando modelos...');
const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

const modelsToCheck = [
  'ExternalAPIConfig',
  'APIConfigAudit'
];

let allModelsPresent = true;
modelsToCheck.forEach(model => {
  if (!schemaContent.includes(`model ${model}`)) {
    console.error(`❌ Modelo ${model} no encontrado en el esquema`);
    allModelsPresent = false;
  } else {
    console.log(`✅ Modelo ${model} encontrado`);
  }
});

if (!allModelsPresent) {
  console.error('\n❌ Faltan modelos en el esquema. Revisa prisma/schema.prisma');
  process.exit(1);
}

// Paso 4: Crear índices recomendados
console.log('\n📊 Verificando índices...');
const indexesToCheck = [
  'idx_external_api_configs_name',
  'idx_external_api_configs_category',
  'idx_external_api_configs_active',
  'idx_api_config_audit_config_id',
  'idx_api_config_audit_performed_by',
  'idx_api_config_audit_created_at'
];

let allIndexesPresent = true;
indexesToCheck.forEach(index => {
  if (!schemaContent.includes(`map: "${index}"`)) {
    console.warn(`⚠️  Índice ${index} no encontrado`);
    allIndexesPresent = false;
  } else {
    console.log(`✅ Índice ${index} encontrado`);
  }
});

if (!allIndexesPresent) {
  console.log('\n⚠️  Algunos índices pueden no estar optimizados.');
  console.log('   Se recomienda revisar los índices en el esquema.');
}

// Paso 5: Poblar datos de ejemplo (opcional)
console.log('\n🌱 ¿Quieres poblar datos de ejemplo?');
console.log('   Ejecuta: node scripts/seed-external-apis.js seed');
console.log('   Para listar existentes: node scripts/seed-external-apis.js list');
console.log('   Para resetear: node scripts/seed-external-apis.js reset');

console.log('\n🎉 Migración completada exitosamente!');
console.log('\n📋 Próximos pasos:');
console.log('   1. Reinicia tu servidor de desarrollo');
console.log('   2. Ve al Admin Dashboard → External APIs');
console.log('   3. Configura tus APIs reales');
console.log('   4. Prueba las integraciones');
console.log('\n🚀 ¡Tu backend de configuración de APIs externas está listo!');

