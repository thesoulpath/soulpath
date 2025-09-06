-- Script para crear la tabla de logs de conversación
-- Ejecutar con: psql -d tu_database -f create-conversation-logs-table.sql

CREATE TABLE IF NOT EXISTS conversation_logs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    intent VARCHAR(100) NOT NULL,
    entities JSONB DEFAULT '[]'::jsonb,
    action VARCHAR(100) NOT NULL,
    rasa_response TEXT,
    llm_response TEXT,
    api_calls JSONB DEFAULT '[]'::jsonb,
    processing_time INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT false,
    error TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para optimizar consultas
    INDEX idx_conversation_logs_user_id (user_id),
    INDEX idx_conversation_logs_timestamp (timestamp),
    INDEX idx_conversation_logs_intent (intent),
    INDEX idx_conversation_logs_success (success),
    INDEX idx_conversation_logs_user_timestamp (user_id, timestamp)
);

-- Crear índices adicionales para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_conversation_logs_user_success 
ON conversation_logs (user_id, success) 
WHERE success = true;

CREATE INDEX IF NOT EXISTS idx_conversation_logs_error 
ON conversation_logs (error) 
WHERE error IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversation_logs_processing_time 
ON conversation_logs (processing_time) 
WHERE processing_time > 0;

-- Comentarios para documentación
COMMENT ON TABLE conversation_logs IS 'Logs de interacciones del orquestador conversacional';
COMMENT ON COLUMN conversation_logs.id IS 'ID único del log de conversación';
COMMENT ON COLUMN conversation_logs.user_id IS 'ID del usuario que envió el mensaje';
COMMENT ON COLUMN conversation_logs.message IS 'Mensaje original del usuario';
COMMENT ON COLUMN conversation_logs.intent IS 'Intención detectada por Rasa';
COMMENT ON COLUMN conversation_logs.entities IS 'Entidades extraídas por Rasa (JSON)';
COMMENT ON COLUMN conversation_logs.action IS 'Acción ejecutada por el orquestador';
COMMENT ON COLUMN conversation_logs.rasa_response IS 'Respuesta completa de Rasa (JSON)';
COMMENT ON COLUMN conversation_logs.llm_response IS 'Respuesta generada por el LLM';
COMMENT ON COLUMN conversation_logs.api_calls IS 'Resultados de llamadas a APIs (JSON)';
COMMENT ON COLUMN conversation_logs.processing_time IS 'Tiempo de procesamiento en milisegundos';
COMMENT ON COLUMN conversation_logs.success IS 'Indica si el procesamiento fue exitoso';
COMMENT ON COLUMN conversation_logs.error IS 'Mensaje de error si el procesamiento falló';
COMMENT ON COLUMN conversation_logs.timestamp IS 'Fecha y hora del log';

-- Vista para estadísticas rápidas
CREATE OR REPLACE VIEW conversation_stats AS
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as total_conversations,
    COUNT(CASE WHEN success = true THEN 1 END) as successful_conversations,
    COUNT(CASE WHEN success = false THEN 1 END) as failed_conversations,
    ROUND(AVG(processing_time), 2) as avg_processing_time,
    COUNT(DISTINCT user_id) as unique_users
FROM conversation_logs
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Vista para errores más frecuentes
CREATE OR REPLACE VIEW error_stats AS
SELECT 
    error,
    COUNT(*) as error_count,
    MAX(timestamp) as last_occurrence,
    COUNT(DISTINCT user_id) as affected_users
FROM conversation_logs
WHERE error IS NOT NULL
GROUP BY error
ORDER BY error_count DESC;

-- Vista para intenciones más frecuentes
CREATE OR REPLACE VIEW intent_stats AS
SELECT 
    intent,
    COUNT(*) as intent_count,
    ROUND(AVG(processing_time), 2) as avg_processing_time,
    COUNT(CASE WHEN success = true THEN 1 END) as success_count,
    COUNT(CASE WHEN success = false THEN 1 END) as failure_count,
    ROUND(
        COUNT(CASE WHEN success = true THEN 1 END) * 100.0 / COUNT(*), 2
    ) as success_rate
FROM conversation_logs
GROUP BY intent
ORDER BY intent_count DESC;

-- Función para limpiar logs antiguos
CREATE OR REPLACE FUNCTION clean_old_conversation_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM conversation_logs 
    WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de un usuario específico
CREATE OR REPLACE FUNCTION get_user_conversation_stats(
    p_user_id VARCHAR(255),
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_conversations BIGINT,
    successful_conversations BIGINT,
    failed_conversations BIGINT,
    avg_processing_time NUMERIC,
    most_common_intent VARCHAR(100),
    last_conversation TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN success = true THEN 1 END) as successful_conversations,
        COUNT(CASE WHEN success = false THEN 1 END) as failed_conversations,
        ROUND(AVG(processing_time), 2) as avg_processing_time,
        (SELECT intent FROM conversation_logs 
         WHERE user_id = p_user_id 
         GROUP BY intent 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as most_common_intent,
        MAX(timestamp) as last_conversation
    FROM conversation_logs
    WHERE user_id = p_user_id 
    AND timestamp >= NOW() - INTERVAL '1 day' * p_days;
END;
$$ LANGUAGE plpgsql;

-- Insertar datos de ejemplo para testing (opcional)
-- INSERT INTO conversation_logs (id, user_id, message, intent, entities, action, rasa_response, llm_response, api_calls, processing_time, success, timestamp)
-- VALUES 
--     ('test_1', 'user_123', 'Hola, ¿cómo estás?', 'saludo', '[]', 'saludo', '{"intent": {"name": "saludo", "confidence": 0.95}}', '¡Hola! ¿En qué puedo ayudarte?', '[]', 150, true, NOW()),
--     ('test_2', 'user_123', 'Quiero agendar una cita', 'agendar_cita', '[{"entity": "fecha", "value": "mañana"}]', 'agendar_cita', '{"intent": {"name": "agendar_cita", "confidence": 0.88}}', 'Perfecto, ¿para qué fecha te gustaría agendar?', '[{"success": true, "data": {"available_slots": ["10:00", "14:00", "16:00"]}}]', 250, true, NOW());

-- Mostrar información de la tabla creada
SELECT 
    'conversation_logs' as table_name,
    COUNT(*) as total_logs,
    MIN(timestamp) as oldest_log,
    MAX(timestamp) as newest_log
FROM conversation_logs;
