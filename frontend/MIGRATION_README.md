# SoulPath Database Migration Guide

## Overview

This guide documents the migration from the legacy SoulPath database schema to the new unified user model. The migration consolidates the `Profile` and `Client` models into a single `User` model, removes legacy tables, and establishes cleaner relationships between entities.

## What Changed

### 🔄 Unified User Model
- **Before**: Separate `Profile` (authentication) and `Client` (business data) tables
- **After**: Single `User` table containing both authentication and business data
- **Benefit**: Eliminates data duplication and simplifies relationships

### 🗂️ New Purchase Model
- **Before**: Payment information scattered across multiple tables
- **After**: Centralized `Purchase` model with clear financial trail
- **Benefit**: Better audit trail and cleaner payment tracking

### 🧹 Removed Legacy Tables
- `Schedule` → Consolidated into `ScheduleTemplate` and `ScheduleSlot`
- `SoulPackage` → Consolidated into `PackageDefinition` and `PackagePrice`
- `GroupBooking` → Functionality moved to `Booking` model
- `SessionUsage` → Functionality moved to `Booking` model

### 🔗 Standardized Relationships
- **Before**: Email-based foreign keys and inconsistent relationships
- **After**: Proper foreign key relationships using UUIDs
- **Benefit**: Better data integrity and performance

## Migration Files

### 1. Main Migration
- **File**: `supabase/migrations/20250901040135_refactor_unified_user_model.sql`
- **Purpose**: Creates new tables, migrates data, establishes relationships
- **Status**: ✅ Ready to run

### 2. Cleanup Migration
- **File**: `supabase/migrations/20250901040221_cleanup_legacy_tables.sql`
- **Purpose**: Removes legacy tables and columns
- **Status**: ⚠️ Run after testing main migration

### 3. Validation Script
- **File**: `scripts/validate-migration.sql`
- **Purpose**: Verifies data integrity after migration
- **Status**: ✅ Ready to use

### 4. Automated Migration Script
- **File**: `scripts/run-migration.sh`
- **Purpose**: Automated migration execution with validation
- **Status**: ✅ Ready to use

## Prerequisites

1. **Supabase CLI** installed and configured
2. **PostgreSQL client** (optional, for validation)
3. **Database backup** (recommended)
4. **Application downtime** (required)

## Migration Process

### Option 1: Automated Migration (Recommended)

```bash
# Make sure you're in the project root directory
cd /path/to/soulpath-project

# Run the automated migration script
./scripts/run-migration.sh
```

The script will:
1. ✅ Check prerequisites
2. ✅ Create database backup
3. ✅ Run main migration
4. ✅ Validate data integrity
5. ⚠️ Ask for cleanup confirmation
6. ✅ Update Prisma schema

### Option 2: Manual Migration

#### Step 1: Backup Database
```bash
supabase db dump --data-only > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Step 2: Run Main Migration
```bash
supabase db push
```

#### Step 3: Validate Migration
```bash
# If you have psql installed
psql $DATABASE_URL -f scripts/validate-migration.sql
```

#### Step 4: Run Cleanup (After Testing)
```bash
# Only run after thorough testing
supabase db push
```

#### Step 5: Update Prisma Schema
```bash
supabase db pull --schema public
```

## Data Migration Details

### User Data Migration
```sql
-- Profiles are migrated first (preserving IDs)
INSERT INTO users (id, email, full_name, avatar_url, role, created_at, updated_at)
SELECT id, email, full_name, avatar_url, role, created_at, updated_at
FROM profiles;

-- Clients are migrated next (generating new IDs)
INSERT INTO users (id, email, full_name, phone, status, birth_date, ...)
SELECT gen_random_uuid()::text, email, name, phone, status, birth_date, ...
FROM clients
WHERE email NOT IN (SELECT email FROM users);
```

### Purchase Data Migration
```sql
-- Create purchase records from existing user_packages
INSERT INTO purchases (user_id, total_amount, currency_code, payment_method, ...)
SELECT u.id, up.purchase_price, 'USD', up.payment_method, ...
FROM user_packages up
JOIN users u ON u.email = up.user_email;
```

### Relationship Updates
```sql
-- Update foreign keys in all tables
UPDATE bookings SET user_id = u.id FROM users u WHERE bookings.client_email = u.email;
UPDATE user_packages SET user_id = u.id FROM users u WHERE user_packages.user_email = u.email;
UPDATE payment_records SET user_id = u.id FROM users u WHERE payment_records.client_email = u.email;
```

## Validation Checklist

After migration, verify:

- [ ] All users migrated successfully
- [ ] No orphaned records
- [ ] Foreign key relationships intact
- [ ] Purchase amounts match
- [ ] Session usage tracking accurate
- [ ] No duplicate emails
- [ ] Application functionality works

## Rollback Plan

If issues arise:

1. **Stop the application**
2. **Restore from backup**:
   ```bash
   psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
   ```
3. **Revert Prisma schema** to previous version
4. **Restart application**

## Post-Migration Tasks

### 1. Update Application Code

#### Update API Endpoints
```typescript
// Before
const client = await prisma.client.findUnique({ where: { email } });

// After
const user = await prisma.user.findUnique({ where: { email } });
```

#### Update Queries
```typescript
// Before
const bookings = await prisma.booking.findMany({
  where: { clientEmail: email }
});

// After
const bookings = await prisma.booking.findMany({
  where: { user: { email } }
});
```

### 2. Update Business Logic
- Replace `Client` references with `User`
- Update authentication logic
- Modify booking creation flow
- Update payment processing

### 3. Test Thoroughly
- User registration/login
- Package purchases
- Booking creation
- Payment processing
- Admin dashboard
- Reports and analytics

## Troubleshooting

### Common Issues

#### 1. Foreign Key Constraint Errors
```sql
-- Check for orphaned records
SELECT 'bookings without user_id' as issue, COUNT(*) as count 
FROM bookings WHERE user_id IS NULL;
```

#### 2. Duplicate Email Errors
```sql
-- Find duplicate emails
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;
```

#### 3. Missing Purchase Records
```sql
-- Check user_packages without purchase_id
SELECT COUNT(*) FROM user_packages WHERE purchase_id IS NULL;
```

### Getting Help

1. Check the validation script output
2. Review migration logs
3. Restore from backup if needed
4. Contact the development team

## Schema Comparison

### Before Migration
```
Profile (auth) ←→ Client (business)
    ↓              ↓
Bookings, UserPackages, PaymentRecords
```

### After Migration
```
User (unified)
    ↓
Purchase → PaymentRecord
    ↓
UserPackage → Booking
```

## Performance Impact

### Improvements
- ✅ Fewer table joins
- ✅ Better indexing
- ✅ Cleaner relationships
- ✅ Reduced data duplication

### Considerations
- ⚠️ Larger user table
- ⚠️ Migration downtime
- ⚠️ Application code updates required

## Support

For questions or issues:
1. Check this documentation
2. Review migration logs
3. Run validation scripts
4. Contact the development team

---

**Migration Version**: 1.0  
**Last Updated**: September 1, 2024  
**Status**: Ready for Production
