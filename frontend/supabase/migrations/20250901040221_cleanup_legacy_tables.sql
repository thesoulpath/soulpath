-- ============================================================================
-- SOULPATH LEGACY TABLE CLEANUP MIGRATION
-- Remove legacy tables and columns after successful migration
-- ============================================================================

-- WARNING: This migration should only be run after thorough testing
-- and verification that all data has been successfully migrated to the new schema

-- Phase 1: Remove old foreign key constraints
-- ============================================================================

-- Remove old foreign key constraints from bookings table
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_client_id;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_currency_id;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_group_booking_tier_id;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_package_id;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_schedule_id;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_schedule_slot_id;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_user_package_id;

-- Remove old foreign key constraints from user_packages table
ALTER TABLE user_packages DROP CONSTRAINT IF EXISTS fk_user_packages_package_id;
ALTER TABLE user_packages DROP CONSTRAINT IF EXISTS fk_user_packages_package_definition_id;
ALTER TABLE user_packages DROP CONSTRAINT IF EXISTS fk_user_packages_client_id;

-- Remove old foreign key constraints from payment_records table
ALTER TABLE payment_records DROP CONSTRAINT IF EXISTS fk_payment_records_client_id;

-- Phase 2: Remove old columns from existing tables
-- ============================================================================

-- Remove old columns from bookings table
ALTER TABLE bookings DROP COLUMN IF EXISTS client_email;
ALTER TABLE bookings DROP COLUMN IF EXISTS client_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS session_date;
ALTER TABLE bookings DROP COLUMN IF EXISTS session_time;
ALTER TABLE bookings DROP COLUMN IF EXISTS schedule_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS start_time;
ALTER TABLE bookings DROP COLUMN IF EXISTS end_time;
ALTER TABLE bookings DROP COLUMN IF EXISTS cancelled_at;
ALTER TABLE bookings DROP COLUMN IF EXISTS cancelled_reason;
ALTER TABLE bookings DROP COLUMN IF EXISTS reminder_sent;
ALTER TABLE bookings DROP COLUMN IF EXISTS reminder_sent_at;
ALTER TABLE bookings DROP COLUMN IF EXISTS package_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS group_booking_tier_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS is_group_booking;
ALTER TABLE bookings DROP COLUMN IF EXISTS group_size;
ALTER TABLE bookings DROP COLUMN IF EXISTS total_amount;
ALTER TABLE bookings DROP COLUMN IF EXISTS currency_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS discount_amount;
ALTER TABLE bookings DROP COLUMN IF EXISTS final_amount;
ALTER TABLE bookings DROP COLUMN IF EXISTS schedule_slot_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS user_package_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS booking_type;

-- Remove old columns from user_packages table
ALTER TABLE user_packages DROP COLUMN IF EXISTS user_email;
ALTER TABLE user_packages DROP COLUMN IF EXISTS client_id;
ALTER TABLE user_packages DROP COLUMN IF EXISTS package_id;
ALTER TABLE user_packages DROP COLUMN IF EXISTS sessions_remaining;
ALTER TABLE user_packages DROP COLUMN IF EXISTS group_sessions_remaining;
ALTER TABLE user_packages DROP COLUMN IF EXISTS group_sessions_used;
ALTER TABLE user_packages DROP COLUMN IF EXISTS purchase_price;
ALTER TABLE user_packages DROP COLUMN IF EXISTS original_price;
ALTER TABLE user_packages DROP COLUMN IF EXISTS discount_applied;
ALTER TABLE user_packages DROP COLUMN IF EXISTS payment_method;
ALTER TABLE user_packages DROP COLUMN IF EXISTS payment_confirmed_at;
ALTER TABLE user_packages DROP COLUMN IF EXISTS payment_status;
ALTER TABLE user_packages DROP COLUMN IF EXISTS purchased_at;

-- Remove old columns from payment_records table
ALTER TABLE payment_records DROP COLUMN IF EXISTS client_email;
ALTER TABLE payment_records DROP COLUMN IF EXISTS client_id;
ALTER TABLE payment_records DROP COLUMN IF EXISTS user_package_id;
ALTER TABLE payment_records DROP COLUMN IF EXISTS group_booking_id;
ALTER TABLE payment_records DROP COLUMN IF EXISTS session_usage_id;

-- Phase 3: Remove old indexes
-- ============================================================================

-- Remove old indexes from bookings table
DROP INDEX IF EXISTS idx_bookings_client_email;
DROP INDEX IF EXISTS idx_bookings_date;
DROP INDEX IF EXISTS idx_bookings_booking_type;
DROP INDEX IF EXISTS idx_bookings_client_id;
DROP INDEX IF EXISTS idx_bookings_currency_id;
DROP INDEX IF EXISTS idx_bookings_group_booking_tier_id;
DROP INDEX IF EXISTS idx_bookings_package_id;
DROP INDEX IF EXISTS idx_bookings_schedule_id;
DROP INDEX IF EXISTS idx_bookings_schedule_slot_id;
DROP INDEX IF EXISTS idx_bookings_user_package_id;

-- Remove old indexes from user_packages table
DROP INDEX IF EXISTS idx_user_packages_client_id;
DROP INDEX IF EXISTS idx_user_packages_package_id;
DROP INDEX IF EXISTS idx_user_packages_payment_status;
DROP INDEX IF EXISTS idx_user_packages_purchased_at;
DROP INDEX IF EXISTS idx_user_packages_user_email;

-- Remove old indexes from payment_records table
DROP INDEX IF EXISTS idx_payment_records_client_email;
DROP INDEX IF EXISTS idx_payment_records_user_package_id;
DROP INDEX IF EXISTS idx_payment_records_group_booking_id;
DROP INDEX IF EXISTS idx_payment_records_session_usage_id;
DROP INDEX IF EXISTS idx_payment_records_client_id;

-- Phase 4: Drop legacy tables
-- ============================================================================

-- Drop legacy tables that are no longer needed
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS soul_packages CASCADE;
DROP TABLE IF EXISTS group_bookings CASCADE;
DROP TABLE IF EXISTS session_usage CASCADE;

-- Phase 5: Clean up any remaining legacy constraints
-- ============================================================================

-- Remove any remaining foreign key constraints that reference dropped tables
-- (These will be automatically dropped when the referenced tables are dropped)

-- Phase 6: Verify migration completion
-- ============================================================================

-- Create a view to verify the migration was successful
CREATE OR REPLACE VIEW migration_verification AS
SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
    'purchases' as table_name,
    COUNT(*) as record_count
FROM purchases
UNION ALL
SELECT 
    'user_packages' as table_name,
    COUNT(*) as record_count
FROM user_packages
UNION ALL
SELECT 
    'bookings' as table_name,
    COUNT(*) as record_count
FROM bookings
UNION ALL
SELECT 
    'payment_records' as table_name,
    COUNT(*) as record_count
FROM payment_records;

-- Phase 7: Create helpful views for the new schema
-- ============================================================================

-- Create a view for user purchase history
CREATE OR REPLACE VIEW user_purchase_history AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    p.id as purchase_id,
    p.total_amount,
    p.currency_code,
    p.payment_method,
    p.payment_status,
    p.purchased_at,
    COUNT(up.id) as packages_purchased,
    SUM(up.quantity) as total_quantity
FROM users u
JOIN purchases p ON u.id = p.user_id
LEFT JOIN user_packages up ON p.id = up.purchase_id
GROUP BY u.id, u.email, u.full_name, p.id, p.total_amount, p.currency_code, p.payment_method, p.payment_status, p.purchased_at
ORDER BY p.purchased_at DESC;

-- Create a view for user booking summary
CREATE OR REPLACE VIEW user_booking_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    COUNT(b.id) as total_bookings,
    COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
    COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
    MAX(b.created_at) as last_booking_date
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
GROUP BY u.id, u.email, u.full_name;

-- ============================================================================
-- CLEANUP MIGRATION COMPLETE
-- ============================================================================
