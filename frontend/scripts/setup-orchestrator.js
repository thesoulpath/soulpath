#!/usr/bin/env node

/**
 * Script de configuración del Orquestador Conversacional
 * Ejecutar con: node scripts/setup-orchestrator.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Configurando Orquestador Conversacional...\n');

// Verificar que estamos en el directorio correcto
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: No se encontró package.json. Ejecuta este script desde la raíz del proyecto.');
  process.exit(1);
}

// Verificar dependencias
console.log('📦 Verificando dependencias...');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const requiredDeps = ['axios', 'twilio', '@types/twilio'];

const missingDeps = requiredDeps.filter(dep => 
  !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
);

if (missingDeps.length > 0) {
  console.log(`⚠️  Instalando dependencias faltantes: ${missingDeps.join(', ')}`);
  try {
    execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
    console.log('✅ Dependencias instaladas correctamente');
  } catch (error) {
    console.error('❌ Error instalando dependencias:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Todas las dependencias están instaladas');
}

// Crear archivo de configuración de entorno si no existe
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), 'orchestrator.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creando archivo de configuración...');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Archivo .env.local creado desde orchestrator.env.example');
    console.log('⚠️  Recuerda configurar las variables de entorno en .env.local');
  } else {
    console.log('⚠️  No se encontró orchestrator.env.example');
  }
} else {
  console.log('✅ Archivo .env.local ya existe');
}

// Crear directorio de logs si no existe
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Directorio de logs creado');
}

// Verificar estructura de archivos
console.log('\n📁 Verificando estructura de archivos...');
const requiredFiles = [
  'lib/types/conversational-orchestrator.ts',
  'lib/services/rasa-service.ts',
  'lib/services/openrouter-service.ts',
  'lib/services/twilio-service.ts',
  'lib/services/api-service.ts',
  'lib/services/logging-service.ts',
  'lib/services/conversational-orchestrator.ts',
  'app/api/whatsapp/webhook/route.ts',
  'app/api/orchestrator/route.ts',
  'app/api/orchestrator/test/route.ts',
  'scripts/create-conversation-logs-table.sql'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(process.cwd(), file)));

if (missingFiles.length > 0) {
  console.log('❌ Archivos faltantes:');
  missingFiles.forEach(file => console.log(`   - ${file}`));
  console.log('\n⚠️  Algunos archivos del orquestador no se encontraron. Verifica la instalación.');
} else {
  console.log('✅ Todos los archivos del orquestador están presentes');
}

// Crear script de testing
console.log('\n🧪 Creando script de testing...');
const testScript = `#!/usr/bin/env node

/**
 * Script de testing del Orquestador Conversacional
 * Ejecutar con: node scripts/test-orchestrator.js
 */

const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function testOrchestrator() {
  console.log('🧪 Iniciando tests del Orquestador Conversacional...\\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣  Probando health check...');
    const healthResponse = await axios.get(\`\${BASE_URL}/orchestrator?action=health\`);
    console.log('✅ Health check:', healthResponse.data.data.overall ? 'OK' : 'FAILED');
    console.log('   Servicios:', healthResponse.data.data.services);

    // Test 2: Ejemplos de mensajes
    console.log('\\n2️⃣  Obteniendo ejemplos de mensajes...');
    const examplesResponse = await axios.get(\`\${BASE_URL}/orchestrator/test?type=examples\`);
    console.log('✅ Ejemplos obtenidos:', examplesResponse.data.data.testMessages.length, 'mensajes');

    // Test 3: Procesar mensaje de prueba
    console.log('\\n3️⃣  Probando procesamiento de mensaje...');
    const testMessage = {
      message: 'Hola, ¿qué paquetes tienen disponibles?',
      userId: 'test_user_123',
      testType: 'full'
    };
    
    const processResponse = await axios.post(\`\${BASE_URL}/orchestrator/test\`, testMessage);
    console.log('✅ Mensaje procesado:', processResponse.data.success ? 'OK' : 'FAILED');
    if (processResponse.data.success) {
      console.log('   Tiempo de procesamiento:', processResponse.data.data.processingTime, 'ms');
    }

    // Test 4: Estadísticas
    console.log('\\n4️⃣  Obteniendo estadísticas...');
    const statsResponse = await axios.get(\`\${BASE_URL}/orchestrator/test?type=stats\`);
    console.log('✅ Estadísticas obtenidas:', statsResponse.data.success ? 'OK' : 'FAILED');

    console.log('\\n🎉 Todos los tests completados exitosamente!');

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
`;

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'test-orchestrator.js'), testScript);
console.log('✅ Script de testing creado: scripts/test-orchestrator.js');

// Crear script de migración de base de datos
console.log('\n🗄️  Creando script de migración...');
const migrationScript = `#!/usr/bin/env node

/**
 * Script de migración de base de datos para el Orquestador
 * Ejecutar con: node scripts/migrate-orchestrator.js
 */

const { execSync } = require('child_process');
const path = require('path');

async function migrateDatabase() {
  console.log('🗄️  Ejecutando migración de base de datos...\\n');

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
    execSync(\`psql -d \$DATABASE_URL -f \${sqlFile}\`, { stdio: 'inherit' });
    
    console.log('✅ Migración completada exitosamente');
    console.log('\\n📊 Tabla conversation_logs creada con:');
    console.log('   - Índices optimizados para consultas');
    console.log('   - Vistas para estadísticas');
    console.log('   - Funciones de limpieza automática');
    console.log('   - Funciones de análisis por usuario');

  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    console.log('\\n💡 Asegúrate de que:');
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
`;

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'migrate-orchestrator.js'), migrationScript);
console.log('✅ Script de migración creado: scripts/migrate-orchestrator.js');

// Hacer los scripts ejecutables
try {
  execSync('chmod +x scripts/test-orchestrator.js scripts/migrate-orchestrator.js', { stdio: 'inherit' });
  console.log('✅ Scripts marcados como ejecutables');
} catch (error) {
  console.log('⚠️  No se pudieron hacer ejecutables los scripts (esto es normal en Windows)');
}

// Mostrar resumen
console.log('\n🎉 Configuración completada!');
console.log('\n📋 Próximos pasos:');
console.log('1. Configura las variables de entorno en .env.local');
console.log('2. Ejecuta la migración de base de datos: node scripts/migrate-orchestrator.js');
console.log('3. Inicia tu servidor: npm run dev');
console.log('4. Prueba el orquestador: node scripts/test-orchestrator.js');
console.log('\n🔗 Endpoints disponibles:');
console.log('   - POST /api/whatsapp/webhook (webhook de Twilio)');
console.log('   - GET  /api/orchestrator?action=health (health check)');
console.log('   - GET  /api/orchestrator/test?type=examples (ejemplos)');
console.log('   - POST /api/orchestrator/test (probar mensajes)');
console.log('\n📚 Documentación:');
console.log('   - Ver orchestrator.env.example para configuración');
console.log('   - Ver scripts/create-conversation-logs-table.sql para esquema de BD');
console.log('   - Ver lib/types/conversational-orchestrator.ts para tipos TypeScript');
