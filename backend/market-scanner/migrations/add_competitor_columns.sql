-- Add missing columns to cape_town_competitors table
ALTER TABLE cape_town_competitors
ADD COLUMN IF NOT EXISTS coordinates JSONB DEFAULT '{"lat": null, "lng": null}'::jsonb,
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS scan_date TIMESTAMPTZ DEFAULT NOW();

-- Drop existing constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'valid_coordinates' 
        AND table_name = 'cape_town_competitors'
    ) THEN
        ALTER TABLE cape_town_competitors DROP CONSTRAINT valid_coordinates;
    END IF;
END $$;

-- Add constraint to ensure coordinates are valid
ALTER TABLE cape_town_competitors
ADD CONSTRAINT valid_coordinates CHECK (
    (
        (coordinates->>'lat')::numeric IS NULL OR 
        ((coordinates->>'lat')::numeric >= -90 AND (coordinates->>'lat')::numeric <= 90)
    ) AND (
        (coordinates->>'lng')::numeric IS NULL OR 
        ((coordinates->>'lng')::numeric >= -180 AND (coordinates->>'lng')::numeric <= 180)
    )
);

-- Drop existing index if it exists
DROP INDEX IF EXISTS idx_competitors_scan_date;

-- Add index for scan_date for better query performance
CREATE INDEX IF NOT EXISTS idx_competitors_scan_date ON cape_town_competitors(scan_date);

-- Add comments for documentation (these will update if they exist)
COMMENT ON COLUMN cape_town_competitors.coordinates IS 'Property coordinates in {lat, lng} format';
COMMENT ON COLUMN cape_town_competitors.images IS 'Array of image URLs for the property';
COMMENT ON COLUMN cape_town_competitors.scan_date IS 'Date when the property was last scanned';

-- Verification query
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'cape_town_competitors' 
AND column_name IN ('coordinates', 'images', 'scan_date')
ORDER BY column_name;