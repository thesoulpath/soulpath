-- Add SMS Configuration and OTP Verification tables
-- This script adds the new SMS-related tables to the existing database

-- Create SMS Configuration table
CREATE TABLE IF NOT EXISTS sms_configurations (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL DEFAULT 'labsmobile',
    username VARCHAR(255) NOT NULL,
    token_api VARCHAR(255) NOT NULL,
    sender_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- Create OTP Verification table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    phone_number VARCHAR(20) NOT NULL,
    country_code VARCHAR(5) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMPTZ(6) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_otp_verifications_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE 
        ON UPDATE RESTRICT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone ON otp_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_user ON otp_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires ON otp_verifications(expires_at);

-- Add comment to tables
COMMENT ON TABLE sms_configurations IS 'SMS service configuration for OTP verification';
COMMENT ON TABLE otp_verifications IS 'OTP verification codes for phone number verification';

-- Add comments to columns
COMMENT ON COLUMN sms_configurations.provider IS 'SMS service provider (labsmobile, twilio, etc.)';
COMMENT ON COLUMN sms_configurations.username IS 'LabsMobile username';
COMMENT ON COLUMN sms_configurations.token_api IS 'LabsMobile API token';
COMMENT ON COLUMN sms_configurations.sender_name IS 'SMS sender name';
COMMENT ON COLUMN sms_configurations.is_active IS 'Whether SMS service is active';

COMMENT ON COLUMN otp_verifications.user_id IS 'User ID if verification is for existing user';
COMMENT ON COLUMN otp_verifications.phone_number IS 'Phone number to verify';
COMMENT ON COLUMN otp_verifications.country_code IS 'Country code for phone number';
COMMENT ON COLUMN otp_verifications.otp_code IS 'OTP verification code';
COMMENT ON COLUMN otp_verifications.is_verified IS 'Whether OTP has been verified';
COMMENT ON COLUMN otp_verifications.expires_at IS 'When the OTP expires';
COMMENT ON COLUMN otp_verifications.attempts IS 'Number of verification attempts';
COMMENT ON COLUMN otp_verifications.max_attempts IS 'Maximum allowed verification attempts';
