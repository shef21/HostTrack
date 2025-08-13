-- Sustainable RLS Setup for HostTrack
-- This script creates RLS policies that work with the service role approach

-- ========================================
-- PROFILES TABLE
-- ========================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Create policies (these will be used by frontend, backend uses service role)
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- ========================================
-- PROPERTIES TABLE
-- ========================================

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "properties_select_policy" ON properties;
DROP POLICY IF EXISTS "properties_insert_policy" ON properties;
DROP POLICY IF EXISTS "properties_update_policy" ON properties;
DROP POLICY IF EXISTS "properties_delete_policy" ON properties;

-- Create policies
CREATE POLICY "properties_select_policy" ON properties
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "properties_insert_policy" ON properties
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "properties_update_policy" ON properties
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "properties_delete_policy" ON properties
    FOR DELETE USING (auth.uid() = owner_id);

-- ========================================
-- SERVICES TABLE
-- ========================================

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "services_select_policy" ON services;
DROP POLICY IF EXISTS "services_insert_policy" ON services;
DROP POLICY IF EXISTS "services_update_policy" ON services;
DROP POLICY IF EXISTS "services_delete_policy" ON services;

-- Create policies
CREATE POLICY "services_select_policy" ON services
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "services_insert_policy" ON services
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "services_update_policy" ON services
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "services_delete_policy" ON services
    FOR DELETE USING (auth.uid() = owner_id);

-- ========================================
-- BOOKINGS TABLE (if exists)
-- ========================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bookings') THEN
        -- Enable RLS
        EXECUTE 'ALTER TABLE bookings ENABLE ROW LEVEL SECURITY';
        
        -- Drop existing policies
        EXECUTE 'DROP POLICY IF EXISTS "bookings_select_policy" ON bookings';
        EXECUTE 'DROP POLICY IF EXISTS "bookings_insert_policy" ON bookings';
        EXECUTE 'DROP POLICY IF EXISTS "bookings_update_policy" ON bookings';
        EXECUTE 'DROP POLICY IF EXISTS "bookings_delete_policy" ON bookings';
        
        -- Create policies
        EXECUTE 'CREATE POLICY "bookings_select_policy" ON bookings FOR SELECT USING (auth.uid() = owner_id)';
        EXECUTE 'CREATE POLICY "bookings_insert_policy" ON bookings FOR INSERT WITH CHECK (auth.uid() = owner_id)';
        EXECUTE 'CREATE POLICY "bookings_update_policy" ON bookings FOR UPDATE USING (auth.uid() = owner_id)';
        EXECUTE 'CREATE POLICY "bookings_delete_policy" ON bookings FOR DELETE USING (auth.uid() = owner_id)';
    END IF;
END $$;

-- ========================================
-- EXPENSES TABLE (if exists)
-- ========================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') THEN
        -- Enable RLS
        EXECUTE 'ALTER TABLE expenses ENABLE ROW LEVEL SECURITY';
        
        -- Drop existing policies
        EXECUTE 'DROP POLICY IF EXISTS "expenses_select_policy" ON expenses';
        EXECUTE 'DROP POLICY IF EXISTS "expenses_insert_policy" ON expenses';
        EXECUTE 'DROP POLICY IF EXISTS "expenses_update_policy" ON expenses';
        EXECUTE 'DROP POLICY IF EXISTS "expenses_delete_policy" ON expenses';
        
        -- Create policies
        EXECUTE 'CREATE POLICY "expenses_select_policy" ON expenses FOR SELECT USING (auth.uid() = owner_id)';
        EXECUTE 'CREATE POLICY "expenses_insert_policy" ON expenses FOR INSERT WITH CHECK (auth.uid() = owner_id)';
        EXECUTE 'CREATE POLICY "expenses_update_policy" ON expenses FOR UPDATE USING (auth.uid() = owner_id)';
        EXECUTE 'CREATE POLICY "expenses_delete_policy" ON expenses FOR DELETE USING (auth.uid() = owner_id)';
    END IF;
END $$;

-- ========================================
-- VERIFICATION
-- ========================================

-- Show all created policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('profiles', 'properties', 'services', 'bookings', 'expenses')
ORDER BY tablename, policyname; 