-- Migrate from old email_config to new communication system
-- This migration preserves existing data while creating the new structure

-- Create communication_config table
CREATE TABLE IF NOT EXISTS communication_config (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Email Configuration
    email_enabled BOOLEAN DEFAULT true,
    brevo_api_key VARCHAR(255) DEFAULT '',
    sender_email VARCHAR(255) DEFAULT 'noreply@soulpath.lat',
    sender_name VARCHAR(255) DEFAULT 'SOULPATH',
    admin_email VARCHAR(255) DEFAULT 'admin@soulpath.lat',
    
    -- SMS Configuration
    sms_enabled BOOLEAN DEFAULT false,
    sms_provider VARCHAR(50) DEFAULT 'labsmobile',
    labsmobile_username VARCHAR(255) DEFAULT '',
    labsmobile_token VARCHAR(255) DEFAULT '',
    sms_sender_name VARCHAR(255) DEFAULT 'SoulPath'
);

-- Create communication_templates table
CREATE TABLE IF NOT EXISTS communication_templates (
    id SERIAL PRIMARY KEY,
    template_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(10) NOT NULL CHECK (type IN ('email', 'sms')),
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create communication_template_translations table
CREATE TABLE IF NOT EXISTS communication_template_translations (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES communication_templates(id) ON DELETE CASCADE,
    language VARCHAR(5) NOT NULL CHECK (language IN ('en', 'es')),
    subject VARCHAR(255),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(template_id, language)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_communication_templates_type ON communication_templates(type);
CREATE INDEX IF NOT EXISTS idx_communication_templates_category ON communication_templates(category);
CREATE INDEX IF NOT EXISTS idx_communication_templates_active ON communication_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_template_translations_language ON communication_template_translations(language);

-- Migrate data from email_config to communication_config if email_config exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_config') THEN
        INSERT INTO communication_config (
            email_enabled,
            brevo_api_key,
            sender_email,
            sender_name,
            admin_email,
            sms_enabled,
            sms_provider,
            labsmobile_username,
            labsmobile_token,
            sms_sender_name
        )
        SELECT 
            true as email_enabled,
            COALESCE(brevo_api_key, '') as brevo_api_key,
            COALESCE(sender_email, 'noreply@soulpath.lat') as sender_email,
            COALESCE(sender_name, 'SOULPATH') as sender_name,
            COALESCE(admin_email, 'admin@soulpath.lat') as admin_email,
            COALESCE(sms_enabled, false) as sms_enabled,
            COALESCE(sms_provider, 'labsmobile') as sms_provider,
            COALESCE(labsmobile_username, '') as labsmobile_username,
            COALESCE(labsmobile_token, '') as labsmobile_token,
            COALESCE(sms_sender_name, 'SoulPath') as sms_sender_name
        FROM email_config
        WHERE id = 1
        ON CONFLICT (id) DO NOTHING;
    ELSE
        -- Insert default configuration if no email_config exists
        INSERT INTO communication_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Migrate email templates to new system if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates') THEN
        -- Insert email templates
        INSERT INTO communication_templates (template_key, name, description, type, category, is_default)
        SELECT 
            template_key,
            CASE 
                WHEN template_key LIKE '%_en' THEN REPLACE(REPLACE(template_key, '_en', ''), '_', ' ')
                WHEN template_key LIKE '%_es' THEN REPLACE(REPLACE(template_key, '_es', ''), '_', ' ')
                ELSE template_key
            END as name,
            'Migrated from old system' as description,
            'email' as type,
            CASE 
                WHEN template_key LIKE '%booking%' THEN 'booking'
                WHEN template_key LIKE '%reminder%' THEN 'reminder'
                WHEN template_key LIKE '%cancellation%' THEN 'booking'
                ELSE 'notification'
            END as category,
            true as is_default
        FROM email_templates
        WHERE template_key NOT LIKE '%_es' -- Only insert English versions as base templates
        ON CONFLICT (template_key) DO NOTHING;

        -- Insert template translations
        INSERT INTO communication_template_translations (template_id, language, subject, content)
        SELECT 
            ct.id as template_id,
            CASE 
                WHEN et.template_key LIKE '%_en' THEN 'en'
                WHEN et.template_key LIKE '%_es' THEN 'es'
                ELSE 'en'
            END as language,
            et.subject,
            et.body as content
        FROM email_templates et
        JOIN communication_templates ct ON 
            CASE 
                WHEN et.template_key LIKE '%_en' THEN ct.template_key = REPLACE(et.template_key, '_en', '')
                WHEN et.template_key LIKE '%_es' THEN ct.template_key = REPLACE(et.template_key, '_es', '')
                ELSE ct.template_key = et.template_key
            END
        ON CONFLICT (template_id, language) DO NOTHING;
    END IF;
END $$;

-- Insert default templates if none exist
INSERT INTO communication_templates (template_key, name, description, type, category, is_default) VALUES
('booking_confirmation', 'Booking Confirmation', 'Sent when a booking is confirmed', 'email', 'booking', true),
('booking_reminder', 'Booking Reminder', 'Sent as a reminder before the session', 'email', 'reminder', true),
('booking_cancellation', 'Booking Cancellation', 'Sent when a booking is cancelled', 'email', 'booking', true),
('otp_verification', 'OTP Verification', 'SMS sent for phone number verification', 'sms', 'verification', true),
('booking_confirmation_sms', 'Booking Confirmation SMS', 'SMS sent when a booking is confirmed', 'sms', 'booking', true)
ON CONFLICT (template_key) DO NOTHING;

-- Insert default template translations if none exist
INSERT INTO communication_template_translations (template_id, language, subject, content) VALUES
-- Booking Confirmation Email (EN)
((SELECT id FROM communication_templates WHERE template_key = 'booking_confirmation'), 'en', 
 'Booking Confirmation - SOULPATH',
 '<h2>Your Session is Confirmed!</h2>
 <p>Dear {{userName}},</p>
 <p>Your SoulPath session has been confirmed for <strong>{{bookingDate}}</strong> at <strong>{{bookingTime}}</strong>.</p>
 <p>Session Details:</p>
 <ul>
   <li><strong>Date:</strong> {{bookingDate}}</li>
   <li><strong>Time:</strong> {{bookingTime}}</li>
   <li><strong>Type:</strong> {{sessionType}}</li>
   <li><strong>Language:</strong> {{language}}</li>
 </ul>
 {{#if videoConferenceLink}}
 <p>Join your session here: <a href="{{videoConferenceLink}}">{{videoConferenceLink}}</a></p>
 {{/if}}
 <p>We look forward to connecting with you!</p>
 <p>Best regards,<br>The SoulPath Team</p>'),

-- Booking Confirmation Email (ES)
((SELECT id FROM communication_templates WHERE template_key = 'booking_confirmation'), 'es',
 'Confirmación de Cita - SOULPATH',
 '<h2>¡Tu Sesión está Confirmada!</h2>
 <p>Estimado/a {{userName}},</p>
 <p>Tu sesión de SoulPath ha sido confirmada para el <strong>{{bookingDate}}</strong> a las <strong>{{bookingTime}}</strong>.</p>
 <p>Detalles de la Sesión:</p>
 <ul>
   <li><strong>Fecha:</strong> {{bookingDate}}</li>
   <li><strong>Hora:</strong> {{bookingTime}}</li>
   <li><strong>Tipo:</strong> {{sessionType}}</li>
   <li><strong>Idioma:</strong> {{language}}</li>
 </ul>
 {{#if videoConferenceLink}}
 <p>Únete a tu sesión aquí: <a href="{{videoConferenceLink}}">{{videoConferenceLink}}</a></p>
 {{/if}}
 <p>¡Esperamos conectar contigo!</p>
 <p>Saludos cordiales,<br>El Equipo de SoulPath</p>'),

-- OTP Verification SMS (EN)
((SELECT id FROM communication_templates WHERE template_key = 'otp_verification'), 'en',
 NULL,
 'Your SoulPath verification code is: {{otpCode}}. This code expires in {{expiryTime}}.'),

-- OTP Verification SMS (ES)
((SELECT id FROM communication_templates WHERE template_key = 'otp_verification'), 'es',
 NULL,
 'Su código de verificación de SoulPath es: {{otpCode}}. Este código expira en {{expiryTime}}.'),

-- Booking Confirmation SMS (EN)
((SELECT id FROM communication_templates WHERE template_key = 'booking_confirmation_sms'), 'en',
 NULL,
 'Your SoulPath session is confirmed for {{bookingDate}} at {{bookingTime}}. We look forward to seeing you!'),

-- Booking Confirmation SMS (ES)
((SELECT id FROM communication_templates WHERE template_key = 'booking_confirmation_sms'), 'es',
 NULL,
 'Su sesión de SoulPath está confirmada para el {{bookingDate}} a las {{bookingTime}}. ¡Esperamos verte!')
ON CONFLICT (template_id, language) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE communication_config IS 'Configuration for email and SMS communication services';
COMMENT ON TABLE communication_templates IS 'Template definitions for email and SMS communications';
COMMENT ON TABLE communication_template_translations IS 'Translations for communication templates in different languages';

COMMENT ON COLUMN communication_config.email_enabled IS 'Whether email service is enabled';
COMMENT ON COLUMN communication_config.brevo_api_key IS 'Brevo API key for email service';
COMMENT ON COLUMN communication_config.sms_enabled IS 'Whether SMS service is enabled';
COMMENT ON COLUMN communication_config.labsmobile_username IS 'LabsMobile username for SMS service';
COMMENT ON COLUMN communication_config.labsmobile_token IS 'LabsMobile API token for SMS service';

COMMENT ON COLUMN communication_templates.template_key IS 'Unique key to reference the template in code';
COMMENT ON COLUMN communication_templates.type IS 'Type of template: email or sms';
COMMENT ON COLUMN communication_templates.category IS 'Category for organizing templates';
COMMENT ON COLUMN communication_templates.is_default IS 'Whether this is a default system template';

COMMENT ON COLUMN communication_template_translations.language IS 'Language code: en or es';
COMMENT ON COLUMN communication_template_translations.subject IS 'Email subject (only for email templates)';
COMMENT ON COLUMN communication_template_translations.content IS 'Template content (HTML for email, plain text for SMS)';

