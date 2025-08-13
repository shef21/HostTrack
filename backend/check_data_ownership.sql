-- Check Data Ownership
-- This will show the owner_id values in your data

SELECT 'properties' as table_name, owner_id, COUNT(*) as count 
FROM properties 
GROUP BY owner_id
UNION ALL
SELECT 'services' as table_name, owner_id, COUNT(*) as count 
FROM services 
GROUP BY owner_id
UNION ALL
SELECT 'bookings' as table_name, owner_id, COUNT(*) as count 
FROM bookings 
GROUP BY owner_id
UNION ALL
SELECT 'expenses' as table_name, owner_id, COUNT(*) as count 
FROM expenses 
GROUP BY owner_id
ORDER BY table_name, owner_id; 