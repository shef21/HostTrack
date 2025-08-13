-- =====================================================
-- Fix Foreign Key Constraints for Sample Data Cleanup
-- =====================================================
-- This script adds ON DELETE CASCADE to foreign key constraints
-- allowing related records to be automatically deleted when
-- a parent record (property) is deleted.

-- =====================================================
-- Step 1: Fix Bookings -> Properties relationship
-- =====================================================

-- Drop the existing constraint
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_property_id_fkey;

-- Add the new constraint with CASCADE
ALTER TABLE bookings 
ADD CONSTRAINT bookings_property_id_fkey 
FOREIGN KEY (property_id) 
REFERENCES properties(id) 
ON DELETE CASCADE;

-- =====================================================
-- Step 2: Fix Services -> Properties relationship
-- =====================================================

-- Drop the existing constraint
ALTER TABLE services 
DROP CONSTRAINT IF EXISTS services_property_id_fkey;

-- Add the new constraint with CASCADE
ALTER TABLE services 
ADD CONSTRAINT services_property_id_fkey 
FOREIGN KEY (property_id) 
REFERENCES properties(id) 
ON DELETE CASCADE;

-- =====================================================
-- Step 3: Fix Expenses -> Properties relationship
-- =====================================================

-- Drop the existing constraint
ALTER TABLE expenses 
DROP CONSTRAINT IF EXISTS expenses_property_id_fkey;

-- Add the new constraint with CASCADE
ALTER TABLE expenses 
ADD CONSTRAINT expenses_property_id_fkey 
FOREIGN KEY (property_id) 
REFERENCES properties(id) 
ON DELETE CASCADE;

-- =====================================================
-- Step 4: Fix Expenses -> Services relationship
-- =====================================================

-- Drop the existing constraint
ALTER TABLE expenses 
DROP CONSTRAINT IF EXISTS expenses_service_id_fkey;

-- Add the new constraint with CASCADE
ALTER TABLE expenses 
ADD CONSTRAINT expenses_service_id_fkey 
FOREIGN KEY (service_id) 
REFERENCES services(id) 
ON DELETE CASCADE;

-- =====================================================
-- Verification: Check the new constraints
-- =====================================================

-- List all foreign key constraints for verification
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('bookings', 'services', 'expenses')
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- Optional: Clean up sample data after constraints are fixed
-- =====================================================

-- Uncomment these lines AFTER running the constraint fixes above
-- and verifying they were applied successfully

/*
-- Delete sample data (this will now work with CASCADE)
DELETE FROM properties WHERE name LIKE '%Sample%' OR name LIKE '%Test%';

-- Verify deletion
SELECT COUNT(*) as remaining_properties FROM properties;
SELECT COUNT(*) as remaining_bookings FROM bookings;
SELECT COUNT(*) as remaining_services FROM services;
SELECT COUNT(*) as remaining_expenses FROM expenses;
*/
