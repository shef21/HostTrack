-- ===== SUPABASE SQL EDITOR MIGRATION =====
-- Copy and paste this entire script into your Supabase SQL Editor
-- Then click "Run" to execute the migration

-- Step 1: Add the platforms column to the properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS platforms JSONB DEFAULT '[]'::jsonb;

-- Step 2: Add a comment to document the column purpose
COMMENT ON COLUMN properties.platforms IS 'Array of platforms where this property is listed (e.g., ["Airbnb", "Booking.com", "Manual"])';

-- Step 3: Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'platforms';

-- Step 4: Show current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;

-- Step 5: Test inserting a property with platforms
-- (Optional - uncomment to test)
/*
INSERT INTO properties (
    name, 
    location, 
    type, 
    price, 
    bedrooms, 
    bathrooms, 
    max_guests, 
    owner_id,
    platforms
) VALUES (
    'Test Property with Platforms',
    'Test Location',
    'apartment',
    1000,
    2,
    1,
    4,
    (SELECT id FROM auth.users LIMIT 1),
    '["Airbnb", "Booking.com"]'::jsonb
) ON CONFLICT DO NOTHING;
*/

-- Step 6: Verify existing properties can now store platforms
SELECT 
    id,
    name,
    platforms,
    CASE 
        WHEN platforms IS NULL THEN 'NULL (needs update)'
        WHEN jsonb_array_length(platforms) = 0 THEN 'Empty array []'
        ELSE 'Has platforms: ' || platforms::text
    END as platforms_status
FROM properties 
LIMIT 10;
