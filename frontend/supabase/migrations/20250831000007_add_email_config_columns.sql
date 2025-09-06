-- Add missing columns to email_config table to match Prisma schema
-- This migration adds the brevo_api_key, sender_email, sender_name, and admin_email columns

-- Add brevo_api_key column
ALTER TABLE email_config 
ADD COLUMN IF NOT EXISTS brevo_api_key TEXT DEFAULT '';

-- Add sender_email column
ALTER TABLE email_config 
ADD COLUMN IF NOT EXISTS sender_email TEXT DEFAULT 'noreply@soulpath.lat';

-- Add sender_name column
ALTER TABLE email_config 
ADD COLUMN IF NOT EXISTS sender_name TEXT DEFAULT 'SOULPATH';

-- Add admin_email column
ALTER TABLE email_config 
ADD COLUMN IF NOT EXISTS admin_email TEXT DEFAULT 'admin@soulpath.lat';

-- Add comments to document the changes
COMMENT ON COLUMN email_config.brevo_api_key IS 'Brevo API key for email service';
COMMENT ON COLUMN email_config.sender_email IS 'Sender email address for outgoing emails';
COMMENT ON COLUMN email_config.sender_name IS 'Sender name for outgoing emails';
COMMENT ON COLUMN email_config.admin_email IS 'Admin email for notifications';

-- Success message
SELECT 'Email config columns added successfully!' as message;
