-- Update Data Ownership Script
-- This script updates existing data to have the correct owner_id

-- Your user ID
DO $$
DECLARE
    user_id UUID := 'd69b37fc-8ac6-49ae-a7fd-20225446c311';
BEGIN
    -- Update properties table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties') THEN
        UPDATE properties 
        SET owner_id = user_id 
        WHERE owner_id IS NULL OR owner_id != user_id;
        
        RAISE NOTICE 'Updated properties ownership for user: %', user_id;
    END IF;
    
    -- Update services table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'services') THEN
        UPDATE services 
        SET owner_id = user_id 
        WHERE owner_id IS NULL OR owner_id != user_id;
        
        RAISE NOTICE 'Updated services ownership for user: %', user_id;
    END IF;
    
    -- Update bookings table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bookings') THEN
        UPDATE bookings 
        SET owner_id = user_id 
        WHERE owner_id IS NULL OR owner_id != user_id;
        
        RAISE NOTICE 'Updated bookings ownership for user: %', user_id;
    END IF;
    
    -- Update expenses table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') THEN
        UPDATE expenses 
        SET owner_id = user_id 
        WHERE owner_id IS NULL OR owner_id != user_id;
        
        RAISE NOTICE 'Updated expenses ownership for user: %', user_id;
    END IF;
    
    -- Update analytics table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'analytics') THEN
        UPDATE analytics 
        SET owner_id = user_id 
        WHERE owner_id IS NULL OR owner_id != user_id;
        
        RAISE NOTICE 'Updated analytics ownership for user: %', user_id;
    END IF;
    
    RAISE NOTICE 'Data ownership update completed successfully';
END $$; 