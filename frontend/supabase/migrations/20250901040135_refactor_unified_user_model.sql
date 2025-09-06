-- ============================================================================
-- SOULPATH DATABASE REFACTOR MIGRATION
-- Unified User Model and Schema Consolidation
-- ============================================================================

-- Phase 1: Create new unified users table
-- ============================================================================

-- Create the new unified users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    
    -- Business-specific fields (formerly Client model)
    phone TEXT,
    status TEXT DEFAULT 'active',
    birth_date DATE,
    birth_time TIME(6),
    birth_place TEXT,
    question TEXT,
    language TEXT DEFAULT 'en',
    admin_notes TEXT,
    scheduled_date DATE,
    scheduled_time TIME(6),
    session_type TEXT,
    last_reminder_sent TIMESTAMPTZ(6),
    last_booking TIMESTAMPTZ(6),
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ(6) DEFAULT now(),
    updated_at TIMESTAMPTZ(6) DEFAULT now()
);

-- Create indexes for the users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Phase 2: Create new purchases table
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    transaction_id VARCHAR(255),
    notes TEXT,
    purchased_at TIMESTAMPTZ(6) DEFAULT now(),
    confirmed_at TIMESTAMPTZ(6),
    created_at TIMESTAMPTZ(6) DEFAULT now(),
    updated_at TIMESTAMPTZ(6) DEFAULT now()
);

-- Create indexes for purchases table
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_status ON purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_purchases_purchased_at ON purchases(purchased_at);

-- Phase 3: Migrate data from profiles and clients to users
-- ============================================================================

-- First, migrate profiles data
INSERT INTO users (id, email, full_name, avatar_url, role, created_at, updated_at)
SELECT 
    id, 
    email, 
    full_name, 
    avatar_url, 
    role, 
    created_at, 
    updated_at
FROM profiles
ON CONFLICT (email) DO NOTHING;

-- Then, migrate clients data (only if email doesn't already exist)
INSERT INTO users (id, email, full_name, phone, status, birth_date, birth_time, birth_place, question, language, admin_notes, scheduled_date, scheduled_time, session_type, last_reminder_sent, last_booking, notes, created_at, updated_at)
SELECT 
    gen_random_uuid()::text as id,
    email,
    name as full_name,
    phone,
    status,
    birth_date,
    birth_time,
    birth_place,
    question,
    language,
    admin_notes,
    scheduled_date,
    scheduled_time,
    session_type,
    last_reminder_sent,
    last_booking,
    notes,
    created_at,
    updated_at
FROM clients
WHERE email NOT IN (SELECT email FROM users);

-- Phase 4: Update user_packages table structure
-- ============================================================================

-- Add new columns to user_packages table
ALTER TABLE user_packages 
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS purchase_id INTEGER;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_user_packages_user_id ON user_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_packages_purchase_id ON user_packages(purchase_id);
CREATE INDEX IF NOT EXISTS idx_user_packages_active ON user_packages(is_active);

-- Phase 5: Create purchases from existing user_packages data
-- ============================================================================

-- Insert purchase records based on existing user_packages
INSERT INTO purchases (user_id, total_amount, currency_code, payment_method, payment_status, transaction_id, notes, purchased_at, confirmed_at, created_at, updated_at)
SELECT DISTINCT
    u.id as user_id,
    COALESCE(up.purchase_price, 0) as total_amount,
    'USD' as currency_code, -- Default currency, adjust as needed
    COALESCE(up.payment_method, 'unknown') as payment_method,
    COALESCE(up.payment_status, 'pending') as payment_status,
    NULL as transaction_id,
    NULL as notes,
    COALESCE(up.purchased_at, up.created_at) as purchased_at,
    up.payment_confirmed_at,
    up.created_at,
    up.updated_at
FROM user_packages up
JOIN users u ON u.email = up.user_email
WHERE up.user_email IS NOT NULL;

-- Phase 6: Update user_packages with new foreign keys
-- ============================================================================

-- Update user_id in user_packages
UPDATE user_packages 
SET user_id = u.id
FROM users u
WHERE user_packages.user_email = u.email
AND user_packages.user_id IS NULL;

-- Update purchase_id in user_packages
UPDATE user_packages 
SET purchase_id = p.id
FROM purchases p
WHERE user_packages.user_id = p.user_id
AND user_packages.purchased_at = p.purchased_at
AND user_packages.purchase_id IS NULL;

-- Phase 7: Update bookings table structure
-- ============================================================================

-- Add new columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS user_package_id INTEGER;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_package_id ON bookings(user_package_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Update user_id in bookings
UPDATE bookings 
SET user_id = u.id
FROM users u
WHERE bookings.client_email = u.email
AND bookings.user_id IS NULL;

-- Update user_package_id in bookings (this is a simplified mapping - you may need to adjust based on your business logic)
UPDATE bookings 
SET user_package_id = up.id
FROM user_packages up
WHERE bookings.user_id = up.user_id
AND bookings.user_package_id IS NULL
AND up.is_active = true
AND up.id = (
    SELECT up2.id 
    FROM user_packages up2 
    WHERE up2.user_id = bookings.user_id 
    AND up2.is_active = true 
    ORDER BY up2.created_at 
    LIMIT 1
);

-- Phase 8: Update payment_records table structure
-- ============================================================================

-- Add new columns to payment_records table
ALTER TABLE payment_records 
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS purchase_id INTEGER;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_purchase_id ON payment_records(purchase_id);

-- Update user_id in payment_records
UPDATE payment_records 
SET user_id = u.id
FROM users u
WHERE payment_records.client_email = u.email
AND payment_records.user_id IS NULL;

-- Update purchase_id in payment_records (link to the most recent purchase for the user)
UPDATE payment_records 
SET purchase_id = p.id
FROM purchases p
WHERE payment_records.user_id = p.user_id
AND payment_records.purchase_id IS NULL
AND p.purchased_at >= payment_records.created_at - INTERVAL '1 day'
AND p.purchased_at <= payment_records.created_at + INTERVAL '1 day';

-- Phase 9: Add foreign key constraints
-- ============================================================================

-- Add foreign key constraints for user_packages
DO $$ BEGIN
    ALTER TABLE user_packages 
    ADD CONSTRAINT fk_user_packages_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE user_packages 
    ADD CONSTRAINT fk_user_packages_purchase_id 
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add foreign key constraints for bookings
DO $$ BEGIN
    ALTER TABLE bookings 
    ADD CONSTRAINT fk_bookings_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE bookings 
    ADD CONSTRAINT fk_bookings_user_package_id 
    FOREIGN KEY (user_package_id) REFERENCES user_packages(id) ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add foreign key constraints for payment_records
DO $$ BEGIN
    ALTER TABLE payment_records 
    ADD CONSTRAINT fk_payment_records_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE payment_records 
    ADD CONSTRAINT fk_payment_records_purchase_id 
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Phase 10: Update bug reports to use new user model
-- ============================================================================

-- Update bug reports to reference users instead of profiles
UPDATE bug_reports 
SET reporter_id = u.id
FROM users u
WHERE bug_reports.reporter_id IN (SELECT id FROM profiles)
AND u.id = bug_reports.reporter_id;

UPDATE bug_reports 
SET assigned_to = u.id
FROM users u
WHERE bug_reports.assigned_to IN (SELECT id FROM profiles)
AND u.id = bug_reports.assigned_to;

-- Update bug comments to reference users
UPDATE bug_comments 
SET author_id = u.id
FROM users u
WHERE bug_comments.author_id IN (SELECT id FROM profiles)
AND u.id = bug_comments.author_id;

-- Phase 11: Clean up legacy tables (commented out for safety)
-- ============================================================================

-- NOTE: These operations should be performed after thorough testing
-- and verification that all data has been successfully migrated

-- Remove old foreign key constraints
-- ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_client_id;
-- ALTER TABLE user_packages DROP CONSTRAINT IF EXISTS fk_user_packages_client_id;
-- ALTER TABLE payment_records DROP CONSTRAINT IF EXISTS fk_payment_records_client_id;

-- Remove old columns (after ensuring new columns are working)
-- ALTER TABLE bookings DROP COLUMN IF EXISTS client_email;
-- ALTER TABLE bookings DROP COLUMN IF EXISTS client_id;
-- ALTER TABLE user_packages DROP COLUMN IF EXISTS user_email;
-- ALTER TABLE user_packages DROP COLUMN IF EXISTS client_id;
-- ALTER TABLE payment_records DROP COLUMN IF EXISTS client_email;
-- ALTER TABLE payment_records DROP COLUMN IF EXISTS client_id;

-- Drop legacy tables (after thorough testing)
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;

-- Phase 12: Create triggers for updated_at timestamps
-- ============================================================================

-- Create or replace function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DO $$ BEGIN
    CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_purchases_updated_at 
        BEFORE UPDATE ON purchases 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Phase 13: Data validation queries
-- ============================================================================

-- These queries can be run to validate the migration
-- Uncomment and run these after migration to verify data integrity

/*
-- Check for orphaned records
SELECT 'bookings without user_id' as issue, COUNT(*) as count 
FROM bookings WHERE user_id IS NULL
UNION ALL
SELECT 'user_packages without user_id' as issue, COUNT(*) as count 
FROM user_packages WHERE user_id IS NULL
UNION ALL
SELECT 'payment_records without user_id' as issue, COUNT(*) as count 
FROM payment_records WHERE user_id IS NULL;

-- Check for data consistency
SELECT 'users count' as metric, COUNT(*) as count FROM users
UNION ALL
SELECT 'purchases count' as metric, COUNT(*) as count FROM purchases
UNION ALL
SELECT 'user_packages with purchase_id' as metric, COUNT(*) as count FROM user_packages WHERE purchase_id IS NOT NULL;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
