-- Add new Brevo API fields to email_config table
ALTER TABLE email_config 
ADD COLUMN IF NOT EXISTS brevo_api_key TEXT,
ADD COLUMN IF NOT EXISTS sender_email TEXT,
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS admin_email TEXT;

-- Update existing records to have empty values for new fields
UPDATE email_config 
SET 
  brevo_api_key = COALESCE(brevo_api_key, ''),
  sender_email = COALESCE(sender_email, ''),
  sender_name = COALESCE(sender_name, ''),
  admin_email = COALESCE(admin_email, '')
WHERE brevo_api_key IS NULL 
   OR sender_email IS NULL 
   OR sender_name IS NULL 
   OR admin_email IS NULL;
