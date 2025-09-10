-- ===== CAPE TOWN MARKET INTELLIGENCE TABLES =====
-- This migration creates the necessary tables for the Cape Town market intelligence system

-- Enable RLS
ALTER TABLE IF EXISTS cape_town_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cape_town_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cape_town_market_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cape_town_area_stats ENABLE ROW LEVEL SECURITY;

-- Create enum for Cape Town areas
CREATE TYPE cape_town_area AS ENUM (
    'Century City',
    'Sea Point',
    'Green Point',
    'Camps Bay',
    'V&A Waterfront',
    'Woodstock',
    'Observatory',
    'Newlands'
);

-- Create enum for property types
CREATE TYPE property_category AS ENUM (
    'apartment',
    'house',
    'villa',
    'studio',
    'penthouse'
);

-- Create enum for trend directions
CREATE TYPE trend_direction AS ENUM (
    'increasing',
    'decreasing',
    'stable',
    'volatile'
);

-- Table 1: Cape Town Market Data
CREATE TABLE IF NOT EXISTS cape_town_market_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area cape_town_area NOT NULL,
    property_type property_category NOT NULL,
    price_range JSONB NOT NULL DEFAULT '{"min": 0, "max": 0, "avg": 0}'::jsonb,
    occupancy_rate DECIMAL(5,2),
    competitor_count INTEGER DEFAULT 0,
    demand_supply_ratio DECIMAL(5,2),
    price_trend trend_direction DEFAULT 'stable',
    seasonal_factor DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data_source VARCHAR(50),
    confidence_score DECIMAL(3,2) DEFAULT 0.95,
    owner_id UUID REFERENCES auth.users(id),
    CONSTRAINT valid_price_range CHECK (
        (price_range->>'min')::numeric >= 0 AND
        (price_range->>'max')::numeric >= (price_range->>'min')::numeric
    )
);

-- Table 2: Competitor Properties
CREATE TABLE IF NOT EXISTS cape_town_competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area cape_town_area NOT NULL,
    property_type property_category NOT NULL,
    external_id VARCHAR(100),
    platform VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    price_history JSONB DEFAULT '[]'::jsonb,
    current_price DECIMAL(10,2) NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    max_guests INTEGER,
    rating DECIMAL(3,2),
    review_count INTEGER DEFAULT 0,
    availability JSONB DEFAULT '{}'::jsonb,
    amenities JSONB DEFAULT '[]'::jsonb,
    location_score DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id),
    CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

-- Table 3: Market Trends
CREATE TABLE IF NOT EXISTS cape_town_market_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area cape_town_area NOT NULL,
    trend_type VARCHAR(50) NOT NULL,
    trend_value DECIMAL(10,2) NOT NULL,
    trend_direction trend_direction DEFAULT 'stable',
    confidence_level DECIMAL(3,2) DEFAULT 0.95,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    data_points INTEGER DEFAULT 0,
    seasonality_factor DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_confidence CHECK (confidence_level > 0 AND confidence_level <= 1)
);

-- Table 4: Area Statistics
CREATE TABLE IF NOT EXISTS cape_town_area_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area cape_town_area NOT NULL,
    total_properties INTEGER DEFAULT 0,
    avg_daily_rate DECIMAL(10,2),
    avg_occupancy DECIMAL(5,2),
    revenue_potential JSONB DEFAULT '{"low": 0, "medium": 0, "high": 0}'::jsonb,
    popular_amenities JSONB DEFAULT '[]'::jsonb,
    peak_seasons JSONB DEFAULT '[]'::jsonb,
    investment_score DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id),
    CONSTRAINT valid_investment_score CHECK (investment_score >= 0 AND investment_score <= 10)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_market_data_area ON cape_town_market_data(area);
CREATE INDEX IF NOT EXISTS idx_market_data_property_type ON cape_town_market_data(property_type);
CREATE INDEX IF NOT EXISTS idx_competitors_area ON cape_town_competitors(area);
CREATE INDEX IF NOT EXISTS idx_competitors_platform ON cape_town_competitors(platform);
CREATE INDEX IF NOT EXISTS idx_market_trends_area ON cape_town_market_trends(area);
CREATE INDEX IF NOT EXISTS idx_market_trends_dates ON cape_town_market_trends(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_area_stats_area ON cape_town_area_stats(area);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_cape_town_market_data_updated_at
    BEFORE UPDATE ON cape_town_market_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cape_town_competitors_updated_at
    BEFORE UPDATE ON cape_town_competitors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cape_town_market_trends_updated_at
    BEFORE UPDATE ON cape_town_market_trends
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cape_town_area_stats_updated_at
    BEFORE UPDATE ON cape_town_area_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Set up RLS policies
ALTER TABLE cape_town_market_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public market data access" ON cape_town_market_data
    FOR SELECT USING (true);
    
CREATE POLICY "Owners can insert market data" ON cape_town_market_data
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
    
CREATE POLICY "Owners can update market data" ON cape_town_market_data
    FOR UPDATE USING (auth.uid() = owner_id);

-- Similar policies for other tables
ALTER TABLE cape_town_competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public competitors access" ON cape_town_competitors
    FOR SELECT USING (true);
    
CREATE POLICY "Owners can insert competitors" ON cape_town_competitors
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
    
CREATE POLICY "Owners can update competitors" ON cape_town_competitors
    FOR UPDATE USING (auth.uid() = owner_id);

ALTER TABLE cape_town_market_trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public trends access" ON cape_town_market_trends
    FOR SELECT USING (true);
    
CREATE POLICY "Owners can insert trends" ON cape_town_market_trends
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
    
CREATE POLICY "Owners can update trends" ON cape_town_market_trends
    FOR UPDATE USING (auth.uid() = owner_id);

ALTER TABLE cape_town_area_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public area stats access" ON cape_town_area_stats
    FOR SELECT USING (true);
    
CREATE POLICY "Owners can insert area stats" ON cape_town_area_stats
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
    
CREATE POLICY "Owners can update area stats" ON cape_town_area_stats
    FOR UPDATE USING (auth.uid() = owner_id);

-- Add comments for documentation
COMMENT ON TABLE cape_town_market_data IS 'Stores aggregated market data for Cape Town areas';
COMMENT ON TABLE cape_town_competitors IS 'Tracks competitor properties and their pricing history';
COMMENT ON TABLE cape_town_market_trends IS 'Records market trends and predictions';
COMMENT ON TABLE cape_town_area_stats IS 'Maintains area-specific statistics and investment scores';

-- Verification queries
SELECT 'cape_town_market_data' as table_name, COUNT(*) as record_count FROM cape_town_market_data
UNION ALL
SELECT 'cape_town_competitors' as table_name, COUNT(*) as record_count FROM cape_town_competitors
UNION ALL
SELECT 'cape_town_market_trends' as table_name, COUNT(*) as record_count FROM cape_town_market_trends
UNION ALL
SELECT 'cape_town_area_stats' as table_name, COUNT(*) as record_count FROM cape_town_area_stats
ORDER BY table_name;
