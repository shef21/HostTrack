require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function executeMigration() {
    console.log('🔧 Starting Cape Town market intelligence tables migration...');
    
    try {
        // Get Supabase credentials from environment
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase credentials in environment variables');
        }
        
        console.log('🔧 Connecting to Supabase with service role...');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Read the migration SQL file
        const migrationPath = path.join(__dirname, 'migrations', 'cape_town_market_tables.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('🔧 Executing migration SQL...');
        
        // Split the SQL into separate statements
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
        
        // Execute each statement separately
        for (const statement of statements) {
            if (!statement.trim()) continue;
            
            try {
                const { error } = await supabase.rpc('exec_sql', {
                    sql: statement.trim() + ';'
                });
                
                if (error) {
                    console.error('⚠️ Statement execution error:', error.message);
                    console.error('Statement:', statement.trim());
                    throw error;
                }
            } catch (stmtError) {
                console.error('⚠️ Failed to execute statement:', stmtError.message);
                console.error('Statement:', statement.trim());
                throw stmtError;
            }
        }
        
        // Verify the tables were created
        console.log('🔧 Verifying table creation...');
        
        const tables = [
            'cape_town_market_data',
            'cape_town_competitors',
            'cape_town_market_trends',
            'cape_town_area_stats'
        ];
        
        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('id')
                .limit(1);
                
            if (error) {
                throw new Error(`Table verification failed for ${table}: ${error.message}`);
            }
            console.log(`✅ Table ${table} created successfully!`);
        }
        
        console.log('\n🎉 Migration completed successfully!');
        console.log('📊 Cape Town market intelligence tables are ready to use.');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        console.log('\n💡 Alternative solution:');
        console.log('1. Open your Supabase dashboard');
        console.log('2. Go to the SQL Editor');
        console.log('3. Copy and paste the contents of backend/migrations/cape_town_market_tables.sql');
        console.log('4. Execute the SQL manually');
        
        process.exit(1);
    }
}

// Run the migration
if (require.main === module) {
    executeMigration();
}

module.exports = { executeMigration };
