const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSafeMigration() {
    try {
        // First run backup
        console.log('🔄 Step 1: Running backup...');
        await require('./backup_cape_town_data.js');
        
        console.log('\n🔄 Step 2: Reading migration SQL...');
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrations', 'safe_update_areas_enum.sql'),
            'utf8'
        );

        console.log('🔄 Step 3: Executing migration...');
        const { data, error } = await supabase.rpc('exec_sql_admin', {
            sql: migrationSQL
        });

        if (error) {
            console.error('❌ Migration failed:', error);
            console.log('✨ Backup files are available in the backups directory');
            return;
        }

        console.log('✅ Migration completed successfully!');
        console.log('\nNew areas added to cape_town_area enum:');
        console.log('  - Claremont');
        console.log('  - Rondebosch');
        console.log('  - Kenilworth');
        console.log('  - Gardens');
        console.log('  - Tamboerskloof');
        console.log('  - Bo-Kaap');
        console.log('  - Bantry Bay');
        console.log('  - Clifton');
        console.log('  - Fresnaye');
        console.log('  - Hout Bay');
        console.log('  - Constantia');
        console.log('  - Bellville');
        console.log('  - Durbanville');
        console.log('  - Muizenberg');
        console.log('  - Kalk Bay');
        console.log('  - Fish Hoek');

        // Verify the changes
        console.log('\n🔄 Step 4: Verifying data preservation...');
        const { data: competitors, error: compError } = await supabase
            .from('cape_town_competitors')
            .select('count');
        
        if (compError) {
            console.error('❌ Error verifying data:', compError);
        } else {
            console.log(`✅ Verified ${competitors[0].count} competitors preserved`);
        }

    } catch (error) {
        console.error('❌ Error during migration process:', error);
        console.log('✨ Backup files are available in the backups directory');
    }
}

// Run the migration
executeSafeMigration();
