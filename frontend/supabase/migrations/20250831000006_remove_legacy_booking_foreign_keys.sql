-- Remove legacy foreign key constraints that are causing PostgREST ambiguity
-- This migration removes the old client_email foreign key constraint from bookings table

-- Drop the legacy foreign key constraint on client_email
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_client_email_fkey' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_client_email_fkey;
    END IF;
END $$;

-- Also drop any other legacy foreign key constraints that might exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_client_email_fkey' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_client_email_fkey;
    END IF;
END $$;

-- Drop the legacy foreign key constraint on user_email in user_packages if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_packages_user_email' 
        AND table_name = 'user_packages'
    ) THEN
        ALTER TABLE user_packages DROP CONSTRAINT fk_user_packages_user_email;
    END IF;
END $$;

-- Drop the legacy foreign key constraint on client_email in payment_records if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_payment_records_client' 
        AND table_name = 'payment_records'
    ) THEN
        ALTER TABLE payment_records DROP CONSTRAINT fk_payment_records_client;
    END IF;
END $$;

-- Add comments to document the changes
COMMENT ON TABLE bookings IS 'Bookings table with unified client_id foreign key relationship';
COMMENT ON TABLE user_packages IS 'User packages table with unified client_id foreign key relationship';
COMMENT ON TABLE payment_records IS 'Payment records table with unified client_id foreign key relationship';

-- Success message
SELECT 'Legacy foreign key constraints removed successfully!' as message;
