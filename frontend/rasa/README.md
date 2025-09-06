# Rasa Configuration for Conversational Orchestrator

Esta carpeta contiene la configuración completa de Rasa para el orquestador conversacional de astrología.

## 📁 Estructura de Archivos

```
rasa/
├── config.yml          # Configuración principal de Rasa
├── domain.yml          # Definición de intents, entities y responses
├── endpoints.yml       # Configuración de endpoints
├── credentials.yml     # Credenciales para canales
├── data/
│   ├── nlu.yml        # Datos de entrenamiento NLU
│   └── rules.yml      # Reglas de conversación
├── actions/
│   └── actions.py     # Acciones personalizadas (opcional)
└── models/            # Modelos entrenados (generado)
```

## 🚀 Inicio Rápido

### Opción 1: Usando el Script Automático (Recomendado)

```bash
# Desde la raíz del proyecto
chmod +x scripts/rasa-docker.sh
./scripts/rasa-docker.sh train
./scripts/rasa-docker.sh start
```

### Opción 2: Usando Docker Compose Directamente

```bash
# Entrenar modelo
docker run --rm -v $(pwd)/rasa:/app rasa/rasa:3.6.20-full train

# Iniciar servicios
docker-compose up -d
```

### Opción 3: Instalación Local (No Recomendado)

Si tienes Python 3.8-3.11 instalado:

```bash
# Crear entorno virtual
python3 -m venv rasa_env
source rasa_env/bin/activate

# Instalar Rasa
pip install rasa==3.6.20

# Entrenar modelo
rasa train

# Iniciar servidor
rasa run --cors "*" --debug
```

## 🧪 Verificación de Instalación

### Probar Endpoint de Salud
```bash
curl http://localhost:5005/
# Deberías ver información sobre Rasa
```

### Probar Parseo de Mensaje
```bash
curl -X POST http://localhost:5005/webhooks/rest/webhook \
  -H "Content-Type: application/json" \
  -d '{"sender": "test", "message": "hola"}'
```

### Probar con Postman/Insomnia
```json
POST http://localhost:5005/webhooks/rest/webhook
Content-Type: application/json

{
  "sender": "test_user",
  "message": "Quiero agendar una cita"
}
```

## 🎯 Intents Configurados

### Intents Principales
- `consulta_estado` - Consultar estado de solicitudes/citas
- `agendar_cita` - Agendar nuevas citas
- `consultar_paquetes` - Ver paquetes disponibles
- `pagar_servicio` - Procesar pagos
- `cancelar_cita` - Cancelar citas existentes
- `consultar_historial` - Ver historial del usuario
- `consultar_horarios` - Ver horarios disponibles
- `actualizar_perfil` - Actualizar información personal
- `saludo` - Saludos iniciales
- `despedida` - Despedidas
- `ayuda` - Solicitudes de ayuda

### Entities Soportadas
- `solicitud_id` - ID de solicitud
- `cita_id` - ID de cita
- `email` - Correo electrónico
- `fecha` - Fechas
- `hora` - Horas
- `tipo_sesion` - Tipo de sesión
- `paquete_id` - ID de paquete
- `monto` - Montos de pago
- `método_pago` - Métodos de pago
- `moneda` - Monedas
- `nombre` - Nombres
- `teléfono` - Números de teléfono
- `fecha_nacimiento` - Fechas de nacimiento
- `lugar_nacimiento` - Lugares de nacimiento
- `tamaño_grupo` - Tamaño de grupos
- `notas` - Notas adicionales

## 🔧 Personalización

### Agregar Nuevos Intents

1. Editar `data/nlu.yml`:
```yaml
- intent: nuevo_intent
  examples: |
    - ejemplo 1
    - ejemplo 2
    - ejemplo [entidad](tipo_entidad) ejemplo
```

2. Actualizar `domain.yml`:
```yaml
intents:
  - nuevo_intent

responses:
  utter_respuesta_nueva:
    - text: "Respuesta para el nuevo intent"
```

3. Agregar reglas en `data/rules.yml` si es necesario

### Agregar Nuevas Entities

1. Definir en `domain.yml`:
```yaml
entities:
  - nueva_entidad
```

2. Agregar ejemplos en `data/nlu.yml`:
```yaml
- intent: ejemplo_intent
  examples: |
    - texto con [valor](nueva_entidad) aquí
```

### Modificar Respuestas

Editar las respuestas en `domain.yml` bajo la sección `responses`. Puedes tener múltiples variaciones:

```yaml
utter_saludo:
  - text: "¡Hola! ¿En qué puedo ayudarte?"
  - text: "Saludos. ¿Cómo estás?"
  - text: "¡Buen día! ¿Qué necesitas?"
```

## 📊 Monitoreo y Debugging

### Ver Logs
```bash
# Con Docker
./scripts/rasa-docker.sh logs

# Con docker-compose
docker-compose logs -f rasa
```

### Validar Configuración
```bash
# Validar datos
docker run --rm -v $(pwd)/rasa:/app rasa/rasa:3.6.20-full data validate

# Validar dominio
docker run --rm -v $(pwd)/rasa:/app rasa/rasa:3.6.20-full domain validate
```

### Probar en Modo Interactivo
```bash
# Abrir shell de Rasa
./scripts/rasa-docker.sh shell
```

## 🔄 Reentrenamiento

### Reentrenar Modelo
```bash
# Automático
./scripts/rasa-docker.sh train

# Manual
docker run --rm -v $(pwd)/rasa:/app rasa/rasa:3.6.20-full train
```

### Actualizar Modelo en Producción
```bash
# Reiniciar servicios
./scripts/rasa-docker.sh restart

# O manualmente
docker-compose restart rasa
```

## 🚨 Solución de Problemas

### Rasa no responde
```bash
# Verificar estado
./scripts/rasa-docker.sh status

# Ver logs
./scripts/rasa-docker.sh logs

# Reiniciar
./scripts/rasa-docker.sh restart
```

### Errores de entrenamiento
```bash
# Validar configuración
docker run --rm -v $(pwd)/rasa:/app rasa/rasa:3.6.20-full config --help

# Verificar archivos de datos
docker run --rm -v $(pwd)/rasa:/app rasa/rasa:3.6.20-full data validate
```

### Problemas de memoria
```bash
# Aumentar memoria de Docker
docker run --memory=4g --rm -v $(pwd)/rasa:/app rasa/rasa:3.6.20-full train
```

## 📈 Optimización

### Configuración de Pipeline Optimizada

El pipeline actual está configurado para:
- **Precisión alta** en detección de intents
- **Reconocimiento de entidades** robusto
- **Manejo de contexto** eficiente
- **Rendimiento balanceado** con precisión

### Ajustes Recomendados

Para más precisión (más lento):
```yaml
pipeline:
  - name: WhitespaceTokenizer
  - name: CountVectorsFeaturizer
    analyzer: char_wb
    min_ngram: 1
    max_ngram: 5  # Aumentar
  - name: DIETClassifier
    epochs: 200   # Aumentar
```

Para más velocidad (menos preciso):
```yaml
pipeline:
  - name: WhitespaceTokenizer
  - name: CountVectorsFeaturizer
    analyzer: char_wb
    min_ngram: 1
    max_ngram: 3  # Reducir
  - name: DIETClassifier
    epochs: 50    # Reducir
```

## 🔐 Seguridad

### Configuración de Producción
- Cambiar `credentials.yml` para incluir solo canales necesarios
- Configurar autenticación en endpoints
- Usar HTTPS para todas las conexiones
- Limitar acceso a contenedores Docker

### Variables de Entorno Sensibles
Nunca commitear:
- API keys
- Tokens de autenticación
- Credenciales de base de datos
- Información sensible

## 📚 Recursos Adicionales

- [Documentación Oficial de Rasa](https://rasa.com/docs/)
- [Guía de Training Data](https://rasa.com/docs/rasa/training-data-format)
- [Configuración de Pipeline](https://rasa.com/docs/rasa/components)
- [Mejores Prácticas](https://rasa.com/docs/rasa/model-configuration)

## 🤝 Soporte

Para problemas específicos de Rasa:
1. Consultar logs del contenedor
2. Validar archivos de configuración
3. Verificar conectividad de red
4. Revisar documentación oficial

---

**Nota**: Esta configuración está optimizada para el sistema de astrología. Para otros dominios, ajustar los intents y entities según sea necesario.

