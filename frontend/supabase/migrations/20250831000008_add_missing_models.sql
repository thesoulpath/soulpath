-- Add missing models to match Prisma schema
-- This migration adds all the models that are in the Prisma schema but missing from the database

-- 1. Add SoulPackage table (if not exists)
CREATE TABLE IF NOT EXISTS soul_packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  sessions_count INTEGER NOT NULL,
  session_duration_id INTEGER NOT NULL,
  currency_id INTEGER NOT NULL,
  package_price DECIMAL(10, 2) NOT NULL,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  package_type VARCHAR(20) DEFAULT 'individual',
  max_group_size INTEGER,
  FOREIGN KEY (session_duration_id) REFERENCES session_durations(id) ON DELETE CASCADE,
  FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE CASCADE
);

-- 2. Add GroupBooking table (if not exists)
CREATE TABLE IF NOT EXISTS group_bookings (
  id SERIAL PRIMARY KEY,
  client_email TEXT NOT NULL,
  user_package_id INTEGER NOT NULL,
  schedule_id INTEGER NOT NULL,
  group_size INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  notes TEXT,
  session_date DATE NOT NULL,
  session_time TIME(6) NOT NULL,
  total_cost DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  FOREIGN KEY (client_email) REFERENCES clients(email) ON DELETE CASCADE,
  FOREIGN KEY (user_package_id) REFERENCES user_packages(id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

-- 3. Add SessionUsage table (if not exists)
CREATE TABLE IF NOT EXISTS session_usage (
  id SERIAL PRIMARY KEY,
  client_email TEXT NOT NULL,
  user_package_id INTEGER NOT NULL,
  session_date DATE NOT NULL,
  session_time TIME(6) NOT NULL,
  session_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'completed',
  notes TEXT,
  cost DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  FOREIGN KEY (client_email) REFERENCES clients(email) ON DELETE CASCADE,
  FOREIGN KEY (user_package_id) REFERENCES user_packages(id) ON DELETE CASCADE
);

-- 4. Add group_booking_tiers table (if not exists)
CREATE TABLE IF NOT EXISTS group_booking_tiers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  min_participants INTEGER NOT NULL,
  max_participants INTEGER NOT NULL,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Add kv_store table (if not exists)
CREATE TABLE IF NOT EXISTS kv_store_f839855f (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- 6. Add soultpath table (if not exists)
CREATE TABLE IF NOT EXISTS soultpath (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Add BugStatus enum (if not exists)
DO $$ BEGIN
    CREATE TYPE bug_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 8. Add Priority enum (if not exists)
DO $$ BEGIN
    CREATE TYPE priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 9. Add BugReport table (if not exists)
CREATE TABLE IF NOT EXISTS bug_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  screenshot TEXT,
  status bug_status DEFAULT 'OPEN',
  priority priority DEFAULT 'MEDIUM',
  category VARCHAR(100),
  reporter_id TEXT,
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (reporter_id) REFERENCES profiles(id),
  FOREIGN KEY (assigned_to) REFERENCES profiles(id)
);

-- 10. Add BugComment table (if not exists)
CREATE TABLE IF NOT EXISTS bug_comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  bug_report_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (author_id) REFERENCES profiles(id),
  FOREIGN KEY (bug_report_id) REFERENCES bug_reports(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_soul_packages_currency ON soul_packages(currency_id);
CREATE INDEX IF NOT EXISTS idx_soul_packages_type ON soul_packages(package_type);
CREATE INDEX IF NOT EXISTS idx_group_bookings_client_email ON group_bookings(client_email);
CREATE INDEX IF NOT EXISTS idx_group_bookings_package_id ON group_bookings(user_package_id);
CREATE INDEX IF NOT EXISTS idx_group_bookings_schedule_id ON group_bookings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_group_bookings_session_date ON group_bookings(session_date);
CREATE INDEX IF NOT EXISTS idx_group_bookings_payment_status ON group_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_session_usage_client_email ON session_usage(client_email);
CREATE INDEX IF NOT EXISTS idx_session_usage_package_id ON session_usage(user_package_id);
CREATE INDEX IF NOT EXISTS idx_session_usage_session_date ON session_usage(session_date);
CREATE INDEX IF NOT EXISTS idx_session_usage_payment_status ON session_usage(payment_status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_priority ON bug_reports(priority);
CREATE INDEX IF NOT EXISTS idx_bug_reports_reporter ON bug_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_assignee ON bug_reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created ON bug_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_bug_comments_bug_report ON bug_comments(bug_report_id);
CREATE INDEX IF NOT EXISTS idx_bug_comments_author ON bug_comments(author_id);

-- Add comments to document the tables
COMMENT ON TABLE soul_packages IS 'Legacy soul packages for backward compatibility';
COMMENT ON TABLE group_bookings IS 'Group booking records';
COMMENT ON TABLE session_usage IS 'Session usage tracking';
COMMENT ON TABLE group_booking_tiers IS 'Group booking discount tiers';
COMMENT ON TABLE bug_reports IS 'Bug report system';
COMMENT ON TABLE bug_comments IS 'Bug report comments';

-- Success message
SELECT 'All missing models added successfully!' as message;
