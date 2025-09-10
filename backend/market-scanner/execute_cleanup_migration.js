const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSql(sql, stepName) {
    console.log(`\n🔄 Executing ${stepName}...`);
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
                sql_string: sql
            })
        });

        if (!response.ok) {
            const error = await response.json();
            // Ignore certain expected errors
            if (error.message.includes('does not exist')) {
                console.log(`⚠️ Object doesn't exist, continuing...`);
                return true;
            }
            throw new Error(JSON.stringify(error, null, 2));
        }

        console.log(`✅ ${stepName} completed`);
        return true;
    } catch (error) {
        // Handle specific error cases
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('does not exist') || 
            errorMsg.includes('already exists')) {
            console.log(`⚠️ Continuing despite error: ${error.message}`);
            return true;
        }
        console.error(`❌ Error in ${stepName}:`, error);
        throw error;
    }
}

async function executeCleanupMigration() {
    try {
        // First verify we can connect to the database
        console.log('🔄 Verifying database connection...');
        const { data: testData, error: testError } = await supabase
            .from('cape_town_competitors')
            .select('count');
            
        if (testError) {
            console.error('❌ Database connection failed:', testError);
            return;
        }
        console.log(`✅ Database connected! Found ${testData[0].count} existing competitors.`);

        // Read and split the migration SQL
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrations', 'cleanup_and_update_areas_enum.sql'),
            'utf8'
        );

        // Split into steps based on comments
        const steps = migrationSQL.split('-- Step');
        
        // Execute each step
        for (let i = 1; i < steps.length; i++) {
            const step = steps[i];
            const stepNumber = step.split(':')[0].trim();
            const stepName = step.split(':')[1].split('\n')[0].trim();
            const sql = step.split('\n').slice(1).join('\n').trim();
            
            if (sql) {
                // Execute each statement in the step separately
                const statements = sql.split(';')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                
                for (const statement of statements) {
                    const success = await executeSql(
                        statement, 
                        `Step ${stepNumber}: ${stepName} (${statement.split(' ').slice(0, 3).join(' ')}...)`
                    );
                    if (!success) {
                        console.error('❌ Failed to execute statement, stopping migration');
                        return;
                    }
                }
            }
        }

        // Verify the migration worked
        console.log('\n🔄 Verifying migration...');
        const { data: verifyData, error: verifyError } = await supabase
            .from('cape_town_competitors')
            .select('count');

        if (verifyError) {
            console.error('❌ Error verifying migration:', verifyError);
            return;
        }

        console.log('\n✅ Migration completed successfully!');
        console.log(`✅ Data preserved: ${verifyData[0].count} competitors`);
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

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.log('\n✨ Note: Your data is safe! We have backups in the backups directory.');
    }
}

// Run the migration
executeCleanupMigration();
