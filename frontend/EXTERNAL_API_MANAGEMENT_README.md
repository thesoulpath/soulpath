# 🔧 Sistema de Gestión de APIs Externas

Sistema completo para gestionar configuraciones de APIs externas desde el Admin Dashboard, con soporte para OpenRouter, Twilio, WhatsApp, Telegram y otros servicios.

## 📋 Características Principales

### ✅ **Gestión Completa de APIs**
- **Configuración centralizada** de todas las APIs externas
- **Interfaz intuitiva** en el Admin Dashboard
- **Categorización automática** (AI, Comunicación, Pagos)
- **Encriptación de credenciales** sensibles
- **Modo test** para desarrollo seguro

### ✅ **Monitoreo y Testing**
- **Pruebas automáticas** de conectividad
- **Estados de salud** en tiempo real
- **Logs de auditoría** completos
- **Historial de pruebas** y resultados
- **Alertas de estado** (Healthy/Unhealthy)

### ✅ **Seguridad Avanzada**
- **Encriptación AES** de API keys y secrets
- **Auditoría completa** de todas las operaciones
- **Control de acceso** por roles de usuario
- **Validación de permisos** en cada operación
- **Logs de IP y User-Agent**

## 🚀 Instalación y Configuración

### 1. **Aplicar Migraciones**
```bash
# Ejecutar migración de base de datos
node scripts/migrate-external-apis.js

# O manualmente:
npx prisma migrate dev --name add_external_api_configs
npx prisma generate
```

### 2. **Poblar Datos de Ejemplo**
```bash
# Crear configuraciones de ejemplo
node scripts/seed-external-apis.js seed

# Listar configuraciones existentes
node scripts/seed-external-apis.js list

# Resetear y recrear
node scripts/seed-external-apis.js reset
```

### 3. **Acceder al Admin Dashboard**
1. Inicia sesión como administrador
2. Ve a **Admin Dashboard** → **External APIs**
3. Configura tus APIs reales

## 📊 APIs Soportadas

### 🤖 **Inteligencia Artificial**
| API | Proveedor | Estado | Descripción |
|-----|-----------|--------|-------------|
| OpenRouter | OpenRouter | ✅ Listo | LLM para respuestas conversacionales |
| Anthropic | Claude | 🔄 Próximamente | Claude para respuestas avanzadas |
| OpenAI | GPT | 🔄 Próximamente | GPT-4 para generación de texto |

### 📱 **Comunicación**
| API | Proveedor | Estado | Descripción |
|-----|-----------|--------|-------------|
| Twilio | Twilio | ✅ Listo | WhatsApp y SMS |
| Telegram | Telegram | ✅ Listo | Bots de Telegram |
| WhatsApp Business | Meta | 🔄 Próximamente | WhatsApp Business API |

### 💳 **Pagos**
| API | Proveedor | Estado | Descripción |
|-----|-----------|--------|-------------|
| Stripe | Stripe | ✅ Listo | Procesamiento de pagos |
| PayPal | PayPal | 🔄 Próximamente | Pagos con PayPal |
| MercadoPago | MercadoPago | 🔄 Próximamente | Pagos latinoamericanos |

## 🔧 Configuración de APIs

### **OpenRouter (IA Conversacional)**
```json
{
  "name": "openrouter",
  "provider": "OpenRouter",
  "category": "ai",
  "apiKey": "sk-or-v1-tu-api-key-real",
  "apiUrl": "https://openrouter.ai/api/v1",
  "config": {
    "model": "meta-llama/llama-3.1-8b-instruct:free",
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
```

### **Twilio (WhatsApp/SMS)**
```json
{
  "name": "twilio",
  "provider": "Twilio",
  "category": "communication",
  "apiKey": "ACtu-account-sid-real",
  "apiSecret": "tu-auth-token-real",
  "webhookUrl": "https://tu-dominio.vercel.app/api/whatsapp/webhook",
  "config": {
    "phone_number": "+1234567890",
    "messaging_service_sid": "MGtu-messaging-sid"
  }
}
```

### **Telegram (Bots)**
```json
{
  "name": "telegram",
  "provider": "Telegram",
  "category": "communication",
  "apiKey": "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz",
  "webhookUrl": "https://tu-dominio.vercel.app/api/telegram/webhook",
  "config": {
    "bot_username": "@tu_bot"
  }
}
```

## 🛠️ API Endpoints

### **GET /api/admin/external-apis**
Lista todas las configuraciones
```javascript
// Listar todas
fetch('/api/admin/external-apis?action=list')

// Obtener logs de auditoría
fetch('/api/admin/external-apis?action=audit&configId=123')
```

### **POST /api/admin/external-apis**
Crear o probar configuraciones
```javascript
// Crear nueva configuración
fetch('/api/admin/external-apis', {
  method: 'POST',
  body: JSON.stringify({
    action: 'create',
    data: { /* configuración */ }
  })
})

// Probar configuración
fetch('/api/admin/external-apis', {
  method: 'POST',
  body: JSON.stringify({
    action: 'test',
    data: { id: 'config-id' }
  })
})
```

### **PUT /api/admin/external-apis?id=123**
Actualizar configuración
```javascript
fetch('/api/admin/external-apis?id=123', {
  method: 'PUT',
  body: JSON.stringify({
    apiKey: 'nueva-api-key',
    isActive: true
  })
})
```

### **DELETE /api/admin/external-apis?id=123**
Eliminar configuración
```javascript
fetch('/api/admin/external-apis?id=123', {
  method: 'DELETE'
})
```

## 🔒 Seguridad y Auditoría

### **Encriptación**
- Las API keys y secrets se encriptan usando bcrypt
- Las claves se desencriptan solo cuando son necesarias
- Nunca se muestran las credenciales en logs

### **Auditoría Completa**
Cada operación registra:
- Usuario que realizó la acción
- Fecha y hora
- Dirección IP
- User-Agent del navegador
- Valores anteriores y nuevos

### **Control de Acceso**
- Solo administradores pueden gestionar APIs
- Verificación de permisos en cada endpoint
- Logs de acceso no autorizado

## 📊 Monitoreo y Alertas

### **Estados de Salud**
- **🟢 Healthy**: API responde correctamente
- **🔴 Unhealthy**: API no responde o error
- **🟡 Unknown**: Sin información de estado

### **Métricas Disponibles**
- Tasa de éxito de pruebas
- Tiempo de respuesta promedio
- Número de llamadas por hora
- Estado de conectividad

## 🎯 Uso en el Orquestador Conversacional

### **Integración Automática**
```typescript
// El orquestador detecta automáticamente las APIs configuradas
const orchestrator = new ConversationalOrchestrator();

// Busca configuración de OpenRouter
const openRouterConfig = await apiService.getConfigByName('openrouter');

if (openRouterConfig?.isActive) {
  // Usa la configuración para llamadas a OpenRouter
  const response = await fetch(openRouterConfig.apiUrl, {
    headers: {
      'Authorization': `Bearer ${openRouterConfig.apiKey}`,
      'Content-Type': 'application/json'
    }
  });
}
```

### **Configuración Dinámica**
```typescript
// Las configuraciones se actualizan en tiempo real
// No es necesario reiniciar el servidor

// Cambiar modelo de IA desde el admin
await apiService.updateConfig('openrouter', {
  config: {
    model: 'anthropic/claude-3-haiku',
    temperature: 0.8
  }
});

// El orquestador usará el nuevo modelo automáticamente
```

## 🚀 Próximos Pasos

### **Funcionalidades Planeadas**
- [ ] **Webhooks automáticos** para actualizaciones
- [ ] **Métricas avanzadas** de uso
- [ ] **Alertas por email** cuando APIs fallen
- [ ] **Rotación automática** de API keys
- [ ] **Rate limiting** inteligente
- [ ] **Cache distribuido** para respuestas

### **Nuevas APIs Soportadas**
- [ ] **Google Gemini** para IA
- [ ] **Microsoft Azure** OpenAI
- [ ] **WhatsApp Business API**
- [ ] **Discord** bots
- [ ] **Slack** integración

## 📞 Soporte

Si tienes problemas:

1. **Verifica logs**: `node scripts/seed-external-apis.js list`
2. **Revisa permisos**: Asegúrate de ser administrador
3. **Test manual**: Usa los botones de "Test" en el dashboard
4. **Logs de auditoría**: Revisa `/api/admin/external-apis?action=audit`

## 📝 Changelog

### **v1.0.0** - Sistema Base
- ✅ Gestión completa de APIs externas
- ✅ Interfaz de admin intuitiva
- ✅ Encriptación de credenciales
- ✅ Auditoría completa
- ✅ Testing automático
- ✅ Integración con orquestador

---

**🎉 ¡Tu sistema de gestión de APIs externas está listo para usar!**

Configura tus APIs favoritas y comienza a integrar servicios externos de manera segura y eficiente. 🚀

