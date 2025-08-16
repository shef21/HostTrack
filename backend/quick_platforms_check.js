// ===== QUICK PLATFORMS COLUMN CHECK =====
// This script quickly checks if the platforms column exists

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

async function checkPlatformsColumn() {
    console.log('🔍 Checking if platforms column exists...');
    
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials');
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Try to fetch properties with platforms field
        const { data: properties, error } = await supabase
            .from('properties')
            .select('id, name, platforms')
            .limit(1);
        
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        
        if (properties && properties.length > 0) {
            const property = properties[0];
            console.log('✅ Properties table accessible');
            console.log(`📋 Sample property: ${property.name}`);
            console.log(`🔍 Platforms field: ${JSON.stringify(property.platforms)}`);
            
            if (property.hasOwnProperty('platforms')) {
                console.log('✅ Platforms column EXISTS!');
                console.log('🎉 Platform information should now display on property cards');
            } else {
                console.log('❌ Platforms column MISSING');
                console.log('💡 You need to add the platforms column to the database');
            }
        } else {
            console.log('ℹ️ No properties found in database');
        }
        
    } catch (error) {
        console.error('❌ Check failed:', error.message);
        console.log('\n💡 To fix the platforms issue:');
        console.log('1. Go to Supabase SQL Editor');
        console.log('2. Run: ALTER TABLE properties ADD COLUMN IF NOT EXISTS platforms JSONB DEFAULT \'[]\'::jsonb;');
    }
}

// Run the check
if (require.main === module) {
    checkPlatformsColumn();
}

module.exports = { checkPlatformsColumn };
