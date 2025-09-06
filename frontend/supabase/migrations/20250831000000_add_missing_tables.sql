-- Add missing tables for SOULPATH application
-- This migration adds the tables that the Prisma schema expects

-- 1. Create currencies table
CREATE TABLE IF NOT EXISTS currencies (
  id SERIAL PRIMARY KEY,
  code VARCHAR(3) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(5) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  exchange_rate DECIMAL(10, 6) DEFAULT 1.000000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create session_durations table
CREATE TABLE IF NOT EXISTS session_durations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create package_definitions table
CREATE TABLE IF NOT EXISTS package_definitions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sessions_count INTEGER NOT NULL,
  session_duration_id INTEGER NOT NULL,
  package_type VARCHAR(20) NOT NULL,
  max_group_size INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (session_duration_id) REFERENCES session_durations(id) ON DELETE CASCADE
);

-- 4. Create package_prices table
CREATE TABLE IF NOT EXISTS package_prices (
  id SERIAL PRIMARY KEY,
  package_definition_id INTEGER NOT NULL,
  currency_id INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  pricing_mode VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (package_definition_id) REFERENCES package_definitions(id) ON DELETE CASCADE,
  FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE CASCADE,
  UNIQUE(package_definition_id, currency_id)
);

-- 5. Create schedule_templates table
CREATE TABLE IF NOT EXISTS schedule_templates (
  id SERIAL PRIMARY KEY,
  day_of_week VARCHAR(20) NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  capacity INTEGER DEFAULT 3,
  is_available BOOLEAN DEFAULT true,
  session_duration_id INTEGER,
  auto_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (session_duration_id) REFERENCES session_durations(id)
);

-- 6. Create schedule_slots table
CREATE TABLE IF NOT EXISTS schedule_slots (
  id SERIAL PRIMARY KEY,
  schedule_template_id INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  capacity INTEGER DEFAULT 3,
  booked_count INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (schedule_template_id) REFERENCES schedule_templates(id) ON DELETE CASCADE
);

-- 7. Create user_packages table
CREATE TABLE IF NOT EXISTS user_packages (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  package_price_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  sessions_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  payment_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (package_price_id) REFERENCES package_prices(id) ON DELETE CASCADE
);

-- 8. Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  currency_id INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE CASCADE
);

-- 9. Create payment_records table
CREATE TABLE IF NOT EXISTS payment_records (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  user_package_id INTEGER,
  amount DECIMAL(10, 2) NOT NULL,
  currency_id INTEGER NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_package_id) REFERENCES user_packages(id) ON DELETE SET NULL,
  FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE CASCADE
);

-- 10. Create rates table
CREATE TABLE IF NOT EXISTS rates (
  id SERIAL PRIMARY KEY,
  currency_id INTEGER NOT NULL,
  session_duration_id INTEGER NOT NULL,
  session_type VARCHAR(50) NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  group_discount_percent DECIMAL(5, 2) DEFAULT 0,
  min_group_size INTEGER DEFAULT 1,
  max_group_size INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE CASCADE,
  FOREIGN KEY (session_duration_id) REFERENCES session_durations(id) ON DELETE CASCADE,
  UNIQUE(currency_id, session_duration_id, session_type)
);

-- Insert initial data
INSERT INTO currencies (code, name, symbol, is_default) VALUES
('USD', 'US Dollar', '$', true),
('EUR', 'Euro', '€', false),
('GBP', 'British Pound', '£', false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO session_durations (name, duration_minutes, description) VALUES
('Standard Session', 60, 'Standard 1-hour wellness session'),
('Extended Session', 90, 'Extended 1.5-hour wellness session'),
('Quick Session', 30, 'Quick 30-minute wellness session')
ON CONFLICT (id) DO NOTHING;

INSERT INTO package_definitions (name, description, sessions_count, session_duration_id, package_type) VALUES
('Basic Package', 'Basic wellness package with 3 sessions', 3, 1, 'individual'),
('Premium Package', 'Premium wellness package with 6 sessions', 6, 1, 'individual'),
('Group Package', 'Group wellness package with 5 sessions', 5, 1, 'group')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_package_definitions_active ON package_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_package_prices_currency ON package_prices(currency_id);
CREATE INDEX IF NOT EXISTS idx_schedule_templates_day ON schedule_templates(day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_start_time ON schedule_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_user_packages_client_id ON user_packages(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_client_id ON payment_records(client_id);

-- Enable Row Level Security (RLS)
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_durations ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE rates ENABLE ROW LEVEL SECURITY;
