-- Begin transaction
BEGIN;

-- Create new enum type with all areas
CREATE TYPE cape_town_area_v2 AS ENUM (
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

-- Create new tables with _v2 suffix using new enum
CREATE TABLE cape_town_competitors_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area cape_town_area_v2 NOT NULL,
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
    CONSTRAINT unique_external_id_v2 UNIQUE (external_id)
);

CREATE TABLE cape_town_market_data_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area cape_town_area_v2 NOT NULL,
    date DATE NOT NULL,
    average_price DECIMAL(10,2),
    median_price DECIMAL(10,2),
    total_listings INTEGER,
    occupancy_rate DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cape_town_market_trends_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area cape_town_area_v2 NOT NULL,
    trend_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    value_change DECIMAL(10,2),
    percentage_change DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cape_town_area_stats_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area cape_town_area_v2 NOT NULL,
    stat_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,2),
    period VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy data from old tables to new tables
INSERT INTO cape_town_competitors_v2 (
    id, area, property_type, external_id, platform, title,
    current_price, price_history, bedrooms, bathrooms, max_guests,
    rating, review_count, availability, amenities, coordinates,
    images, url, scan_date, last_seen_at
)
SELECT 
    id, area::text::cape_town_area_v2, property_type, external_id, platform, title,
    current_price, price_history, bedrooms, bathrooms, max_guests,
    rating, review_count, availability, amenities, coordinates,
    images, url, scan_date, last_seen_at
FROM cape_town_competitors;

INSERT INTO cape_town_market_data_v2 (
    id, area, date, average_price, median_price,
    total_listings, occupancy_rate, created_at
)
SELECT 
    id, area::text::cape_town_area_v2, date, average_price, median_price,
    total_listings, occupancy_rate, created_at
FROM cape_town_market_data;

INSERT INTO cape_town_market_trends_v2 (
    id, area, trend_type, start_date, end_date,
    value_change, percentage_change, created_at
)
SELECT 
    id, area::text::cape_town_area_v2, trend_type, start_date, end_date,
    value_change, percentage_change, created_at
FROM cape_town_market_trends;

INSERT INTO cape_town_area_stats_v2 (
    id, area, stat_type, value, period, created_at
)
SELECT 
    id, area::text::cape_town_area_v2, stat_type, value, period, created_at
FROM cape_town_area_stats;

-- Drop old tables and enum
DROP TABLE IF EXISTS cape_town_competitors CASCADE;
DROP TABLE IF EXISTS cape_town_market_data CASCADE;
DROP TABLE IF EXISTS cape_town_market_trends CASCADE;
DROP TABLE IF EXISTS cape_town_area_stats CASCADE;
DROP TYPE IF EXISTS cape_town_area CASCADE;

-- Rename new tables and enum to original names
ALTER TYPE cape_town_area_v2 RENAME TO cape_town_area;
ALTER TABLE cape_town_competitors_v2 RENAME TO cape_town_competitors;
ALTER TABLE cape_town_market_data_v2 RENAME TO cape_town_market_data;
ALTER TABLE cape_town_market_trends_v2 RENAME TO cape_town_market_trends;
ALTER TABLE cape_town_area_stats_v2 RENAME TO cape_town_area_stats;

-- Rename constraints to match original names
ALTER TABLE cape_town_competitors 
    RENAME CONSTRAINT unique_external_id_v2 TO unique_external_id;

COMMIT;
