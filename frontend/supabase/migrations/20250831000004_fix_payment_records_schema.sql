-- Fix payment_records table schema to match API expectations
-- This migration updates the payment_records table to have the correct field names

-- Drop the existing payment_records table if it exists
DROP TABLE IF EXISTS payment_records CASCADE;

-- Recreate the payment_records table with the correct schema
CREATE TABLE payment_records (
  id SERIAL PRIMARY KEY,
  client_email VARCHAR(255) NOT NULL,
  user_package_id INTEGER,
  group_booking_id INTEGER,
  session_usage_id INTEGER,
  amount DECIMAL(10, 2) NOT NULL,
  currency_code VARCHAR(3) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  transaction_id VARCHAR(255),
  notes TEXT,
  payment_date DATE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Legacy field for backward compatibility
  client_id INTEGER
);

-- Create indexes for better performance
CREATE INDEX idx_payment_records_client_email ON payment_records(client_email);
CREATE INDEX idx_payment_records_payment_status ON payment_records(payment_status);
CREATE INDEX idx_payment_records_payment_method ON payment_records(payment_method);
CREATE INDEX idx_payment_records_created_at ON payment_records(created_at);
CREATE INDEX idx_payment_records_user_package_id ON payment_records(user_package_id);
CREATE INDEX idx_payment_records_group_booking_id ON payment_records(group_booking_id);
CREATE INDEX idx_payment_records_session_usage_id ON payment_records(session_usage_id);
CREATE INDEX idx_payment_records_client_id ON payment_records(client_id);

-- Enable Row Level Security (RLS)
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Add comment to document the table structure
COMMENT ON TABLE payment_records IS 'Payment records table with support for both legacy and new client identification methods';
