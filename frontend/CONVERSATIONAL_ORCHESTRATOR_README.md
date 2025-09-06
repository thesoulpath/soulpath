# Orquestador Conversacional - Rasa + LLM + WhatsApp

Un sistema completo de orquestación conversacional que integra Rasa (motor de diálogo), OpenRouter (LLM), Twilio (WhatsApp) y APIs internas para crear un asistente inteligente.

## 🏗️ Arquitectura del Sistema

```
WhatsApp (Usuario) 
    ↓
Twilio Webhook
    ↓
Orquestador Conversacional
    ├── Rasa Service (Intención + Entidades)
    ├── API Service (Datos internos)
    ├── OpenRouter Service (LLM)
    └── Logging Service (Registro)
    ↓
Respuesta Enriquecida
    ↓
WhatsApp (Usuario)
```

## 🚀 Características Principales

- **Motor de Diálogo Estructurado**: Rasa para detectar intenciones y extraer entidades
- **Generación de Lenguaje Natural**: OpenRouter con modelos LLM avanzados
- **Integración WhatsApp**: Twilio para comunicación vía WhatsApp
- **APIs Internas**: Integración completa con el sistema existente
- **Logging Estructurado**: Registro detallado de todas las interacciones
- **Contexto de Conversación**: Mantiene el contexto entre mensajes
- **Manejo de Errores**: Respuestas inteligentes ante fallos
- **Escalabilidad**: Diseñado para manejar múltiples usuarios simultáneos

## 📁 Estructura de Archivos

```
lib/
├── types/
│   └── conversational-orchestrator.ts    # Tipos TypeScript
├── services/
│   ├── rasa-service.ts                   # Integración con Rasa
│   ├── openrouter-service.ts             # Integración con OpenRouter
│   ├── twilio-service.ts                 # Integración con Twilio
│   ├── api-service.ts                    # Integración con APIs internas
│   ├── logging-service.ts                # Sistema de logging
│   └── conversational-orchestrator.ts    # Orquestador principal
app/api/
├── whatsapp/
│   └── webhook/route.ts                  # Webhook de Twilio
└── orchestrator/
    ├── route.ts                          # API de administración
    └── test/route.ts                     # API de testing
scripts/
├── setup-orchestrator.js                 # Script de configuración
├── test-orchestrator.js                  # Script de testing
├── migrate-orchestrator.js               # Script de migración
└── create-conversation-logs-table.sql    # Esquema de base de datos
```

## ⚙️ Configuración

### 1. Instalación de Dependencias

```bash
npm install axios twilio @types/twilio
```

### 2. Configuración de Variables de Entorno

Copia `orchestrator.env.example` a `.env.local` y configura:

```bash
# Rasa
RASA_URL=http://localhost:5005
RASA_CONFIDENCE_THRESHOLD=0.7

# OpenRouter
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Logging
LOGGING_ENABLED=true
LOGGING_STORAGE=database
```

### 3. Configuración de Base de Datos

```bash
# Ejecutar migración
node scripts/migrate-orchestrator.js
```

### 4. Configuración de Rasa con Docker

#### Opción A: Instalación Automática (Recomendada)

```bash
# Hacer ejecutable el script
chmod +x scripts/rasa-docker.sh

# Entrenar el modelo
./scripts/rasa-docker.sh train

# Iniciar Rasa
./scripts/rasa-docker.sh start

# Verificar estado
./scripts/rasa-docker.sh status
```

#### Opción B: Instalación Manual

```bash
# Verificar que Docker esté instalado
docker --version
docker-compose --version

# Iniciar servicios
docker-compose up -d

# Verificar que Rasa esté ejecutándose
curl http://localhost:5005/
```

### 5. Verificación de Instalación

```bash
# Probar endpoint de Rasa
curl -X POST http://localhost:5005/webhooks/rest/webhook \
  -H "Content-Type: application/json" \
  -d '{"sender": "test", "message": "hola"}'

# Deberías recibir una respuesta de Rasa
```

## 🔧 Uso del Sistema

### Endpoints Principales

#### Webhook de WhatsApp
```
POST /api/whatsapp/webhook
```
Recibe mensajes de WhatsApp desde Twilio.

#### API de Administración
```
GET /api/orchestrator?action=health     # Health check
GET /api/orchestrator?action=stats      # Estadísticas
GET /api/orchestrator?action=logs       # Logs de conversación
POST /api/orchestrator                  # Acciones administrativas
```

#### API de Testing
```
GET /api/orchestrator/test?type=examples    # Ejemplos de mensajes
POST /api/orchestrator/test                 # Probar mensajes
```

### Ejemplo de Uso

```typescript
import { ConversationalOrchestrator } from '@/lib/services/conversational-orchestrator';

const orchestrator = new ConversationalOrchestrator(config, intentMapping);

// Procesar mensaje de WhatsApp
const result = await orchestrator.processWhatsAppMessage(webhookBody);

if (result.success) {
  console.log('Respuesta:', result.data.response);
} else {
  console.error('Error:', result.error);
}
```

## 🎯 Intenciones Soportadas

| Intención | Descripción | Entidades Requeridas | Entidades Opcionales |
|-----------|-------------|---------------------|---------------------|
| `consulta_estado` | Consultar estado de solicitud | `solicitud_id`, `cita_id`, `email` | `tipo_consulta` |
| `agendar_cita` | Agendar nueva cita | `fecha`, `hora`, `email` | `tipo_sesion`, `paquete_id`, `tamaño_grupo` |
| `consultar_paquetes` | Ver paquetes disponibles | - | `tipo_paquete`, `moneda`, `duración` |
| `pagar_servicio` | Procesar pago | `monto`, `método_pago`, `email` | `cita_id`, `paquete_id`, `moneda` |
| `cancelar_cita` | Cancelar cita existente | `cita_id`, `email` | `motivo` |
| `consultar_historial` | Ver historial del usuario | `email` | `tipo_historial`, `fecha_desde`, `fecha_hasta` |
| `consultar_horarios` | Ver horarios disponibles | - | `fecha`, `duración`, `tipo_sesion` |
| `actualizar_perfil` | Actualizar información | `email` | `nombre`, `teléfono`, `fecha_nacimiento` |
| `saludo` | Manejar saludos | - | `nombre` |
| `despedida` | Manejar despedidas | - | - |
| `ayuda` | Proporcionar ayuda | - | `tema_ayuda` |

## 📊 Sistema de Logging

### Estructura del Log

```json
{
  "id": "conv_1234567890_abc123",
  "userId": "user_123",
  "message": "Quiero agendar una cita",
  "intent": "agendar_cita",
  "entities": [
    {"entity": "fecha", "value": "mañana", "confidence": 0.9}
  ],
  "action": "agendar_cita",
  "rasaResponse": "{\"intent\": {...}}",
  "llmResponse": "Perfecto, ¿para qué fecha te gustaría agendar?",
  "apiCalls": [
    {"success": true, "data": {...}}
  ],
  "processingTime": 250,
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Consultas Útiles

```sql
-- Estadísticas por día
SELECT * FROM conversation_stats ORDER BY date DESC;

-- Errores más frecuentes
SELECT * FROM error_stats;

-- Intenciones más comunes
SELECT * FROM intent_stats;

-- Estadísticas de usuario específico
SELECT * FROM get_user_conversation_stats('user_123', 30);
```

## 🧪 Testing

### Script de Testing Automático

```bash
# Ejecutar todos los tests
node scripts/test-orchestrator.js

# Tests individuales
curl "http://localhost:3000/api/orchestrator/test?type=health"
curl "http://localhost:3000/api/orchestrator/test?type=examples"
```

### Ejemplos de Mensajes de Prueba

```javascript
const testMessages = [
  "Hola, ¿cómo estás?",
  "¿Qué paquetes tienen disponibles?",
  "Quiero agendar una cita para mañana a las 3pm",
  "¿Cuál es el estado de mi solicitud 12345?",
  "Quiero pagar $50 por mi paquete con tarjeta de crédito",
  "¿Qué horarios tienen disponibles para esta semana?",
  "Necesito cancelar mi cita del viernes",
  "¿Cómo funciona el sistema de citas?"
];
```

## 🔍 Monitoreo y Debugging

### Health Check

```bash
curl "http://localhost:3000/api/orchestrator?action=health"
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "overall": true,
    "services": {
      "rasa": true,
      "openrouter": true,
      "twilio": true,
      "api": true,
      "logging": true
    }
  }
}
```

### Logs en Tiempo Real

```bash
# Ver logs de la aplicación
npm run dev

# Ver logs de base de datos
psql -d $DATABASE_URL -c "SELECT * FROM conversation_logs ORDER BY timestamp DESC LIMIT 10;"
```

## 🚨 Manejo de Errores

### Tipos de Errores

1. **Errores de Validación**: Entidades faltantes o inválidas
2. **Errores de API**: Fallos en llamadas a APIs internas
3. **Errores de LLM**: Fallos en generación de respuestas
4. **Errores de Twilio**: Fallos en envío de mensajes
5. **Errores de Rasa**: Fallos en detección de intenciones

### Estrategias de Recuperación

- **Reintentos Automáticos**: Para errores temporales
- **Fallback Responses**: Respuestas genéricas ante fallos
- **Logging Detallado**: Para debugging y análisis
- **Notificaciones**: Alertas para errores críticos

## 📈 Optimización y Escalabilidad

### Mejoras de Rendimiento

1. **Cache de Contexto**: Almacenar contexto de conversación en Redis
2. **Rate Limiting**: Limitar mensajes por usuario
3. **Pool de Conexiones**: Reutilizar conexiones a APIs
4. **Compresión**: Comprimir respuestas largas

### Escalabilidad Horizontal

1. **Load Balancing**: Distribuir carga entre instancias
2. **Queue System**: Usar colas para procesamiento asíncrono
3. **Database Sharding**: Particionar logs por usuario
4. **CDN**: Cachear respuestas estáticas

## 🔒 Seguridad

### Validaciones

- **Firma de Twilio**: Validar webhooks de Twilio
- **Rate Limiting**: Prevenir spam y abuso
- **Sanitización**: Limpiar inputs del usuario
- **Logging Seguro**: No registrar información sensible

### Mejores Prácticas

- Usar HTTPS para todos los endpoints
- Rotar claves de API regularmente
- Implementar autenticación para endpoints administrativos
- Monitorear intentos de acceso no autorizados

## 🛠️ Desarrollo y Contribución

### Estructura del Código

- **Tipos**: Definiciones TypeScript en `lib/types/`
- **Servicios**: Lógica de negocio en `lib/services/`
- **APIs**: Endpoints en `app/api/`
- **Scripts**: Utilidades en `scripts/`

### Agregar Nueva Intención

1. Actualizar `IntentActionMapping` en el endpoint
2. Implementar acción en `APIService`
3. Agregar casos de prueba
4. Actualizar documentación

### Agregar Nueva API

1. Crear endpoint en `app/api/`
2. Agregar método en `APIService`
3. Configurar mapeo de intención
4. Probar integración

## 📚 Recursos Adicionales

- [Documentación de Rasa](https://rasa.com/docs/)
- [OpenRouter API](https://openrouter.ai/docs)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## 🤝 Soporte

Para soporte técnico o preguntas:

1. Revisar logs de error
2. Verificar configuración de variables de entorno
3. Probar endpoints individuales
4. Consultar documentación de APIs externas

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

---

**Nota**: Este orquestador está diseñado específicamente para el sistema de consultas astrológicas, pero puede adaptarse fácilmente a otros dominios modificando las intenciones y entidades en la configuración.
