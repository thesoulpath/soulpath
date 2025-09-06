-- Database Performance Optimization Script
-- Run this script to optimize database performance for the full-page scroll website

-- ============================================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_status_created ON bookings(user_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_schedule_start ON bookings(schedule_slot_id, created_at);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_template_time ON schedule_slots(schedule_template_id, start_time);
CREATE INDEX IF NOT EXISTS idx_user_packages_user_active_expires ON user_packages(user_id, is_active, expires_at);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_users_full_name_search ON users USING gin(to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_package_definitions_name_search ON package_definitions USING gin(to_tsvector('english', name || ' ' || description));

-- ============================================================================
-- QUERY OPTIMIZATION - MATERIALIZED VIEWS
-- ============================================================================

-- Materialized view for dashboard statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT
  u.id as user_id,
  u.email,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'confirmed' AND b.created_at > NOW() - INTERVAL '7 days' THEN b.id END) as upcoming_bookings,
  COUNT(DISTINCT CASE WHEN up.id IS NOT NULL AND up.is_active = true THEN up.id END) as active_packages,
  COALESCE(SUM(p.total_amount), 0) as total_spent,
  AVG(CASE WHEN b.rating IS NOT NULL THEN b.rating END) as avg_rating
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
LEFT JOIN user_packages up ON u.id = up.user_id AND up.is_active = true
LEFT JOIN purchases p ON u.id = p.user_id AND p.payment_status = 'completed'
GROUP BY u.id, u.email;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_user ON dashboard_stats(user_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CONNECTION POOLING OPTIMIZATION
-- ============================================================================

-- Set connection limits for better performance
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.max = 10000;
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- ============================================================================
-- CACHE OPTIMIZATION
-- ============================================================================

-- Increase shared buffers for better caching
ALTER SYSTEM SET shared_buffers = '256MB';

-- Increase work memory for complex queries
ALTER SYSTEM SET work_mem = '4MB';

-- Increase maintenance work memory for index creation
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- ============================================================================
-- MONITORING AND LOGGING
-- ============================================================================

-- Enable query logging for performance monitoring
ALTER SYSTEM SET log_statement = 'ddl';
ALTER SYSTEM SET log_duration = 'on';
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- ============================================================================
-- VACUUM AND ANALYZE OPTIMIZATION
-- ============================================================================

-- Set autovacuum parameters for better maintenance
ALTER SYSTEM SET autovacuum = 'on';
ALTER SYSTEM SET autovacuum_max_workers = '3';
ALTER SYSTEM SET autovacuum_naptime = '20s';
ALTER SYSTEM SET autovacuum_vacuum_threshold = '50';
ALTER SYSTEM SET autovacuum_analyze_threshold = '50';
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = '0.02';
ALTER SYSTEM SET autovacuum_analyze_scale_factor = '0.01';

-- ============================================================================
-- PERFORMANCE MONITORING QUERIES
-- ============================================================================

-- Query to monitor slow queries
CREATE OR REPLACE VIEW slow_queries AS
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows,
  shared_blks_hit,
  shared_blks_read,
  temp_blks_written
FROM pg_stat_statements
WHERE mean_time > 1000  -- Queries taking more than 1 second on average
ORDER BY mean_time DESC
LIMIT 20;

-- Query to monitor index usage
CREATE OR REPLACE VIEW index_usage AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- ============================================================================
-- CLEANUP SCRIPT
-- ============================================================================

-- Function to clean up old data (optional)
CREATE OR REPLACE FUNCTION cleanup_old_data(days_old INTEGER DEFAULT 365)
RETURNS void AS $$
BEGIN
  -- Delete old OTP verifications
  DELETE FROM otp_verifications WHERE created_at < NOW() - INTERVAL '1 day';

  -- Archive old bug reports (optional - uncomment if needed)
  -- UPDATE bug_reports SET status = 'ARCHIVED' WHERE created_at < NOW() - INTERVAL '1 year' AND status = 'RESOLVED';

  -- Log cleanup
  RAISE NOTICE 'Cleaned up old data older than % days', days_old;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERFORMANCE REPORTING
-- ============================================================================

-- Function to generate performance report
CREATE OR REPLACE FUNCTION generate_performance_report()
RETURNS TABLE (
  metric TEXT,
  value TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'Active Connections'::TEXT,
    count(*)::TEXT,
    'Current database connections'::TEXT
  FROM pg_stat_activity
  WHERE state = 'active'

  UNION ALL

  SELECT
    'Database Size'::TEXT,
    pg_size_pretty(pg_database_size(current_database()))::TEXT,
    'Total database size'::TEXT

  UNION ALL

  SELECT
    'Cache Hit Ratio'::TEXT,
    ROUND(
      (sum(blks_hit) * 100.0 / (sum(blks_hit) + sum(blks_read)))::numeric,
      2
    )::TEXT || '%',
    'Buffer cache hit ratio'::TEXT
  FROM pg_stat_database

  UNION ALL

  SELECT
    'Slow Queries'::TEXT,
    count(*)::TEXT,
    'Queries taking >1 second'::TEXT
  FROM pg_stat_statements
  WHERE mean_time > 1000;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================

/*
To apply these optimizations:

1. Run this script as a superuser:
   psql -U postgres -d your_database -f optimize-database.sql

2. Reload PostgreSQL configuration:
   SELECT pg_reload_conf();

3. Refresh the materialized view periodically:
   SELECT refresh_dashboard_stats();

4. Monitor performance with:
   SELECT * FROM generate_performance_report();

5. Clean up old data monthly:
   SELECT cleanup_old_data();

Note: Some settings require a PostgreSQL restart to take effect.
For production environments, adjust the memory settings based on your server capacity.
*/
