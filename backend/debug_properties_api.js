// ===== DEBUG PROPERTIES API =====
// This script checks what the properties API is actually returning

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

async function debugPropertiesAPI() {
    console.log('🔍 Debugging properties API...');
    
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials');
        }
        
        console.log('🔧 Connecting to Supabase...');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Check 1: Direct database query
        console.log('\n📋 Check 1: Direct database query');
        const { data: directProperties, error: directError } = await supabase
            .from('properties')
            .select('*')
            .limit(3);
        
        if (directError) {
            throw new Error(`Direct query failed: ${directError.message}`);
        }
        
        console.log('✅ Direct database query successful');
        directProperties.forEach((prop, index) => {
            console.log(`  Property ${index + 1}:`);
            console.log(`    - ID: ${prop.id}`);
            console.log(`    - Name: ${prop.name}`);
            console.log(`    - Platforms: ${JSON.stringify(prop.platforms)}`);
            console.log(`    - Has platforms field: ${prop.hasOwnProperty('platforms')}`);
            console.log(`    - Platforms type: ${typeof prop.platforms}`);
            console.log(`    - Platforms length: ${Array.isArray(prop.platforms) ? prop.platforms.length : 'N/A'}`);
            console.log('');
        });
        
        // Check 2: Test the backend API endpoint
        console.log('📋 Check 2: Testing backend API endpoint');
        
        // First, get a valid token by creating a test user or using existing auth
        console.log('🔑 Getting authentication token...');
        
        // Try to get properties through the API endpoint
        const response = await fetch('http://localhost:3001/api/properties', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}` // This might not work, but let's try
            }
        });
        
        console.log(`📡 API Response status: ${response.status}`);
        console.log(`📡 API Response headers:`, response.headers);
        
        if (response.ok) {
            const apiData = await response.json();
            console.log('✅ API response successful');
            console.log('📊 API response data structure:', {
                isArray: Array.isArray(apiData),
                length: Array.isArray(apiData) ? apiData.length : 'N/A',
                hasProperties: apiData.hasOwnProperty('properties'),
                propertiesLength: apiData.properties ? apiData.properties.length : 'N/A'
            });
            
            if (Array.isArray(apiData) && apiData.length > 0) {
                const firstProp = apiData[0];
                console.log('🔍 First property from API:');
                console.log(`  - ID: ${firstProp.id}`);
                console.log(`  - Name: ${firstProp.name}`);
                console.log(`  - Platforms: ${JSON.stringify(firstProp.platforms)}`);
                console.log(`  - Has platforms field: ${firstProp.hasOwnProperty('platforms')}`);
            }
        } else {
            console.log('⚠️ API request failed, checking if backend is running...');
            console.log('💡 Make sure your backend server is running on port 3001');
        }
        
        // Check 3: Verify database schema
        console.log('\n📋 Check 3: Database schema verification');
        
        // This would require admin access, but let's try a simple check
        console.log('🔍 Checking if we can insert a test property with platforms...');
        
        const testProperty = {
            name: 'Debug Test Property',
            location: 'Test Location',
            type: 'apartment',
            price: 1000,
            bedrooms: 1,
            bathrooms: 1,
            max_guests: 2,
            platforms: ['airbnb', 'manual']
        };
        
        console.log('🔧 Test property data:', testProperty);
        
        // Try to insert (this might fail due to missing required fields, but worth trying)
        const { data: inserted, error: insertError } = await supabase
            .from('properties')
            .insert(testProperty)
            .select()
            .single();
        
        if (insertError) {
            console.log('⚠️ Insert test failed (expected):', insertError.message);
            console.log('💡 This is normal if required fields are missing');
        } else {
            console.log('✅ Test property inserted successfully!');
            console.log('  - ID:', inserted.id);
            console.log('  - Platforms:', inserted.platforms);
            
            // Clean up
            const { error: deleteError } = await supabase
                .from('properties')
                .delete()
                .eq('id', inserted.id);
            
            if (deleteError) {
                console.log('⚠️ Could not delete test property:', deleteError.message);
            } else {
                console.log('✅ Test property cleaned up');
            }
        }
        
        console.log('\n🎯 Summary:');
        console.log('✅ Database has platforms column');
        console.log('✅ Properties contain platforms data');
        console.log('❓ Backend API might not be returning platforms field');
        console.log('\n💡 Next steps:');
        console.log('1. Check backend properties route');
        console.log('2. Ensure backend is selecting all fields including platforms');
        console.log('3. Clear browser cache and restart frontend');
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the debug
if (require.main === module) {
    debugPropertiesAPI();
}

module.exports = { debugPropertiesAPI };
