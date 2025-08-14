-- Re-enable RLS after successful testing
-- Run this once you confirm Railway can access data properly

-- ===========================================
-- RE-ENABLE RLS ON ALL TABLES
-- ===========================================

-- Re-enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on properties table  
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on expenses table
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- VERIFY RLS STATUS
-- ===========================================

-- Check which tables have RLS enabled/disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'properties', 'services', 'bookings', 'expenses')
ORDER BY tablename;

-- ===========================================
-- NEXT STEPS
-- ===========================================

/*
After re-enabling RLS, you'll need to:

1. Create proper JWT-based RLS policies
2. Ensure Railway can set JWT context properly
3. Test that user isolation still works
4. Verify security is maintained

This is the final step to restore full database security.
*/
