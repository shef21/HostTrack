-- Check Table Structure and Existence
-- This script will show you what tables exist and their structure

DO $$
BEGIN
    RAISE NOTICE '=== TABLE EXISTENCE CHECK ===';
    
    -- Check if tables exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties') THEN
        RAISE NOTICE '✅ Properties table EXISTS';
        RAISE NOTICE 'Properties columns: %', (
            SELECT string_agg(column_name, ', ') 
            FROM information_schema.columns 
            WHERE table_name = 'properties'
        );
    ELSE
        RAISE NOTICE '❌ Properties table DOES NOT EXIST';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'services') THEN
        RAISE NOTICE '✅ Services table EXISTS';
        RAISE NOTICE 'Services columns: %', (
            SELECT string_agg(column_name, ', ') 
            FROM information_schema.columns 
            WHERE table_name = 'services'
        );
    ELSE
        RAISE NOTICE '❌ Services table DOES NOT EXIST';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bookings') THEN
        RAISE NOTICE '✅ Bookings table EXISTS';
        RAISE NOTICE 'Bookings columns: %', (
            SELECT string_agg(column_name, ', ') 
            FROM information_schema.columns 
            WHERE table_name = 'bookings'
        );
    ELSE
        RAISE NOTICE '❌ Bookings table DOES NOT EXIST';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') THEN
        RAISE NOTICE '✅ Expenses table EXISTS';
        RAISE NOTICE 'Expenses columns: %', (
            SELECT string_agg(column_name, ', ') 
            FROM information_schema.columns 
            WHERE table_name = 'expenses'
        );
    ELSE
        RAISE NOTICE '❌ Expenses table DOES NOT EXIST';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE '✅ Profiles table EXISTS';
        RAISE NOTICE 'Profiles columns: %', (
            SELECT string_agg(column_name, ', ') 
            FROM information_schema.columns 
            WHERE table_name = 'profiles'
        );
    ELSE
        RAISE NOTICE '❌ Profiles table DOES NOT EXIST';
    END IF;
    
    RAISE NOTICE '=== END CHECK ===';
END $$; 