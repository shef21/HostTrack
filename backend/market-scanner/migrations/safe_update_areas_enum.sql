-- Begin transaction
BEGIN;

-- Create temporary tables to store existing data
CREATE TEMP TABLE temp_competitors AS SELECT * FROM cape_town_competitors;
CREATE TEMP TABLE temp_market_data AS SELECT * FROM cape_town_market_data;
CREATE TEMP TABLE temp_market_trends AS SELECT * FROM cape_town_market_trends;
CREATE TEMP TABLE temp_area_stats AS SELECT * FROM cape_town_area_stats;

-- Drop existing tables
DROP TABLE IF EXISTS cape_town_competitors CASCADE;
DROP TABLE IF EXISTS cape_town_market_data CASCADE;
DROP TABLE IF EXISTS cape_town_market_trends CASCADE;
DROP TABLE IF EXISTS cape_town_area_stats CASCADE;

-- Drop the enum type
DROP TYPE IF EXISTS cape_town_area CASCADE;

-- Create new enum type with all areas
CREATE TYPE cape_town_area AS ENUM (
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

-- Recreate the tables
CREATE TABLE cape_town_competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area cape_town_area NOT NULL,
    property_type VARCHAR(50) NOT NULL,
    external_id VARCHAR(100),
    platform VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    current_price DECIMAL(10,2),
    price_history JSONB DEFAULT '[]'::jsonb,
    bedrooms INTEGER,
    bathrooms INTEGER,
    max_guests INTEGER,
    rating DECIMAL(3,2),
    review_count INTEGER DEFAULT 0,
    availability JSONB DEFAULT '{}'::jsonb,
    amenities TEXT[] DEFAULT '{}',
    coordinates JSONB DEFAULT '{"lat": null, "lng": null}'::jsonb,
    images TEXT[] DEFAULT '{}',
    url TEXT,
    scan_date TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_external_id UNIQUE (external_id)
);

CREATE TABLE cape_town_market_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area cape_town_area NOT NULL,
    date DATE NOT NULL,
    average_price DECIMAL(10,2),
    median_price DECIMAL(10,2),
    total_listings INTEGER,
    occupancy_rate DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cape_town_market_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area cape_town_area NOT NULL,
    trend_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    value_change DECIMAL(10,2),
    percentage_change DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cape_town_area_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area cape_town_area NOT NULL,
    stat_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,2),
    period VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restore data from temporary tables
INSERT INTO cape_town_competitors 
SELECT * FROM temp_competitors;

INSERT INTO cape_town_market_data 
SELECT * FROM temp_market_data;

INSERT INTO cape_town_market_trends 
SELECT * FROM temp_market_trends;

INSERT INTO cape_town_area_stats 
SELECT * FROM temp_area_stats;

-- Drop temporary tables
DROP TABLE temp_competitors;
DROP TABLE temp_market_data;
DROP TABLE temp_market_trends;
DROP TABLE temp_area_stats;

-- Commit transaction
COMMIT;
