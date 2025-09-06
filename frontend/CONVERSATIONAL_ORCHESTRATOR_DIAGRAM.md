# Diagrama de Flujo del Orquestador Conversacional

## Flujo Principal del Sistema

```mermaid
graph TD
    A[Usuario envía mensaje por WhatsApp] --> B[Twilio recibe mensaje]
    B --> C[Webhook POST /api/whatsapp/webhook]
    C --> D[Validar webhook de Twilio]
    D --> E[Parsear mensaje de WhatsApp]
    E --> F[Obtener/Crear contexto de conversación]
    F --> G[Enviar confirmación de recepción]
    G --> H[Enviar mensaje a Rasa]
    H --> I{Rasa detecta intención}
    I -->|Confianza alta| J[Extraer entidades]
    I -->|Confianza baja| K[Pedir aclaración al usuario]
    J --> L[Ejecutar acción en API interna]
    L --> M[Generar respuesta con LLM]
    M --> N[Enviar respuesta por WhatsApp]
    N --> O[Actualizar contexto de conversación]
    O --> P[Registrar log de interacción]
    P --> Q[Fin]
    K --> R[Generar respuesta de aclaración]
    R --> N
```

## Arquitectura de Servicios

```mermaid
graph TB
    subgraph "Frontend"
        WA[WhatsApp Usuario]
    end
    
    subgraph "Twilio"
        TW[Twilio API]
    end
    
    subgraph "Next.js Backend"
        WH[Webhook Handler]
        CO[Conversational Orchestrator]
        
        subgraph "Servicios"
            RS[Rasa Service]
            OS[OpenRouter Service]
            TS[Twilio Service]
            AS[API Service]
            LS[Logging Service]
        end
        
        subgraph "APIs Internas"
            BA[Booking API]
            PA[Packages API]
            PYA[Payment API]
            CA[Client API]
        end
    end
    
    subgraph "Servicios Externos"
        RASA[Rasa Server]
        OPEN[OpenRouter API]
    end
    
    subgraph "Base de Datos"
        DB[(PostgreSQL)]
        REDIS[(Redis Cache)]
    end
    
    WA --> TW
    TW --> WH
    WH --> CO
    CO --> RS
    CO --> AS
    CO --> OS
    CO --> TS
    CO --> LS
    RS --> RASA
    OS --> OPEN
    AS --> BA
    AS --> PA
    AS --> PYA
    AS --> CA
    LS --> DB
    CO --> REDIS
    TS --> TW
    TW --> WA
```

## Flujo de Procesamiento de Mensaje

```mermaid
sequenceDiagram
    participant U as Usuario
    participant T as Twilio
    participant W as Webhook
    participant O as Orquestador
    participant R as Rasa
    participant A as API Service
    participant L as LLM
    participant D as Database
    
    U->>T: Mensaje WhatsApp
    T->>W: POST /api/whatsapp/webhook
    W->>O: processWhatsAppMessage()
    O->>T: Enviar confirmación
    T->>U: "Mensaje recibido"
    
    O->>R: parseMessage()
    R-->>O: {intent, entities, confidence}
    
    alt Confianza alta
        O->>A: executeAction(intent, entities)
        A->>A: Consultar APIs internas
        A-->>O: Datos de API
        O->>L: generateResponse(message, intent, data)
        L-->>O: Respuesta enriquecida
    else Confianza baja
        O->>L: generateClarificationResponse()
        L-->>O: Pregunta de aclaración
    end
    
    O->>T: sendMessage(response)
    T->>U: Respuesta final
    O->>D: logConversation()
```

## Mapeo de Intenciones a Acciones

```mermaid
graph LR
    subgraph "Intenciones Rasa"
        I1[consulta_estado]
        I2[agendar_cita]
        I3[consultar_paquetes]
        I4[pagar_servicio]
        I5[cancelar_cita]
        I6[consultar_historial]
        I7[consultar_horarios]
        I8[actualizar_perfil]
        I9[saludo]
        I10[despedida]
        I11[ayuda]
    end
    
    subgraph "Acciones API"
        A1[consultar_estado]
        A2[agendar_cita]
        A3[consultar_paquetes]
        A4[pagar_servicio]
        A5[cancelar_cita]
        A6[consultar_historial]
        A7[consultar_horarios]
        A8[actualizar_perfil]
        A9[saludo]
        A10[despedida]
        A11[ayuda]
    end
    
    subgraph "Endpoints API"
        E1[/admin/bookings]
        E2[/booking]
        E3[/packages]
        E4[/client/purchase]
        E5[/client/bookings]
        E6[/client/purchase-history]
        E7[/schedule-slots]
        E8[/client/me]
        E9[Respuesta directa]
        E10[Respuesta directa]
        E11[Respuesta directa]
    end
    
    I1 --> A1 --> E1
    I2 --> A2 --> E2
    I3 --> A3 --> E3
    I4 --> A4 --> E4
    I5 --> A5 --> E5
    I6 --> A6 --> E6
    I7 --> A7 --> E7
    I8 --> A8 --> E8
    I9 --> A9 --> E9
    I10 --> A10 --> E10
    I11 --> A11 --> E11
```

## Sistema de Logging

```mermaid
graph TD
    A[Interacción del Usuario] --> B[Crear Log Entry]
    B --> C{Tipo de Storage}
    C -->|database| D[PostgreSQL]
    C -->|file| E[Archivo JSONL]
    C -->|console| F[Console Log]
    
    D --> G[Índices Optimizados]
    G --> H[Consultas Rápidas]
    
    E --> I[Rotación de Archivos]
    I --> J[Compresión]
    
    F --> K[Desarrollo/Debug]
    
    subgraph "Vistas de Análisis"
        L[conversation_stats]
        M[error_stats]
        N[intent_stats]
    end
    
    D --> L
    D --> M
    D --> N
```

## Manejo de Errores

```mermaid
graph TD
    A[Error Detectado] --> B{Tipo de Error}
    
    B -->|Validación| C[Entidades Faltantes]
    B -->|API| D[Fallo en Llamada API]
    B -->|LLM| E[Fallo en Generación]
    B -->|Twilio| F[Fallo en Envío]
    B -->|Rasa| G[Fallo en Detección]
    
    C --> H[Pedir Aclaración]
    D --> I[Reintentar Llamada]
    E --> J[Respuesta de Error Genérica]
    F --> K[Notificar Administrador]
    G --> L[Fallback a Intención Genérica]
    
    I --> M{Reintentos < Max}
    M -->|Sí| I
    M -->|No| J
    
    H --> N[Continuar Conversación]
    J --> N
    K --> O[Log de Error Crítico]
    L --> N
    O --> P[Alertas de Monitoreo]
```

## Configuración de Despliegue

```mermaid
graph TB
    subgraph "Desarrollo Local"
        D1[Next.js Dev Server]
        D2[Rasa Server]
        D3[PostgreSQL Local]
        D4[Redis Local]
    end
    
    subgraph "Producción"
        P1[Vercel/Netlify]
        P2[Rasa Cloud/Docker]
        P3[PostgreSQL Cloud]
        P4[Redis Cloud]
        P5[Twilio Production]
        P6[OpenRouter API]
    end
    
    subgraph "Variables de Entorno"
        E1[.env.local]
        E2[.env.production]
    end
    
    D1 --> D2
    D1 --> D3
    D1 --> D4
    D1 --> E1
    
    P1 --> P2
    P1 --> P3
    P1 --> P4
    P1 --> P5
    P1 --> P6
    P1 --> E2
```

## Métricas y Monitoreo

```mermaid
graph LR
    subgraph "Métricas de Rendimiento"
        M1[Tiempo de Procesamiento]
        M2[Éxito/Fallo por Intención]
        M3[Uso de APIs]
        M4[Latencia de LLM]
    end
    
    subgraph "Métricas de Negocio"
        B1[Mensajes por Usuario]
        B2[Intenciones Más Comunes]
        B3[Conversiones por Intención]
        B4[Satisfacción del Usuario]
    end
    
    subgraph "Alertas"
        A1[Errores Críticos]
        A2[Latencia Alta]
        A3[Fallos de API]
        A4[Uso Anómalo]
    end
    
    M1 --> A2
    M2 --> A1
    M3 --> A3
    B1 --> A4
```

Este diagrama muestra la arquitectura completa del sistema de orquestación conversacional, incluyendo todos los flujos de datos, servicios, y procesos de manejo de errores.
