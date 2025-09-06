#!/usr/bin/env node

/**
 * Script de migración de base de datos para el Orquestador
 * Ejecutar con: node scripts/migrate-orchestrator.js
 */

const { execSync } = require('child_process');
const path = require('path');

async function migrateDatabase() {
  console.log('🗄️  Ejecutando migración de base de datos...\n');

  try {
    const sqlFile = path.join(__dirname, 'create-conversation-logs-table.sql');
    
    // Verificar que el archivo SQL existe
    const fs = require('fs');
    if (!fs.existsSync(sqlFile)) {
      console.error('❌ No se encontró el archivo SQL de migración');
      process.exit(1);
    }

    // Ejecutar migración usando psql
    console.log('📝 Ejecutando migración...');
    execSync(`psql -d $DATABASE_URL -f ${sqlFile}`, { stdio: 'inherit' });
    
    console.log('✅ Migración completada exitosamente');
    console.log('\n📊 Tabla conversation_logs creada con:');
    console.log('   - Índices optimizados para consultas');
    console.log('   - Vistas para estadísticas');
    console.log('   - Funciones de limpieza automática');
    console.log('   - Funciones de análisis por usuario');

  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    console.log('\n💡 Asegúrate de que:');
    console.log('   1. PostgreSQL esté ejecutándose');
    console.log('   2. La variable DATABASE_URL esté configurada');
    console.log('   3. Tengas permisos para crear tablas');
    process.exit(1);
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateDatabase();
}

module.exports = { migrateDatabase };
