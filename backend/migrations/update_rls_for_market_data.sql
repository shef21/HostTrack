-- Update RLS policies for market data collection
DROP POLICY IF EXISTS "Owners can insert competitors" ON cape_town_competitors;
DROP POLICY IF EXISTS "Public competitors insert" ON cape_town_competitors;

-- Allow public inserts for market data collection
CREATE POLICY "Public competitors insert" ON cape_town_competitors
    FOR INSERT WITH CHECK (true);

-- Add comment for documentation
COMMENT ON POLICY "Public competitors insert" ON cape_town_competitors IS 'Allows public inserts for market data collection';
