-- Step 1: Create new enum type
CREATE TYPE cape_town_area_v2 AS ENUM (
    'Sea Point', 'Green Point', 'Camps Bay', 'V&A Waterfront', 'Century City',
    'Woodstock', 'Observatory', 'Newlands', 'Claremont', 'Rondebosch',
    'Kenilworth', 'Gardens', 'Tamboerskloof', 'Bo-Kaap', 'Bantry Bay',
    'Clifton', 'Fresnaye', 'Hout Bay', 'Constantia', 'Bellville',
    'Durbanville', 'Muizenberg', 'Kalk Bay', 'Fish Hoek'
);

-- Step 2: Add new column with new enum type to each table
ALTER TABLE cape_town_competitors ADD COLUMN area_new cape_town_area_v2;
ALTER TABLE cape_town_market_data ADD COLUMN area_new cape_town_area_v2;
ALTER TABLE cape_town_market_trends ADD COLUMN area_new cape_town_area_v2;
ALTER TABLE cape_town_area_stats ADD COLUMN area_new cape_town_area_v2;

-- Step 3: Copy data to new columns
UPDATE cape_town_competitors SET area_new = area::text::cape_town_area_v2;
UPDATE cape_town_market_data SET area_new = area::text::cape_town_area_v2;
UPDATE cape_town_market_trends SET area_new = area::text::cape_town_area_v2;
UPDATE cape_town_area_stats SET area_new = area::text::cape_town_area_v2;

-- Step 4: Drop old columns
ALTER TABLE cape_town_competitors DROP COLUMN area;
ALTER TABLE cape_town_market_data DROP COLUMN area;
ALTER TABLE cape_town_market_trends DROP COLUMN area;
ALTER TABLE cape_town_area_stats DROP COLUMN area;

-- Step 5: Rename new columns
ALTER TABLE cape_town_competitors RENAME COLUMN area_new TO area;
ALTER TABLE cape_town_market_data RENAME COLUMN area_new TO area;
ALTER TABLE cape_town_market_trends RENAME COLUMN area_new TO area;
ALTER TABLE cape_town_area_stats RENAME COLUMN area_new TO area;

-- Step 6: Drop old enum type
DROP TYPE cape_town_area;

-- Step 7: Rename new enum type
ALTER TYPE cape_town_area_v2 RENAME TO cape_town_area;

-- Step 8: Add NOT NULL constraints back
ALTER TABLE cape_town_competitors ALTER COLUMN area SET NOT NULL;
ALTER TABLE cape_town_market_data ALTER COLUMN area SET NOT NULL;
ALTER TABLE cape_town_market_trends ALTER COLUMN area SET NOT NULL;
ALTER TABLE cape_town_area_stats ALTER COLUMN area SET NOT NULL;
