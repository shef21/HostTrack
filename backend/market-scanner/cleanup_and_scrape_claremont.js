const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupTestData() {
    try {
        console.log('Cleaning up test data...');
        
        const { error } = await supabase
            .from('cape_town_competitors')
            .delete()
            .eq('platform', 'test');
            
        if (error) {
            console.error('Error cleaning up test data:', error);
            return;
        }
        
        console.log('✅ Test data cleaned up');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run cleanup
cleanupTestData();
