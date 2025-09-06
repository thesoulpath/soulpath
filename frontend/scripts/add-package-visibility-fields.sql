-- Add new fields to package_definitions table for enhanced visibility management
-- This script adds fields for better package management in the admin UI

-- Add is_popular field
ALTER TABLE package_definitions 
ADD COLUMN is_popular BOOLEAN DEFAULT false;

-- Add display_order field
ALTER TABLE package_definitions 
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Add featured field
ALTER TABLE package_definitions 
ADD COLUMN featured BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX idx_package_definitions_popular ON package_definitions(is_popular);
CREATE INDEX idx_package_definitions_order ON package_definitions(display_order);
CREATE INDEX idx_package_definitions_featured ON package_definitions(featured);

-- Update existing packages to have proper display order
UPDATE package_definitions SET display_order = id WHERE display_order = 0;

-- Mark the first package as popular (you can adjust this as needed)
UPDATE package_definitions SET is_popular = true WHERE id = 1;

-- Mark some packages as featured (you can adjust this as needed)
UPDATE package_definitions SET featured = true WHERE id IN (1, 2);

-- Add comments for documentation
COMMENT ON COLUMN package_definitions.is_popular IS 'Marks package as popular/recommended';
COMMENT ON COLUMN package_definitions.display_order IS 'Controls the order packages appear in lists';
COMMENT ON COLUMN package_definitions.featured IS 'Marks package as featured/highlighted';
