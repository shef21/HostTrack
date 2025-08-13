-- Check Data Counts
-- This will show how many records exist in each table

SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles
UNION ALL
SELECT 'properties' as table_name, COUNT(*) as record_count FROM properties
UNION ALL
SELECT 'services' as table_name, COUNT(*) as record_count FROM services
UNION ALL
SELECT 'bookings' as table_name, COUNT(*) as record_count FROM bookings
UNION ALL
SELECT 'expenses' as table_name, COUNT(*) as record_count FROM expenses
ORDER BY table_name; 