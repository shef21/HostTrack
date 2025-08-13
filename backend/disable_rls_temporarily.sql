-- Temporarily disable RLS to restore access to original data
-- Run this in your Supabase SQL editor to get back to your working system

-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;

-- Disable RLS on other tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bookings') THEN
        EXECUTE 'ALTER TABLE bookings DISABLE ROW LEVEL SECURITY';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') THEN
        EXECUTE 'ALTER TABLE expenses DISABLE ROW LEVEL SECURITY';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'analytics') THEN
        EXECUTE 'ALTER TABLE analytics DISABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- This will restore access to your original data
-- Your backend will still work because it uses the service role key 