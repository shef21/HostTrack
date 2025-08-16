-- ===== ADD PLATFORMS COLUMN TO PROPERTIES TABLE =====
-- This migration adds the missing platforms column that stores platform information
-- for properties (Airbnb, Booking.com, Manual, etc.)

-- Check if the platforms column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'platforms'
    ) THEN
        -- Add the platforms column as JSONB to store arrays of platform strings
        ALTER TABLE properties ADD COLUMN platforms JSONB DEFAULT '[]'::jsonb;
        
        -- Add a comment to document the column purpose
        COMMENT ON COLUMN properties.platforms IS 'Array of platforms where this property is listed (e.g., ["Airbnb", "Booking.com", "Manual"])';
        
        RAISE NOTICE '✅ Successfully added platforms column to properties table';
    ELSE
        RAISE NOTICE 'ℹ️ Platforms column already exists in properties table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'platforms';

-- Show current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;
