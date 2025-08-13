-- Check user data ownership in Supabase
-- Run this in your Supabase SQL editor to verify your data

-- First, let's see all users in the system
SELECT 
    id,
    email,
    created_at,
    updated_at
FROM auth.users
ORDER BY created_at DESC;

-- Check properties table structure and data
SELECT 
    id,
    name,
    location,
    owner_id,
    created_at,
    updated_at
FROM properties
ORDER BY created_at DESC;

-- Check services table structure and data
SELECT 
    id,
    name,
    provider,
    owner_id,
    property_id,
    created_at,
    updated_at
FROM services
ORDER BY created_at DESC;

-- Count properties per user
SELECT 
    owner_id,
    COUNT(*) as property_count
FROM properties
GROUP BY owner_id
ORDER BY property_count DESC;

-- Count services per user
SELECT 
    owner_id,
    COUNT(*) as service_count
FROM services
GROUP BY owner_id
ORDER BY service_count DESC;

-- Check if there are any properties/services without owner_id
SELECT 'Properties without owner_id' as issue, COUNT(*) as count
FROM properties 
WHERE owner_id IS NULL
UNION ALL
SELECT 'Services without owner_id' as issue, COUNT(*) as count
FROM services 
WHERE owner_id IS NULL;

-- Check RLS policies
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
WHERE tablename IN ('properties', 'services')
ORDER BY tablename, policyname; 