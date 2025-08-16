// ===== EXECUTE PLATFORMS COLUMN MIGRATION =====
// This script adds the missing platforms column to the properties table

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

async function executeMigration() {
    console.log('🔧 Starting platforms column migration...');
    
    try {
        // Get Supabase credentials from environment
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials in environment variables');
        }
        
        console.log('🔧 Connecting to Supabase...');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Read the migration SQL file
        const fs = require('fs');
        const path = require('path');
        const migrationPath = path.join(__dirname, 'add_platforms_column.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('🔧 Executing migration SQL...');
        
        // Execute the migration using Supabase's rpc function
        // We'll use a custom function since we can't execute DDL directly
        const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: migrationSQL 
        });
        
        if (error) {
            // If the rpc function doesn't exist, we'll need to use the service role key
            console.log('⚠️ RPC method not available, trying direct connection...');
            
            // Try using the service role key for direct database access
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (!serviceRoleKey) {
                throw new Error('Service role key required for DDL operations');
            }
            
            const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
            
            // Execute the migration in parts
            console.log('🔧 Adding platforms column...');
            
            // Check if column exists
            const { data: columnCheck, error: checkError } = await adminSupabase
                .from('properties')
                .select('*')
                .limit(1);
            
            if (checkError) {
                throw new Error(`Database connection failed: ${checkError.message}`);
            }
            
            // Add the platforms column
            const { error: alterError } = await adminSupabase.rpc('exec_sql', {
                sql: 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS platforms JSONB DEFAULT \'[]\'::jsonb'
            });
            
            if (alterError) {
                // Try alternative approach - create a new table with the column
                console.log('🔧 Trying alternative approach...');
                throw new Error(`Column addition failed: ${alterError.message}`);
            }
            
            console.log('✅ Platforms column added successfully!');
            
        } else {
            console.log('✅ Migration executed successfully via RPC!');
        }
        
        // Verify the column was added
        console.log('🔧 Verifying column addition...');
        const { data: properties, error: verifyError } = await supabase
            .from('properties')
            .select('id, name, platforms')
            .limit(5);
        
        if (verifyError) {
            throw new Error(`Verification failed: ${verifyError.message}`);
        }
        
        console.log('✅ Verification successful! Sample properties with platforms:');
        properties.forEach(prop => {
            console.log(`  - ${prop.name}: platforms = ${JSON.stringify(prop.platforms)}`);
        });
        
        console.log('\n🎉 Migration completed successfully!');
        console.log('📱 Platform information should now display on property cards.');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Provide alternative solution
        console.log('\n💡 Alternative solution:');
        console.log('1. Connect to your Supabase database directly');
        console.log('2. Run this SQL command:');
        console.log('   ALTER TABLE properties ADD COLUMN IF NOT EXISTS platforms JSONB DEFAULT \'[]\'::jsonb;');
        console.log('3. Restart your application');
        
        process.exit(1);
    }
}

// Run the migration
if (require.main === module) {
    executeMigration();
}

module.exports = { executeMigration };
