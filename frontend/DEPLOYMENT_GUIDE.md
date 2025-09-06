# 🚀 Guía de Despliegue - Rasa + Orquestador Conversacional

## 🎯 Despliegue Recomendado

Basado en que tienes **Vercel** y **Render.com**, aquí está la estrategia óptima:

### **Opción 1: Render.com (Recomendado para Rasa)** ⭐⭐⭐⭐⭐

## 📋 Checklist de Despliegue en Render.com

### **Paso 1: Preparar el Repositorio**
```bash
# Asegúrate de que estos archivos estén en tu repo:
- Dockerfile.rasa
- render-deployment.yml
- rasa/ (directorio completo)
- scripts/deploy-rasa.sh
```

### **Paso 2: Crear Servicio en Render**

1. **Ve a Render Dashboard**: https://dashboard.render.com
2. **Clic en "New" → "Web Service"**
3. **Conecta tu repositorio de GitHub**
4. **Configura el servicio**:

#### **Configuración del Servicio Web**
```yaml
# Nombre del servicio
Name: rasa-astrology-assistant

# Runtime
Runtime: Docker
Dockerfile Path: ./Dockerfile.rasa

# Plan
Plan: Starter ($7/mes - incluye 750 horas)

# Region
Region: Oregon (US West) - más cercano a Vercel
```

### **Paso 3: Variables de Entorno**

Agrega estas variables en Render:

```bash
# Rasa Configuration
RASA_ENVIRONMENT=production
RASA_TELEMETRY_ENABLED=false
RASA_CORS_ORIGIN=https://tu-dominio.vercel.app
RASA_MODEL_SERVER=https://tu-rasa-service.onrender.com

# Security (Opcional)
RASA_CREDENTIALS_REST_VERIFY=tu_webhook_secret
RASA_CREDENTIALS_REST_SECRET=tu_webhook_secret

# Logging
RASA_LOG_LEVEL=INFO
```

### **Paso 4: Health Check**

Render configurará automáticamente:
- **Health Check Path**: `/`
- **Health Check Timeout**: 30 segundos

### **Paso 5: Despliegue Automático**

1. **Push a GitHub** → Render detecta cambios automáticamente
2. **Despliegue toma ~3-5 minutos**
3. **URL generada**: `https://rasa-astrology-assistant.onrender.com`

## 🔧 Configuración de Vercel

### **Actualizar Variables de Entorno en Vercel**

Una vez que Rasa esté desplegado en Render, actualiza tu `.env.local` en Vercel:

```bash
# Rasa Configuration
RASA_URL=https://tu-rasa-service.onrender.com
API_BASE_URL=https://tu-nextjs-app.vercel.app/api

# OpenRouter (ya configurado)
OPENROUTER_API_KEY=tu_api_key
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

# Twilio (ya configurado)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### **Configuración CORS en Rasa**

En `rasa/credentials.yml`:
```yaml
rest:
  cors_origin: "https://tu-dominio.vercel.app"
```

## 🧪 Probar la Integración

### **1. Probar Rasa Directamente**
```bash
# Probar endpoint de Rasa
curl https://tu-rasa-service.onrender.com/

# Probar procesamiento de mensaje
curl -X POST https://tu-rasa-service.onrender.com/webhooks/rest/webhook \
  -H "Content-Type: application/json" \
  -d '{"sender": "test", "message": "hola"}'
```

### **2. Probar Chat Web**
1. Despliega tu app en Vercel
2. Abre el chat en el homepage
3. Envía un mensaje de prueba
4. Verifica que llegue a Rasa en Render

### **3. Probar WhatsApp**
1. Configura webhook de Twilio apuntando a Vercel
2. Envía mensaje por WhatsApp
3. Verifica el flujo completo

## 📊 Monitoreo y Logs

### **Render.com Monitoring**
- **Logs en tiempo real**: Dashboard → Service → Logs
- **Métricas de rendimiento**: Dashboard → Service → Metrics
- **Health checks**: Automáticos cada 30 segundos
- **Auto-scaling**: Hasta 3 instancias si es necesario

### **Vercel Monitoring**
- **Function logs**: Dashboard → Functions
- **Analytics**: Vercel Analytics
- **Error tracking**: Integración con Sentry/LogRocket

## 🚨 Solución de Problemas

### **Problema: Rasa no responde**
```bash
# Verificar estado del servicio
curl https://tu-rasa-service.onrender.com/

# Ver logs en Render
# Dashboard → Service → Logs

# Reiniciar servicio
# Dashboard → Service → Manual Deploy
```

### **Problema: CORS errors**
```yaml
# En rasa/credentials.yml
rest:
  cors_origin: "https://tu-dominio.vercel.app"
```

### **Problema: Timeout en Vercel**
```javascript
// En tu API route (/api/chat/web/route.ts)
export const maxDuration = 30; // Aumentar límite de Vercel
```

### **Problema: Conexión entre servicios**
```bash
# Verificar conectividad
curl -X POST https://tu-rasa-service.onrender.com/webhooks/rest/webhook \
  -H "Content-Type: application/json" \
  -H "Origin: https://tu-dominio.vercel.app" \
  -d '{"sender": "test", "message": "hola"}'
```

## 💰 Costos Estimados

### **Render.com**
- **Starter Plan**: $7/mes
- **Free Plan**: 750 horas gratis/mes
- **Uso típico**: ~200-400 horas/mes = $2-5/mes

### **Vercel** (ya tienes)
- **Hobby Plan**: $0/mes (incluye en free tier)
- **Pro Plan**: $20/mes (si necesitas más funciones)

### **Total mensual**: ~$7-27/mes

## 🔄 Actualizaciones y Mantenimiento

### **Actualizar Rasa**
```bash
# Hacer cambios en código local
# Commit y push a GitHub
# Render detecta cambios y redeploy automáticamente
```

### **Backup de Modelos**
```bash
# Los modelos se reconstruyen en cada deploy
# Para persistencia, considera usar cloud storage
```

### **Scaling**
```bash
# Render escala automáticamente basado en carga
# Máximo 3 instancias en Starter Plan
```

## 🎯 Arquitectura Final

```
Usuario Web/Móvil
    ↓
Vercel (Next.js App)
    ↓
Chat Window + API Routes
    ↓
Render.com (Rasa Service)
    ↓
Intents + Entities Detection
    ↓
Vercel API Routes
    ↓
Internal APIs (Bookings, Payments, etc.)
    ↓
OpenRouter (LLM Response Generation)
    ↓
Final Response to User
```

## 🚀 Próximos Pasos

### **Inmediatos (Esta semana)**
1. ✅ Crear cuenta en Render.com
2. ✅ Preparar archivos de despliegue
3. ✅ Desplegar Rasa en Render
4. ✅ Actualizar configuración en Vercel
5. ✅ Probar integración completa
6. ✅ Configurar monitoreo

### **Mediano Plazo (Próximas semanas)**
1. Optimizar costos de Render
2. Implementar caching de respuestas
3. Agregar más intents a Rasa
4. Mejorar manejo de errores
5. Implementar analytics avanzado

### **Preguntas Frecuentes**

**¿Por qué Render mejor que Vercel para Rasa?**
- Render soporta servicios de larga duración
- Mejor para workloads de ML/AI
- Docker nativo sin restricciones

**¿Cuánto cuesta?**
- ~$7/mes en Render (750 horas gratis)
- Vercel ya lo tienes incluido

**¿Es escalable?**
- Sí, Render escala automáticamente
- Hasta 3 instancias en Starter Plan

**¿Qué pasa si hay mucho tráfico?**
- Render maneja hasta 1000 req/min en Starter
- Se puede upgrade a Pro Plan si es necesario

---

## 🎉 ¡Listo para Desplegar!

Tu arquitectura será:
- **Frontend**: Vercel (Next.js + Chat Window)
- **Backend**: Render.com (Rasa + ML)
- **APIs**: Vercel (Internal APIs)
- **LLM**: OpenRouter (Response Generation)
- **WhatsApp**: Twilio (External Integration)

**¿Quieres que te ayude con algún paso específico del despliegue?**

