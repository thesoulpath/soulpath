-- ============================================================================
-- QUICK MIGRATION VALIDATION
-- Run this manually to verify the migration was successful
-- ============================================================================

-- Check 1: Verify new tables exist
SELECT 'NEW TABLES CHECK' as check_type;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'purchases')
ORDER BY table_name;

-- Check 2: Verify data migration
SELECT 'DATA MIGRATION CHECK' as check_type;
SELECT 'users count' as metric, COUNT(*) as count FROM users
UNION ALL
SELECT 'purchases count' as metric, COUNT(*) as count FROM purchases
UNION ALL
SELECT 'user_packages with user_id' as metric, COUNT(*) as count FROM user_packages WHERE user_id IS NOT NULL
UNION ALL
SELECT 'bookings with user_id' as metric, COUNT(*) as count FROM bookings WHERE user_id IS NOT NULL
UNION ALL
SELECT 'payment_records with user_id' as metric, COUNT(*) as count FROM payment_records WHERE user_id IS NOT NULL;

-- Check 3: Verify legacy tables are removed
SELECT 'LEGACY TABLES CHECK' as check_type;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'clients', 'schedules', 'soul_packages', 'group_bookings', 'session_usage')
ORDER BY table_name;

-- Check 4: Sample data verification
SELECT 'SAMPLE DATA CHECK' as check_type;
SELECT 'Sample Users' as data_type, id, email, full_name, status FROM users LIMIT 3;

-- Check 5: Foreign key relationships
SELECT 'FOREIGN KEY CHECK' as check_type;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('user_packages', 'bookings', 'payment_records', 'purchases')
ORDER BY tc.table_name, kcu.column_name;

-- Check 6: Views created
SELECT 'VIEWS CHECK' as check_type;
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('user_purchase_history', 'user_booking_summary', 'migration_verification')
ORDER BY viewname;

-- ============================================================================
-- VALIDATION COMPLETE
-- ============================================================================
