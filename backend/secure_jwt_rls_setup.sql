-- Secure JWT-Based RLS Setup for HostTrack
-- This script enables RLS with JWT token authentication for Railway backend
-- Maintains complete user data isolation and security

-- ===========================================
-- HELPER FUNCTION FOR JWT EXTRACTION
-- ===========================================

-- Create function to extract user ID from JWT token
CREATE OR REPLACE FUNCTION get_user_id_from_jwt()
RETURNS UUID AS $$
BEGIN
  -- Extract user ID from JWT claims
  RETURN (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PROFILES TABLE
-- ===========================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Create secure JWT-based policies for profiles
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (get_user_id_from_jwt() = id);

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (get_user_id_from_jwt() = id);

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (get_user_id_from_jwt() = id);

CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE USING (get_user_id_from_jwt() = id);

-- ===========================================
-- PROPERTIES TABLE
-- ===========================================

-- Enable RLS on properties table
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "properties_select_policy" ON properties;
DROP POLICY IF EXISTS "properties_insert_policy" ON properties;
DROP POLICY IF EXISTS "properties_update_policy" ON properties;
DROP POLICY IF EXISTS "properties_delete_policy" ON properties;

-- Create secure JWT-based policies for properties
CREATE POLICY "properties_select_policy" ON properties
    FOR SELECT USING (get_user_id_from_jwt() = owner_id);

CREATE POLICY "properties_insert_policy" ON properties
    FOR INSERT WITH CHECK (get_user_id_from_jwt() = owner_id);

CREATE POLICY "properties_update_policy" ON properties
    FOR UPDATE USING (get_user_id_from_jwt() = owner_id);

CREATE POLICY "properties_delete_policy" ON properties
    FOR DELETE USING (get_user_id_from_jwt() = owner_id);

-- ===========================================
-- SERVICES TABLE
-- ===========================================

-- Enable RLS on services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "services_select_policy" ON services;
DROP POLICY IF EXISTS "services_insert_policy" ON services;
DROP POLICY IF EXISTS "services_update_policy" ON services;
DROP POLICY IF EXISTS "services_delete_policy" ON services;

-- Create secure JWT-based policies for services
CREATE POLICY "services_select_policy" ON services
    FOR SELECT USING (get_user_id_from_jwt() = owner_id);

CREATE POLICY "services_insert_policy" ON services
    FOR INSERT WITH CHECK (get_user_id_from_jwt() = owner_id);

CREATE POLICY "services_update_policy" ON services
    FOR UPDATE USING (get_user_id_from_jwt() = owner_id);

CREATE POLICY "services_delete_policy" ON services
    FOR DELETE USING (get_user_id_from_jwt() = owner_id);

-- ===========================================
-- BOOKINGS TABLE
-- ===========================================

-- Enable RLS on bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "bookings_select_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_insert_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_update_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_delete_policy" ON bookings;

-- Create secure JWT-based policies for bookings
CREATE POLICY "bookings_select_policy" ON bookings
    FOR SELECT USING (get_user_id_from_jwt() = owner_id);

CREATE POLICY "bookings_insert_policy" ON bookings
    FOR INSERT WITH CHECK (get_user_id_from_jwt() = owner_id);

CREATE POLICY "bookings_update_policy" ON bookings
    FOR UPDATE USING (get_user_id_from_jwt() = owner_id);

CREATE POLICY "bookings_delete_policy" ON bookings
    FOR DELETE USING (get_user_id_from_jwt() = owner_id);

-- ===========================================
-- EXPENSES TABLE
-- ===========================================

-- Enable RLS on expenses table
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "expenses_select_policy" ON expenses;
DROP POLICY IF EXISTS "expenses_insert_policy" ON expenses;
DROP POLICY IF EXISTS "expenses_update_policy" ON expenses;
DROP POLICY IF EXISTS "expenses_delete_policy" ON expenses;

-- Create secure JWT-based policies for expenses
CREATE POLICY "expenses_select_policy" ON expenses
    FOR SELECT USING (get_user_id_from_jwt() = owner_id);

CREATE POLICY "expenses_insert_policy" ON expenses
    FOR INSERT WITH CHECK (get_user_id_from_jwt() = owner_id);

CREATE POLICY "expenses_update_policy" ON expenses
    FOR UPDATE USING (get_user_id_from_jwt() = owner_id);

CREATE POLICY "expenses_delete_policy" ON expenses
    FOR DELETE USING (get_user_id_from_jwt() = owner_id);

-- ===========================================
-- SECURITY VERIFICATION
-- ===========================================

-- Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'properties', 'services', 'bookings', 'expenses')
ORDER BY tablename;

-- Verify policies are created
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
WHERE tablename IN ('profiles', 'properties', 'services', 'bookings', 'expenses')
ORDER BY tablename, policyname;

-- ===========================================
-- NOTES FOR RAILWAY IMPLEMENTATION
-- ===========================================

/*
IMPORTANT: For Railway to work with these policies:

1. Railway must set the JWT context before each database query:
   SET LOCAL "request.jwt.claims" = '{"sub": "user-uuid-here"}';

2. The JWT token must contain the user ID in the 'sub' claim

3. All queries must be executed within a transaction that sets the JWT context

4. The get_user_id_from_jwt() function will extract the user ID and apply RLS

This maintains complete security while allowing Railway backend access.
*/
