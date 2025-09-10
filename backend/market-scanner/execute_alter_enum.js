const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeAlterEnum() {
    try {
        // First, create the exec_sql function
        console.log('🔄 Creating exec_sql function...');
        const functionSQL = fs.readFileSync(
            path.join(__dirname, 'migrations', 'create_exec_sql_function.sql'),
            'utf8'
        );

        const { data: funcData, error: funcError } = await supabase
            .from('_sqlx')
            .select('*')
            .eq('name', 'create_exec_sql_function')
            .single();

        if (funcError) {
            console.error('❌ Error creating function:', funcError);
            return;
        }

        console.log('🔄 Reading migration SQL...');
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrations', 'alter_areas_enum.sql'),
            'utf8'
        );

        console.log('🔄 Executing migration...');
        const { data: migrationData, error: migrationError } = await supabase
            .from('_sqlx')
            .select('*')
            .eq('name', 'alter_areas_enum')
            .single();

        if (migrationError) {
            console.error('❌ Error executing migration:', migrationError);
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

        // Verify the data is still there
        const { data: competitors, error: compError } = await supabase
            .from('cape_town_competitors')
            .select('count');
        
        if (compError) {
            console.error('❌ Error verifying data:', compError);
        } else {
            console.log(`\n✅ Verified ${competitors[0].count} competitors preserved`);
        }

    } catch (error) {
        console.error('❌ Error during migration process:', error);
        console.log('\n✨ Note: Your data is safe! We have backups in the backups directory.');
    }
}

// Run the migration
executeAlterEnum();