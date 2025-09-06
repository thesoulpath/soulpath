-- Add missing fields to match Prisma schema
-- This migration adds all the missing fields that are in the Prisma schema but not in the database

-- 1. Add missing fields to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Add missing fields to schedules table
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS booked_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS session_duration_id INTEGER;

-- Add foreign key for session_duration_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_schedules_session_duration' 
        AND table_name = 'schedules'
    ) THEN
        ALTER TABLE schedules 
        ADD CONSTRAINT fk_schedules_session_duration 
        FOREIGN KEY (session_duration_id) REFERENCES session_durations(id);
    END IF;
END $$;

-- 3. Add missing fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS schedule_id INTEGER,
ADD COLUMN IF NOT EXISTS start_time TEXT,
ADD COLUMN IF NOT EXISTS end_time TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_reason TEXT,
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS package_id INTEGER,
ADD COLUMN IF NOT EXISTS group_booking_tier_id INTEGER,
ADD COLUMN IF NOT EXISTS is_group_booking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS currency_id INTEGER,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS client_id INTEGER,
ADD COLUMN IF NOT EXISTS schedule_slot_id INTEGER,
ADD COLUMN IF NOT EXISTS user_package_id INTEGER,
ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'individual';

-- Add foreign keys for bookings table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_schedule_id' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT fk_bookings_schedule_id 
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_package_id' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT fk_bookings_package_id 
        FOREIGN KEY (package_id) REFERENCES soul_packages(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_currency_id' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT fk_bookings_currency_id 
        FOREIGN KEY (currency_id) REFERENCES currencies(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_group_booking_tier_id' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT fk_bookings_group_booking_tier_id 
        FOREIGN KEY (group_booking_tier_id) REFERENCES group_booking_tiers(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_client_id' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT fk_bookings_client_id 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_schedule_slot_id' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT fk_bookings_schedule_slot_id 
        FOREIGN KEY (schedule_slot_id) REFERENCES schedule_slots(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_user_package_id' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT fk_bookings_user_package_id 
        FOREIGN KEY (user_package_id) REFERENCES user_packages(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Add missing fields to user_packages table
ALTER TABLE user_packages 
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS package_id INTEGER,
ADD COLUMN IF NOT EXISTS sessions_remaining INTEGER,
ADD COLUMN IF NOT EXISTS sessions_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS group_sessions_remaining INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS group_sessions_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add foreign keys for user_packages table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_packages_package_id' 
        AND table_name = 'user_packages'
    ) THEN
        ALTER TABLE user_packages 
        ADD CONSTRAINT fk_user_packages_package_id 
        FOREIGN KEY (package_id) REFERENCES soul_packages(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_packages_package_price_id' 
        AND table_name = 'user_packages'
    ) THEN
        ALTER TABLE user_packages 
        ADD CONSTRAINT fk_user_packages_package_price_id 
        FOREIGN KEY (package_price_id) REFERENCES package_prices(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Add missing fields to payment_records table
ALTER TABLE payment_records 
ADD COLUMN IF NOT EXISTS client_id INTEGER;

-- Add foreign key for payment_records table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_payment_records_client_id' 
        AND table_name = 'payment_records'
    ) THEN
        ALTER TABLE payment_records 
        ADD CONSTRAINT fk_payment_records_client_id 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Add missing fields to schedule_slots table
ALTER TABLE schedule_slots 
ADD COLUMN IF NOT EXISTS bookings INTEGER[];

-- 7. Add missing fields to soul_packages table
ALTER TABLE soul_packages 
ADD COLUMN IF NOT EXISTS user_packages INTEGER[];

-- 8. Add missing fields to group_booking_tiers table
ALTER TABLE group_booking_tiers 
ADD COLUMN IF NOT EXISTS bookings INTEGER[];

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedules_capacity_availability ON schedules(capacity, auto_available, booked_count);
CREATE INDEX IF NOT EXISTS idx_schedules_session_duration ON schedules(session_duration_id);
CREATE INDEX IF NOT EXISTS idx_bookings_schedule_id ON bookings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_bookings_package_id ON bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_bookings_currency_id ON bookings(currency_id);
CREATE INDEX IF NOT EXISTS idx_bookings_group_booking_tier_id ON bookings(group_booking_tier_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_schedule_slot_id ON bookings(schedule_slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_package_id ON bookings(user_package_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type ON bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_user_packages_user_email ON user_packages(user_email);
CREATE INDEX IF NOT EXISTS idx_user_packages_package_id ON user_packages(package_id);
CREATE INDEX IF NOT EXISTS idx_user_packages_purchased_at ON user_packages(purchased_at);
CREATE INDEX IF NOT EXISTS idx_user_packages_payment_status ON user_packages(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_records_client_id ON payment_records(client_id);

-- Add comments to document the changes
COMMENT ON COLUMN clients.notes IS 'General notes about the client';
COMMENT ON COLUMN schedules.capacity IS 'Maximum number of bookings allowed';
COMMENT ON COLUMN schedules.booked_count IS 'Current number of bookings';
COMMENT ON COLUMN schedules.auto_available IS 'Whether the schedule is automatically available';
COMMENT ON COLUMN bookings.schedule_id IS 'Reference to the schedule';
COMMENT ON COLUMN bookings.package_id IS 'Reference to the soul package';
COMMENT ON COLUMN bookings.booking_type IS 'Type of booking (individual or group)';
COMMENT ON COLUMN user_packages.user_email IS 'Email of the user who purchased the package';
COMMENT ON COLUMN user_packages.package_id IS 'Reference to the soul package';

-- Success message
SELECT 'All missing fields added successfully!' as message;
