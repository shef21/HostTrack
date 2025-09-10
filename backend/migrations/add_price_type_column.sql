-- Add price_type column to cape_town_competitors table
ALTER TABLE cape_town_competitors
ADD COLUMN IF NOT EXISTS price_type VARCHAR(20) NOT NULL DEFAULT 'nightly'
CHECK (price_type IN ('nightly', 'monthly'));

-- Add URL column for property links
ALTER TABLE cape_town_competitors
ADD COLUMN IF NOT EXISTS url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN cape_town_competitors.price_type IS 'Indicates whether the price is per night or per month';
COMMENT ON COLUMN cape_town_competitors.url IS 'Direct link to the property listing';
