-- TEMPORARY: Disable RLS for Testing CSV Import
-- This script disables RLS completely to test if that's the cause of 500 errors
-- WARNING: This removes security - only use for testing!

-- ========================================
-- DISABLE RLS ON ALL TABLES
-- ========================================

-- Properties table
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
RAISE NOTICE '✅ RLS disabled on properties table';

-- Services table  
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
RAISE NOTICE '✅ RLS disabled on services table';

-- Bookings table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bookings') THEN
        EXECUTE 'ALTER TABLE bookings DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE '✅ RLS disabled on bookings table';
    ELSE
        RAISE NOTICE '⚠️ Bookings table does not exist';
    END IF;
END $$;

-- Expenses table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') THEN
        EXECUTE 'ALTER TABLE expenses DISABLE RLS';
        RAISE NOTICE '✅ RLS disabled on expenses table';
    ELSE
        RAISE NOTICE '⚠️ Expenses table does not exist';
    END IF;
END $$;

-- Profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
RAISE NOTICE '✅ RLS disabled on profiles table';

-- ========================================
-- SUMMARY
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '⚠️ WARNING: RLS is now DISABLED on all tables!';
    RAISE NOTICE '⚠️ This removes database-level security - backend must handle all security!';
    RAISE NOTICE '✅ CSV import should now work without 500 errors';
    RAISE NOTICE '🔒 Remember to re-enable RLS after testing!';
END $$;
