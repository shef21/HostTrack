-- ===== CAPE TOWN MARKET INTELLIGENCE VERIFICATION =====
-- Run this script to verify all components are correctly set up

-- 1. Verify Custom Enums
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('cape_town_area', 'property_category', 'trend_direction')
ORDER BY t.typname, e.enumsortorder;

-- 2. Verify Table Existence and Structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN (
    'cape_town_market_data',
    'cape_town_competitors',
    'cape_town_market_trends',
    'cape_town_area_stats'
)
ORDER BY table_name, ordinal_position;

-- 3. Verify RLS Policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN (
    'cape_town_market_data',
    'cape_town_competitors',
    'cape_town_market_trends',
    'cape_town_area_stats'
)
ORDER BY tablename, policyname;

-- 4. Verify Indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN (
    'cape_town_market_data',
    'cape_town_competitors',
    'cape_town_market_trends',
    'cape_town_area_stats'
)
ORDER BY tablename, indexname;

-- 5. Verify Triggers
SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table IN (
    'cape_town_market_data',
    'cape_town_competitors',
    'cape_town_market_trends',
    'cape_town_area_stats'
)
ORDER BY event_object_table, trigger_name;

-- 6. Test Data Insertion (will rollback)
BEGIN;

-- Insert test market data
INSERT INTO cape_town_market_data (
    area,
    property_type,
    price_range,
    occupancy_rate,
    competitor_count,
    demand_supply_ratio
) VALUES (
    'Century City',
    'apartment',
    '{"min": 1000, "max": 2000, "avg": 1500}'::jsonb,
    85.5,
    120,
    1.2
);

-- Insert test competitor
INSERT INTO cape_town_competitors (
    area,
    property_type,
    external_id,
    platform,
    current_price,
    bedrooms
) VALUES (
    'Century City',
    'apartment',
    'TEST123',
    'Airbnb',
    1500,
    2
);

-- Insert test trend
INSERT INTO cape_town_market_trends (
    area,
    trend_type,
    trend_value,
    trend_direction,
    start_date,
    end_date
) VALUES (
    'Century City',
    'price_trend',
    5.5,
    'increasing',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE
);

-- Insert test area stats
INSERT INTO cape_town_area_stats (
    area,
    total_properties,
    avg_daily_rate,
    avg_occupancy,
    investment_score
) VALUES (
    'Century City',
    150,
    1800.50,
    82.5,
    8.5
);

-- Verify the insertions
SELECT 'Market Data' as table_name, COUNT(*) as count FROM cape_town_market_data
UNION ALL
SELECT 'Competitors' as table_name, COUNT(*) as count FROM cape_town_competitors
UNION ALL
SELECT 'Market Trends' as table_name, COUNT(*) as count FROM cape_town_market_trends
UNION ALL
SELECT 'Area Stats' as table_name, COUNT(*) as count FROM cape_town_area_stats;

ROLLBACK;
