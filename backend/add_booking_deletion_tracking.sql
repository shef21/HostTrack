-- Add columns to bookings table for tracking deleted properties
-- This allows us to preserve booking history when properties are deleted

-- Add property_deleted flag
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS property_deleted BOOLEAN DEFAULT FALSE;

-- Add deleted_property_name to store the name of the deleted property
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deleted_property_name TEXT;

-- Add index for efficient querying of orphaned bookings
CREATE INDEX IF NOT EXISTS idx_bookings_property_deleted ON bookings(property_deleted);

-- Update existing bookings to ensure the new columns have proper defaults
UPDATE bookings SET property_deleted = FALSE WHERE property_deleted IS NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('property_deleted', 'deleted_property_name')
ORDER BY column_name; 