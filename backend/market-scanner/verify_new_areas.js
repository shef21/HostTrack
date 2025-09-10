const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyNewAreas() {
    try {
        // Try to insert a test record with a new area
        const { data, error } = await supabase
            .from('cape_town_competitors')
            .insert({
                area: 'Claremont',
                property_type: 'apartment',
                platform: 'test',
                external_id: 'test_claremont_1',
                current_price: 1500.00,
                title: 'Test Property',
                bedrooms: 2,
                bathrooms: 1,
                max_guests: 4,
                coordinates: { lat: -33.9833, lng: 18.4667 }
            })
            .select();

        if (error) {
            console.error('❌ Test insert failed:', error);
            return;
        }

        console.log('✅ Successfully inserted test record with new area');

        // Clean up test record
        const { error: deleteError } = await supabase
            .from('cape_town_competitors')
            .delete()
            .eq('external_id', 'test_claremont_1');

        if (deleteError) {
            console.error('⚠️ Warning: Could not clean up test record:', deleteError);
        } else {
            console.log('✅ Cleaned up test record');
        }

        console.log('\n✨ New areas are ready to use!');

    } catch (error) {
        console.error('❌ Verification failed:', error);
    }
}

// Run verification
verifyNewAreas();