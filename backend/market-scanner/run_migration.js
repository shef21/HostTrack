const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    try {
        // SQL to add unique constraint
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_string: `
                -- Add unique constraint on external_id
                ALTER TABLE cape_town_competitors
                ADD CONSTRAINT unique_external_id UNIQUE (external_id);
            `
        });

        if (error) {
            console.error('Migration error:', error);
        } else {
            console.log('Migration successful!');
            
            // Verify constraint
            const { data: verifyData, error: verifyError } = await supabase.rpc('exec_sql', {
                sql_string: `
                    SELECT constraint_name, constraint_type
                    FROM information_schema.table_constraints
                    WHERE table_name = 'cape_town_competitors'
                    AND constraint_name = 'unique_external_id';
                `
            });
            
            if (verifyError) {
                console.error('Verification error:', verifyError);
            } else {
                console.log('Verification result:', verifyData);
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

runMigration();
