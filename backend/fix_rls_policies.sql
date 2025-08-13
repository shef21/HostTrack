-- Fix RLS Policies for Properties Table
-- This script enables proper access for authenticated users

-- Enable RLS on properties table
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own properties" ON properties
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own properties" ON properties
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own properties" ON properties
    FOR DELETE USING (auth.uid() = owner_id);

-- Grant necessary permissions
GRANT ALL ON properties TO authenticated;
GRANT ALL ON properties TO service_role; 