-- Add booking constraints and capacity management
-- This migration adds proper constraints for booking capacity management

-- TODO: Add booking capacity check when schedule_id column is added to bookings table
-- TODO: Add schedule booked count update when schedule_id column is added to bookings table
-- TODO: Add schedule_id foreign key constraint when schedule_id column is added to bookings table
-- TODO: Add client_id foreign key constraint when client_id column is added to bookings table
-- TODO: Add user_package_id foreign key constraint when user_package_id column is added to bookings table
-- TODO: Add package_id foreign key constraint when package_id column is added to bookings table
-- TODO: Add currency_id foreign key constraint when currency_id column is added to bookings table
-- TODO: Add group_booking_tier_id foreign key constraint when group_booking_tier_id column is added to bookings table
-- TODO: Add booking_type check constraint when booking_type column is added to bookings table
-- TODO: Add group_size check constraint when group_size column is added to bookings table
-- TODO: Add amounts check constraint when amount columns are added to bookings table

-- Add check constraint for booking status (only constraint that can be added now)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_booking_status') THEN
        ALTER TABLE bookings ADD CONSTRAINT check_booking_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'));
    END IF;
END $$;

-- Success message
SELECT 'Booking constraints migration completed successfully!' as message;
