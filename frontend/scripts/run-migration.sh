#!/bin/bash

# ============================================================================
# SOULPATH DATABASE MIGRATION SCRIPT
# Execute the refactored schema migration using Supabase CLI
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists supabase; then
    print_error "Supabase CLI is not installed. Please install it first."
    print_status "Installation guide: https://supabase.com/docs/guides/cli"
    exit 1
fi

if ! command_exists psql; then
    print_warning "PostgreSQL client (psql) is not installed. Some validation steps may be skipped."
fi

print_success "Prerequisites check completed"

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    print_error "This script must be run from the project root directory (where supabase/config.toml exists)"
    exit 1
fi

print_success "Project structure verified"

# Backup current database (if connected)
print_status "Creating database backup..."
if supabase db dump --data-only > "backup_$(date +%Y%m%d_%H%M%S).sql" 2>/dev/null; then
    print_success "Database backup created"
else
    print_warning "Could not create database backup. Make sure you're connected to Supabase."
fi

# Step 1: Run the main migration
print_status "Step 1: Running main migration (unified user model)..."
if supabase db push; then
    print_success "Main migration completed successfully"
else
    print_error "Main migration failed"
    exit 1
fi

# Step 2: Validate the migration
print_status "Step 2: Validating migration..."
if command_exists psql; then
    # Get the database URL from Supabase
    DB_URL=$(supabase db remote commit --dry-run 2>/dev/null | grep "DATABASE_URL" | cut -d'=' -f2 | tr -d '"' || echo "")
    
    if [ -n "$DB_URL" ]; then
        print_status "Running validation queries..."
        psql "$DB_URL" -f scripts/validate-migration.sql
        print_success "Validation completed"
    else
        print_warning "Could not get database URL for validation"
    fi
else
    print_warning "Skipping validation (psql not available)"
fi

# Step 3: Ask user if they want to proceed with cleanup
print_status "Step 3: Cleanup phase"
echo ""
print_warning "The main migration has been completed successfully."
print_warning "The cleanup migration will remove legacy tables and columns."
echo ""
read -p "Do you want to proceed with the cleanup migration? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Running cleanup migration..."
    
    # Create a temporary migration for cleanup
    CLEANUP_MIGRATION="supabase/migrations/$(date +%Y%m%d%H%M%S)_cleanup_legacy_tables.sql"
    
    # Copy the cleanup migration content
    cat > "$CLEANUP_MIGRATION" << 'EOF'
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

-- Phase 5: Create helpful views for the new schema
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
EOF

    # Run the cleanup migration
    if supabase db push; then
        print_success "Cleanup migration completed successfully"
        
        # Remove the temporary migration file
        rm "$CLEANUP_MIGRATION"
    else
        print_error "Cleanup migration failed"
        print_warning "Temporary migration file left at: $CLEANUP_MIGRATION"
        exit 1
    fi
else
    print_status "Cleanup migration skipped. You can run it manually later."
fi

# Final validation
print_status "Final validation..."
if command_exists psql && [ -n "$DB_URL" ]; then
    print_status "Running final validation queries..."
    psql "$DB_URL" -c "
    SELECT 'FINAL VALIDATION' as check_type;
    SELECT 'users' as table_name, COUNT(*) as count FROM users
    UNION ALL
    SELECT 'purchases' as table_name, COUNT(*) as count FROM purchases
    UNION ALL
    SELECT 'user_packages' as table_name, COUNT(*) as count FROM user_packages
    UNION ALL
    SELECT 'bookings' as table_name, COUNT(*) as count FROM bookings
    UNION ALL
    SELECT 'payment_records' as table_name, COUNT(*) as count FROM payment_records;
    "
    print_success "Final validation completed"
fi

# Update Prisma schema
print_status "Updating Prisma schema..."
if supabase db pull --schema public; then
    print_success "Prisma schema updated"
else
    print_warning "Could not update Prisma schema automatically"
    print_status "Please run 'supabase db pull --schema public' manually"
fi

print_success "Migration process completed successfully!"
echo ""
print_status "Next steps:"
echo "1. Update your application code to use the new unified User model"
echo "2. Update all API endpoints to use the new schema relationships"
echo "3. Test all functionality thoroughly"
echo "4. Update any hardcoded queries or business logic"
echo ""
print_status "For help with the new schema, refer to the refactored prisma/schema.prisma file"
