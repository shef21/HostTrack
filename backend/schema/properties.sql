-- Properties table schema for HostTrack CSV import system
-- Supports cross-platform IDs, amenities, and comprehensive property data

CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(500) NOT NULL,
    type VARCHAR(100) DEFAULT 'apartment',
    price DECIMAL(10,2) DEFAULT 0.00,
    bedrooms INTEGER DEFAULT 1,
    bathrooms INTEGER DEFAULT 1,
    max_guests INTEGER DEFAULT 2,
    amenities TEXT[] DEFAULT '{}',
    description TEXT,
    platform_ids JSONB DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_name ON properties(name);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_platform_ids ON properties USING GIN(platform_ids);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);

-- Create unique constraint for user_id + name + location combination
-- This prevents exact duplicates within the same user account
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_unique_name_location 
ON properties(user_id, LOWER(name), LOWER(location));

-- Enable Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own properties" ON properties
    FOR SELECT USING (user_id = current_setting('app.user_id')::integer);

CREATE POLICY "Users can insert their own properties" ON properties
    FOR INSERT WITH CHECK (user_id = current_setting('app.user_id')::integer);

CREATE POLICY "Users can update their own properties" ON properties
    FOR UPDATE USING (user_id = current_setting('app.user_id')::integer);

CREATE POLICY "Users can delete their own properties" ON properties
    FOR DELETE USING (user_id = current_setting('app.user_id')::integer);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON properties 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to extract platform IDs for searching
CREATE OR REPLACE FUNCTION extract_platform_id(platform_ids JSONB, platform_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN platform_ids->>platform_name;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function for fuzzy name matching (requires pg_trgm extension)
-- This enables similarity searches for property names
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for trigram similarity searches
CREATE INDEX IF NOT EXISTS idx_properties_name_trgm ON properties USING GIN(name gin_trgm_ops);

-- Insert sample data for testing (optional)
INSERT INTO properties (user_id, name, location, type, price, bedrooms, bathrooms, max_guests, amenities, description, platform_ids) VALUES
(1, 'Cape Town Villa', 'Cape Town, Western Cape', 'house', 2500.00, 3, 2, 6, ARRAY['Pool', 'Garden', 'View'], 'Beautiful villa with ocean views', '{"airbnb_id": "CT001", "booking_id": "CT001"}'),
(1, 'Joburg Suite', 'Johannesburg, Gauteng', 'apartment', 1800.00, 2, 1, 4, ARRAY['Gym', 'Security', 'Wifi'], 'Modern apartment in city center', '{"airbnb_id": "JB001"}'),
(1, 'Durban Beach House', 'Durban, KwaZulu-Natal', 'house', 2200.00, 4, 3, 8, ARRAY['Beach Access', 'Pool', 'Braai'], 'Spacious beach house with private pool', '{"booking_id": "DB001"}')
ON CONFLICT (user_id, LOWER(name), LOWER(location)) DO NOTHING;

-- Create view for easy property access with user information
CREATE OR REPLACE VIEW properties_with_user AS
SELECT 
    p.*,
    u.email as user_email,
    u.name as user_name
FROM properties p
JOIN users u ON p.user_id = u.id;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON properties TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE properties_id_seq TO authenticated;
GRANT SELECT ON properties_with_user TO authenticated;

-- Create function to get properties by platform ID
CREATE OR REPLACE FUNCTION get_property_by_platform_id(user_id INTEGER, platform_name TEXT, platform_id TEXT)
RETURNS TABLE(
    id INTEGER,
    name VARCHAR(255),
    location VARCHAR(500),
    type VARCHAR(100),
    price DECIMAL(10,2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    max_guests INTEGER,
    amenities TEXT[],
    description TEXT,
    platform_ids JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.name, p.location, p.type, p.price, 
        p.bedrooms, p.bathrooms, p.max_guests, 
        p.amenities, p.description, p.platform_ids
    FROM properties p
    WHERE p.user_id = $1 
    AND p.platform_ids->>$2 = $3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to search properties by similarity
CREATE OR REPLACE FUNCTION search_properties_similar(
    user_id INTEGER,
    search_name TEXT,
    search_location TEXT,
    similarity_threshold REAL DEFAULT 0.3
)
RETURNS TABLE(
    id INTEGER,
    name VARCHAR(255),
    location VARCHAR(500),
    similarity REAL,
    match_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.name, p.location,
        GREATEST(
            similarity(LOWER(p.name), LOWER(search_name)),
            similarity(LOWER(p.location), LOWER(search_location))
        ) as similarity,
        CASE 
            WHEN LOWER(p.name) = LOWER(search_name) AND LOWER(p.location) = LOWER(search_location) 
            THEN 'exact'
            WHEN similarity(LOWER(p.name), LOWER(search_name)) >= similarity_threshold 
            OR similarity(LOWER(p.location), LOWER(search_location)) >= similarity_threshold
            THEN 'similar'
            ELSE 'none'
        END as match_type
    FROM properties p
    WHERE p.user_id = $1
    AND (
        similarity(LOWER(p.name), LOWER(search_name)) >= similarity_threshold
        OR similarity(LOWER(p.location), LOWER(search_location)) >= similarity_threshold
        OR LOWER(p.name) = LOWER(search_name)
        OR LOWER(p.location) = LOWER(search_location)
    )
    ORDER BY similarity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
