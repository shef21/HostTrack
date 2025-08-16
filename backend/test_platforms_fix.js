// ===== TEST PLATFORMS COLUMN FIX =====
// This script tests if the platforms column is working correctly

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

async function testPlatformsFix() {
    console.log('🧪 Testing platforms column fix...');
    
    try {
        // Get Supabase credentials
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials');
        }
        
        console.log('🔧 Connecting to Supabase...');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test 1: Check if platforms column exists
        console.log('\n📋 Test 1: Checking if platforms column exists...');
        const { data: properties, error } = await supabase
            .from('properties')
            .select('id, name, platforms')
            .limit(5);
        
        if (error) {
            throw new Error(`Failed to fetch properties: ${error.message}`);
        }
        
        console.log('✅ Properties fetched successfully');
        properties.forEach(prop => {
            console.log(`  - ${prop.name}: platforms = ${JSON.stringify(prop.platforms)}`);
        });
        
        // Test 2: Try to create a property with platforms
        console.log('\n📋 Test 2: Testing property creation with platforms...');
        
        // First, get a user ID for testing
        const { data: users, error: userError } = await supabase.auth.getUser();
        if (userError) {
            console.log('⚠️ Could not get current user, skipping creation test');
        } else {
            console.log('✅ User authenticated, testing property creation...');
            
            // Try to create a test property with platforms
            const testProperty = {
                name: 'Test Property - Platforms Fix',
                location: 'Test Location',
                type: 'apartment',
                price: 1200,
                bedrooms: 2,
                bathrooms: 1,
                max_guests: 4,
                platforms: ['Airbnb', 'Booking.com']
            };
            
            console.log('🔧 Creating test property:', testProperty);
            
            const { data: createdProperty, error: createError } = await supabase
                .from('properties')
                .insert(testProperty)
                .select()
                .single();
            
            if (createError) {
                console.log('⚠️ Property creation failed (this might be expected):', createError.message);
            } else {
                console.log('✅ Test property created successfully!');
                console.log('  - ID:', createdProperty.id);
                console.log('  - Platforms:', createdProperty.platforms);
                
                // Clean up - delete the test property
                const { error: deleteError } = await supabase
                    .from('properties')
                    .delete()
                    .eq('id', createdProperty.id);
                
                if (deleteError) {
                    console.log('⚠️ Could not delete test property:', deleteError.message);
                } else {
                    console.log('✅ Test property cleaned up');
                }
            }
        }
        
        // Test 3: Check if existing properties can be updated with platforms
        console.log('\n📋 Test 3: Testing platform updates on existing properties...');
        
        if (properties.length > 0) {
            const firstProperty = properties[0];
            console.log(`🔧 Updating property "${firstProperty.name}" with platforms...`);
            
            const { data: updatedProperty, error: updateError } = await supabase
                .from('properties')
                .update({ 
                    platforms: ['Airbnb', 'Manual'],
                    updated_at: new Date().toISOString()
                })
                .eq('id', firstProperty.id)
                .select()
                .single();
            
            if (updateError) {
                console.log('⚠️ Property update failed:', updateError.message);
            } else {
                console.log('✅ Property updated successfully!');
                console.log('  - New platforms:', updatedProperty.platforms);
                
                // Revert the change
                const { error: revertError } = await supabase
                    .from('properties')
                    .update({ 
                        platforms: firstProperty.platforms || [],
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', firstProperty.id);
                
                if (revertError) {
                    console.log('⚠️ Could not revert property:', revertError.message);
                } else {
                    console.log('✅ Property reverted to original state');
                }
            }
        }
        
        console.log('\n🎉 Platforms column fix test completed!');
        console.log('📱 If all tests passed, platform information should now display on property cards.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        console.log('\n💡 Troubleshooting:');
        console.log('1. Make sure you ran the migration script in Supabase SQL Editor');
        console.log('2. Check that the platforms column exists in the properties table');
        console.log('3. Verify your Supabase credentials are correct');
        
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testPlatformsFix();
}

module.exports = { testPlatformsFix };
