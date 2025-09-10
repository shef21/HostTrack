const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
    try {
        console.log('🔄 Starting area enum migration...');

        // Read the migration SQL
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrations', 'update_areas_enum.sql'),
            'utf8'
        );

        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_string: migrationSQL
        });

        if (error) {
            console.error('❌ Migration failed:', error);
            return;
        }

        console.log('✅ Migration successful!');
        console.log('Added new areas to cape_town_area enum type:');
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

    } catch (error) {
        console.error('❌ Error executing migration:', error);
    }
}

// Run the migration
executeMigration();
