-- Add SMS/Labsmobile configuration fields to email_config table
-- This migration integrates SMS configuration into the unified communication settings

-- Add SMS configuration columns to email_config table
ALTER TABLE email_config 
ADD COLUMN IF NOT EXISTS sms_provider VARCHAR(50) DEFAULT 'labsmobile',
ADD COLUMN IF NOT EXISTS labsmobile_username VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS labsmobile_token VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS sms_sender_name VARCHAR(100) DEFAULT 'SoulPath',
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN email_config.sms_provider IS 'SMS service provider (labsmobile, twilio, etc.)';
COMMENT ON COLUMN email_config.labsmobile_username IS 'LabsMobile username for SMS API';
COMMENT ON COLUMN email_config.labsmobile_token IS 'LabsMobile API token for SMS service';
COMMENT ON COLUMN email_config.sms_sender_name IS 'Name displayed as SMS sender';
COMMENT ON COLUMN email_config.sms_enabled IS 'Whether SMS service is enabled';

-- Update existing email_config record with default SMS values if it exists
UPDATE email_config 
SET 
  sms_provider = 'labsmobile',
  labsmobile_username = '',
  labsmobile_token = '',
  sms_sender_name = 'SoulPath',
  sms_enabled = false
WHERE id = 1;

-- Create index for SMS enabled status for better query performance
CREATE INDEX IF NOT EXISTS idx_email_config_sms_enabled ON email_config(sms_enabled);
