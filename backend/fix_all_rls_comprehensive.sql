-- Comprehensive RLS Fix for All Tables
-- This script fixes RLS policies for profiles, properties, and services

-- ========================================
-- PROFILES TABLE
-- ========================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON profiles;

-- Create comprehensive policies for profiles
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

-- Enable RLS on properties table
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on properties
DROP POLICY IF EXISTS "Users can view their own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON properties;
DROP POLICY IF EXISTS "Enable update for users based on email" ON properties;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON properties;

-- Create comprehensive policies for properties
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

-- Enable RLS on services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on services
DROP POLICY IF EXISTS "Users can view their own services" ON services;
DROP POLICY IF EXISTS "Users can insert their own services" ON services;
DROP POLICY IF EXISTS "Users can update their own services" ON services;
DROP POLICY IF EXISTS "Users can delete their own services" ON services;
DROP POLICY IF EXISTS "Enable read access for all users" ON services;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON services;
DROP POLICY IF EXISTS "Enable update for users based on email" ON services;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON services;

-- Create comprehensive policies for services
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

-- Check if bookings table exists and apply RLS
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bookings') THEN
        -- Enable RLS on bookings table
        EXECUTE 'ALTER TABLE bookings ENABLE ROW LEVEL SECURITY';
        
        -- Drop existing policies
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings';
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings';
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings';
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings';
        
        -- Create policies for bookings
        EXECUTE 'CREATE POLICY "bookings_select_policy" ON bookings FOR SELECT USING (auth.uid() = owner_id)';
        EXECUTE 'CREATE POLICY "bookings_insert_policy" ON bookings FOR INSERT WITH CHECK (auth.uid() = owner_id)';
        EXECUTE 'CREATE POLICY "bookings_update_policy" ON bookings FOR UPDATE USING (auth.uid() = owner_id)';
        EXECUTE 'CREATE POLICY "bookings_delete_policy" ON bookings FOR DELETE USING (auth.uid() = owner_id)';
    END IF;
END $$;

-- ========================================
-- EXPENSES TABLE (if exists)
-- ========================================

-- Check if expenses table exists and apply RLS
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') THEN
        -- Enable RLS on expenses table
        EXECUTE 'ALTER TABLE expenses ENABLE ROW LEVEL SECURITY';
        
        -- Drop existing policies
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses';
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses';
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses';
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses';
        
        -- Create policies for expenses
        EXECUTE 'CREATE POLICY "expenses_select_policy" ON expenses FOR SELECT USING (auth.uid() = owner_id)';
        EXECUTE 'CREATE POLICY "expenses_insert_policy" ON expenses FOR INSERT WITH CHECK (auth.uid() = owner_id)';
        EXECUTE 'CREATE POLICY "expenses_update_policy" ON expenses FOR UPDATE USING (auth.uid() = owner_id)';
        EXECUTE 'CREATE POLICY "expenses_delete_policy" ON expenses FOR DELETE USING (auth.uid() = owner_id)';
    END IF;
END $$;

-- ========================================
-- VERIFICATION
-- ========================================

-- Show all policies for verification
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('profiles', 'properties', 'services', 'bookings', 'expenses')
ORDER BY tablename, policyname; 