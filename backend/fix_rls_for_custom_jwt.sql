-- Fix RLS Policies for Custom JWT Tokens
-- This script updates RLS policies to work with the backend's custom JWT authentication

-- ========================================
-- PROPERTIES TABLE - Fix RLS for Custom JWT
-- ========================================

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "properties_select_policy" ON properties;
DROP POLICY IF EXISTS "properties_insert_policy" ON properties;
DROP POLICY IF EXISTS "properties_update_policy" ON properties;
DROP POLICY IF EXISTS "properties_delete_policy" ON properties;

-- Create policies that work with custom JWT tokens
-- These policies will be enforced by the backend, not Supabase auth
CREATE POLICY "properties_select_policy" ON properties
    FOR SELECT USING (true); -- Allow all selects, backend will filter by owner_id

CREATE POLICY "properties_insert_policy" ON properties
    FOR INSERT WITH CHECK (true); -- Allow all inserts, backend will set owner_id

CREATE POLICY "properties_update_policy" ON properties
    FOR UPDATE USING (true); -- Allow all updates, backend will filter by owner_id

CREATE POLICY "properties_delete_policy" ON properties
    FOR DELETE USING (true); -- Allow all deletes, backend will filter by owner_id

-- ========================================
-- SERVICES TABLE - Fix RLS for Custom JWT
-- ========================================

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "services_select_policy" ON services;
DROP POLICY IF EXISTS "services_insert_policy" ON services;
DROP POLICY IF EXISTS "services_update_policy" ON services;
DROP POLICY IF EXISTS "services_delete_policy" ON services;

-- Create policies that work with custom JWT tokens
CREATE POLICY "services_select_policy" ON services
    FOR SELECT USING (true);

CREATE POLICY "services_insert_policy" ON services
    FOR INSERT WITH CHECK (true);

CREATE POLICY "services_update_policy" ON services
    FOR UPDATE USING (true);

CREATE POLICY "services_delete_policy" ON services
    FOR DELETE USING (true);

-- ========================================
-- BOOKINGS TABLE - Fix RLS for Custom JWT
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
        
        -- Create policies that work with custom JWT tokens
        EXECUTE 'CREATE POLICY "bookings_select_policy" ON bookings FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY "bookings_insert_policy" ON bookings FOR INSERT WITH CHECK (true)';
        EXECUTE 'CREATE POLICY "bookings_update_policy" ON bookings FOR UPDATE USING (true)';
        EXECUTE 'CREATE POLICY "bookings_delete_policy" ON bookings FOR DELETE USING (true)';
        
        RAISE NOTICE '✅ Bookings RLS policies updated for custom JWT';
    ELSE
        RAISE NOTICE '⚠️ Bookings table does not exist, skipping';
    END IF;
END $$;

-- ========================================
-- EXPENSES TABLE - Fix RLS for Custom JWT
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
        
        -- Create policies that work with custom JWT tokens
        EXECUTE 'CREATE POLICY "expenses_select_policy" ON expenses FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY "expenses_insert_policy" ON expenses FOR INSERT WITH CHECK (true)';
        EXECUTE 'CREATE POLICY "expenses_update_policy" ON expenses FOR UPDATE USING (true)';
        EXECUTE 'CREATE POLICY "expenses_delete_policy" ON expenses FOR DELETE USING (true)';
        
        RAISE NOTICE '✅ Expenses RLS policies updated for custom JWT';
    ELSE
        RAISE NOTICE '⚠️ Expenses table does not exist, skipping';
    END IF;
END $$;

-- ========================================
-- PROFILES TABLE - Fix RLS for Custom JWT
-- ========================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Create policies that work with custom JWT tokens
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (true);

CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE USING (true);

-- ========================================
-- SUMMARY
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies updated for custom JWT authentication';
    RAISE NOTICE '⚠️ IMPORTANT: Security is now handled by the backend application';
    RAISE NOTICE '⚠️ Backend must validate user ownership before database operations';
    RAISE NOTICE '✅ CSV import should now work without 500 errors';
END $$;
