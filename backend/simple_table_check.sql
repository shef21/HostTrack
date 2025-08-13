-- Simple Table Check
-- This will show all tables in your database

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name; 