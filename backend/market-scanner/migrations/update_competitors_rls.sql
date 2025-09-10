-- Drop existing policies
DROP POLICY IF EXISTS "Owners can insert competitors" ON cape_town_competitors;
DROP POLICY IF EXISTS "Owners can update competitors" ON cape_town_competitors;

-- Create new policies that allow anon role to insert/update
CREATE POLICY "Allow anon insert competitors" ON cape_town_competitors
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anon update competitors" ON cape_town_competitors
    FOR UPDATE TO anon
    USING (true);
