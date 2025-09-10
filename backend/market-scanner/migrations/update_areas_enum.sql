-- Begin transaction
BEGIN;

-- Create new enum type with all areas
CREATE TYPE cape_town_area_new AS ENUM (
    -- Existing areas
    'Sea Point',
    'Green Point',
    'Camps Bay',
    'V&A Waterfront',
    'Century City',
    'Woodstock',
    'Observatory',
    'Newlands',
    -- New areas
    'Claremont',
    'Rondebosch',
    'Kenilworth',
    'Gardens',
    'Tamboerskloof',
    'Bo-Kaap',
    'Bantry Bay',
    'Clifton',
    'Fresnaye',
    'Hout Bay',
    'Constantia',
    'Bellville',
    'Durbanville',
    'Muizenberg',
    'Kalk Bay',
    'Fish Hoek'
);

-- Create temporary columns with the new type
ALTER TABLE cape_town_competitors 
    ADD COLUMN area_new cape_town_area_new;
ALTER TABLE cape_town_market_data 
    ADD COLUMN area_new cape_town_area_new;
ALTER TABLE cape_town_market_trends 
    ADD COLUMN area_new cape_town_area_new;
ALTER TABLE cape_town_area_stats 
    ADD COLUMN area_new cape_town_area_new;

-- Copy data to new columns, converting the type
UPDATE cape_town_competitors 
SET area_new = area::text::cape_town_area_new;
UPDATE cape_town_market_data 
SET area_new = area::text::cape_town_area_new;
UPDATE cape_town_market_trends 
SET area_new = area::text::cape_town_area_new;
UPDATE cape_town_area_stats 
SET area_new = area::text::cape_town_area_new;

-- Drop old columns
ALTER TABLE cape_town_competitors 
    DROP COLUMN area;
ALTER TABLE cape_town_market_data 
    DROP COLUMN area;
ALTER TABLE cape_town_market_trends 
    DROP COLUMN area;
ALTER TABLE cape_town_area_stats 
    DROP COLUMN area;

-- Rename new columns to original names
ALTER TABLE cape_town_competitors 
    RENAME COLUMN area_new TO area;
ALTER TABLE cape_town_market_data 
    RENAME COLUMN area_new TO area;
ALTER TABLE cape_town_market_trends 
    RENAME COLUMN area_new TO area;
ALTER TABLE cape_town_area_stats 
    RENAME COLUMN area_new TO area;

-- Drop old type
DROP TYPE cape_town_area;

-- Rename new type to original name
ALTER TYPE cape_town_area_new RENAME TO cape_town_area;

-- Add NOT NULL constraints back
ALTER TABLE cape_town_competitors 
    ALTER COLUMN area SET NOT NULL;
ALTER TABLE cape_town_market_data 
    ALTER COLUMN area SET NOT NULL;
ALTER TABLE cape_town_market_trends 
    ALTER COLUMN area SET NOT NULL;
ALTER TABLE cape_town_area_stats 
    ALTER COLUMN area SET NOT NULL;

-- Commit transaction
COMMIT;