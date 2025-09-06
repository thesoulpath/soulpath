-- ============================================================================
-- SOULPATH MIGRATION VALIDATION SCRIPT
-- Run this after completing the migration to verify data integrity
-- ============================================================================

-- Check 1: Verify all users were migrated
-- ============================================================================
SELECT 'User Migration Check' as check_name;
SELECT 
    'Total users in new table' as metric,
    COUNT(*) as count 
FROM users;

-- Check 2: Verify no orphaned records
-- ============================================================================
SELECT 'Orphaned Records Check' as check_name;
SELECT 'bookings without user_id' as issue, COUNT(*) as count 
FROM bookings WHERE user_id IS NULL
UNION ALL
SELECT 'user_packages without user_id' as issue, COUNT(*) as count 
FROM user_packages WHERE user_id IS NULL
UNION ALL
SELECT 'payment_records without user_id' as issue, COUNT(*) as count 
FROM payment_records WHERE user_id IS NULL
UNION ALL
SELECT 'user_packages without purchase_id' as issue, COUNT(*) as count 
FROM user_packages WHERE purchase_id IS NULL
UNION ALL
SELECT 'payment_records without purchase_id' as issue, COUNT(*) as count 
FROM payment_records WHERE purchase_id IS NULL;

-- Check 3: Verify data consistency
-- ============================================================================
SELECT 'Data Consistency Check' as check_name;
SELECT 'users count' as metric, COUNT(*) as count FROM users
UNION ALL
SELECT 'purchases count' as metric, COUNT(*) as count FROM purchases
UNION ALL
SELECT 'user_packages with purchase_id' as metric, COUNT(*) as count FROM user_packages WHERE purchase_id IS NOT NULL
UNION ALL
SELECT 'bookings with user_id' as metric, COUNT(*) as count FROM bookings WHERE user_id IS NOT NULL
UNION ALL
SELECT 'payment_records with user_id' as metric, COUNT(*) as count FROM payment_records WHERE user_id IS NOT NULL;

-- Check 4: Verify foreign key relationships
-- ============================================================================
SELECT 'Foreign Key Check' as check_name;
SELECT 
    'user_packages with valid user_id' as check_type,
    COUNT(*) as valid_count
FROM user_packages up
JOIN users u ON up.user_id = u.id
UNION ALL
SELECT 
    'user_packages with valid purchase_id' as check_type,
    COUNT(*) as valid_count
FROM user_packages up
JOIN purchases p ON up.purchase_id = p.id
UNION ALL
SELECT 
    'bookings with valid user_id' as check_type,
    COUNT(*) as valid_count
FROM bookings b
JOIN users u ON b.user_id = u.id
UNION ALL
SELECT 
    'bookings with valid user_package_id' as check_type,
    COUNT(*) as valid_count
FROM bookings b
JOIN user_packages up ON b.user_package_id = up.id
UNION ALL
SELECT 
    'payment_records with valid user_id' as check_type,
    COUNT(*) as valid_count
FROM payment_records pr
JOIN users u ON pr.user_id = u.id
UNION ALL
SELECT 
    'payment_records with valid purchase_id' as check_type,
    COUNT(*) as valid_count
FROM payment_records pr
JOIN purchases p ON pr.purchase_id = p.id;

-- Check 5: Sample data verification
-- ============================================================================
SELECT 'Sample Data Verification' as check_name;

-- Show sample users
SELECT 'Sample Users' as data_type, id, email, full_name, status FROM users LIMIT 5;

-- Show sample purchases
SELECT 'Sample Purchases' as data_type, id, user_id, total_amount, payment_status FROM purchases LIMIT 5;

-- Show sample user packages
SELECT 'Sample User Packages' as data_type, id, user_id, purchase_id, sessions_used, is_active FROM user_packages LIMIT 5;

-- Show sample bookings
SELECT 'Sample Bookings' as data_type, id, user_id, user_package_id, status FROM bookings LIMIT 5;

-- Check 6: Verify no duplicate emails
-- ============================================================================
SELECT 'Duplicate Email Check' as check_name;
SELECT 
    email,
    COUNT(*) as count
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Check 7: Verify purchase amounts match
-- ============================================================================
SELECT 'Purchase Amount Verification' as check_name;
SELECT 
    p.id as purchase_id,
    p.total_amount as purchase_total,
    SUM(up.quantity * pp.price) as calculated_total,
    CASE 
        WHEN p.total_amount = SUM(up.quantity * pp.price) THEN 'MATCH'
        ELSE 'MISMATCH'
    END as status
FROM purchases p
JOIN user_packages up ON p.id = up.purchase_id
JOIN package_prices pp ON up.package_price_id = pp.id
GROUP BY p.id, p.total_amount
HAVING p.total_amount != SUM(up.quantity * pp.price);

-- Check 8: Verify session usage tracking
-- ============================================================================
SELECT 'Session Usage Verification' as check_name;
SELECT 
    up.id as user_package_id,
    up.sessions_used,
    COUNT(b.id) as actual_bookings,
    CASE 
        WHEN up.sessions_used = COUNT(b.id) THEN 'MATCH'
        ELSE 'MISMATCH'
    END as status
FROM user_packages up
LEFT JOIN bookings b ON up.id = b.user_package_id
GROUP BY up.id, up.sessions_used
HAVING up.sessions_used != COUNT(b.id);

-- Check 9: Summary report
-- ============================================================================
SELECT 'MIGRATION SUMMARY' as summary_type;
SELECT 
    'Total Records Migrated' as category,
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM purchases) as purchases,
    (SELECT COUNT(*) FROM user_packages) as user_packages,
    (SELECT COUNT(*) FROM bookings) as bookings,
    (SELECT COUNT(*) FROM payment_records) as payment_records;

-- Check 10: Performance verification
-- ============================================================================
SELECT 'Performance Check' as check_name;
EXPLAIN (ANALYZE, BUFFERS) 
SELECT u.email, u.full_name, COUNT(b.id) as booking_count
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
GROUP BY u.id, u.email, u.full_name
LIMIT 100;

-- ============================================================================
-- VALIDATION COMPLETE
-- ============================================================================
