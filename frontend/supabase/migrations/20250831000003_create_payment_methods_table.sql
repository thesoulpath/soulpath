-- Create payment_methods table if it doesn't exist
-- This migration ensures the payment_methods table exists with all required fields

-- Create the payment_method_configs table
CREATE TABLE IF NOT EXISTS payment_method_configs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) DEFAULT 'custom',
  description TEXT,
  icon VARCHAR(100),
  requires_confirmation BOOLEAN DEFAULT false,
  auto_assign_package BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- No foreign key constraints needed for payment_method_configs

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_method_configs_name ON payment_method_configs(name);
CREATE INDEX IF NOT EXISTS idx_payment_method_configs_type ON payment_method_configs(type);
CREATE INDEX IF NOT EXISTS idx_payment_method_configs_active ON payment_method_configs(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE payment_method_configs ENABLE ROW LEVEL SECURITY;

-- Add comment to document the table structure
COMMENT ON TABLE payment_method_configs IS 'Payment methods configuration table with support for various payment types and settings';

-- Insert some default payment methods if the table is empty
INSERT INTO payment_method_configs (name, type, description, icon, requires_confirmation, auto_assign_package, is_active) 
SELECT 'Cash', 'cash', 'Cash payment', '💵', false, true, true
WHERE NOT EXISTS (SELECT 1 FROM payment_method_configs WHERE name = 'Cash');

INSERT INTO payment_method_configs (name, type, description, icon, requires_confirmation, auto_assign_package, is_active) 
SELECT 'Bank Transfer', 'bank_transfer', 'Bank transfer payment', '🏦', true, true, true
WHERE NOT EXISTS (SELECT 1 FROM payment_method_configs WHERE name = 'Bank Transfer');

INSERT INTO payment_method_configs (name, type, description, icon, requires_confirmation, auto_assign_package, is_active) 
SELECT 'Credit Card', 'credit_card', 'Credit card payment', '💳', false, true, true
WHERE NOT EXISTS (SELECT 1 FROM payment_method_configs WHERE name = 'Credit Card');
