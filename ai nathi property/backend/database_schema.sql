-- AI Nathi Property Database Schema
-- Run this in your Supabase SQL editor

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create conversation_messages table
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_memory table
CREATE TABLE IF NOT EXISTS user_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create scraped_properties table
CREATE TABLE IF NOT EXISTS scraped_properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source TEXT NOT NULL,
    property_data JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Host Track Tables (Shared with Host Track Dashboard)
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'studio', 'condo', 'townhouse', 'other')),
    bedrooms INTEGER NOT NULL,
    bathrooms DECIMAL(2,1) NOT NULL,
    square_feet INTEGER,
    amenities TEXT[],
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'ZAR',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'sold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    guest_email TEXT,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nights INTEGER NOT NULL,
    guests INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'ZAR',
    platform TEXT NOT NULL CHECK (platform IN ('airbnb', 'booking', 'vrbo', 'direct', 'other')),
    booking_reference TEXT,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create pricing_rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('base_price', 'weekend_multiplier', 'seasonal', 'minimum_stay', 'last_minute')),
    start_date DATE,
    end_date DATE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    multiplier DECIMAL(3,2) DEFAULT 1.0,
    fixed_price DECIMAL(10,2),
    minimum_nights INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create market_data table
CREATE TABLE IF NOT EXISTS market_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    city TEXT NOT NULL,
    property_type TEXT NOT NULL,
    date DATE NOT NULL,
    average_price DECIMAL(10,2) NOT NULL,
    occupancy_rate DECIMAL(5,2) NOT NULL,
    total_listings INTEGER NOT NULL,
    new_listings INTEGER NOT NULL,
    price_trend DECIMAL(5,2) NOT NULL, -- Percentage change from previous period
    occupancy_trend DECIMAL(5,2) NOT NULL, -- Percentage change from previous period
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
    occupancy_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    average_daily_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    revpar DECIMAL(10,2) NOT NULL DEFAULT 0, -- Revenue per available room
    bookings_count INTEGER NOT NULL DEFAULT 0,
    cancellation_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create vector_embeddings table
CREATE TABLE IF NOT EXISTS vector_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('conversation', 'memory', 'property')),
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-small dimension
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_id ON conversation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_timestamp ON conversation_messages(timestamp);

CREATE INDEX IF NOT EXISTS idx_user_memory_user_id ON user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_category ON user_memory(category);
CREATE INDEX IF NOT EXISTS idx_user_memory_created_at ON user_memory(created_at);

CREATE INDEX IF NOT EXISTS idx_scraped_properties_source ON scraped_properties(source);
CREATE INDEX IF NOT EXISTS idx_scraped_properties_processed_at ON scraped_properties(processed_at);

-- Host Track indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);

CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_check_out ON bookings(check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_platform ON bookings(platform);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_property_id ON pricing_rules(property_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_rule_type ON pricing_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_dates ON pricing_rules(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_market_data_city ON market_data(city);
CREATE INDEX IF NOT EXISTS idx_market_data_date ON market_data(date);
CREATE INDEX IF NOT EXISTS idx_market_data_property_type ON market_data(property_type);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_property_id ON performance_metrics(property_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(date);

CREATE INDEX IF NOT EXISTS idx_vector_embeddings_content_id ON vector_embeddings(content_id);
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_content_type ON vector_embeddings(content_type);

-- Create vector similarity search index
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_embedding ON vector_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable Row Level Security (RLS)
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE vector_embeddings ENABLE ROW LEVEL SECURITY;

-- Host Track RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (for MVP, we'll use simple policies)
-- In production, you'd want more sophisticated user-based policies

-- Allow all operations for now (MVP)
CREATE POLICY "Allow all operations on conversation_messages" ON conversation_messages
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on user_memory" ON user_memory
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on scraped_properties" ON scraped_properties
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on vector_embeddings" ON vector_embeddings
    FOR ALL USING (true);

-- Host Track RLS policies (for MVP, we'll use simple policies)
-- In production, you'd want more sophisticated user-based policies

CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on properties" ON properties
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on bookings" ON bookings
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on pricing_rules" ON pricing_rules
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on market_data" ON market_data
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on performance_metrics" ON performance_metrics
    FOR ALL USING (true);

-- Create a function to search similar embeddings
CREATE OR REPLACE FUNCTION search_similar_embeddings(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    content_id uuid,
    content_type text,
    content text,
    similarity float
)
LANGUAGE sql
AS $$
    SELECT
        content_id,
        content_type,
        content,
        1 - (embedding <=> query_embedding) AS similarity
    FROM vector_embeddings
    WHERE 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;
