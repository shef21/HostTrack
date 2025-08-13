-- Fix RLS Policies for Services Table
-- This script enables proper access for authenticated users

-- Enable RLS on services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own services" ON services;
DROP POLICY IF EXISTS "Users can insert their own services" ON services;
DROP POLICY IF EXISTS "Users can update their own services" ON services;
DROP POLICY IF EXISTS "Users can delete their own services" ON services;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own services" ON services
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own services" ON services
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own services" ON services
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own services" ON services
    FOR DELETE USING (auth.uid() = owner_id);

-- Grant necessary permissions
GRANT ALL ON services TO authenticated;
GRANT ALL ON services TO service_role; 