const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

// List of properties to remove (not in Observatory)
const nonObsProperties = [
    // CBD/City Centre properties
    'The Rockefeller Hotel by NEWMARK',
    'Grand Daddy Boutique Hotel',
    'Hotel Sky Cape Town',
    'The Trade Boutique Hotel',
    'The Tokyo Aparthotel by Totalstay',
    'HAVN Aparthotel by Totalstay',
    'Zeeland Pier Aparthotel by Totalstay',
    'Habitat Aparthotel by Totalstay',
    
    // Other areas
    'Neighbourgood Newlands',
    'SunSquare Cape Town Gardens',
    'Panorama Guest House',
    'Sussex Mews Luxury Studios',
    'City Club Signature',
    'The City Club',
    'City Club On York',
    'City Club Guesthouse',
    'City Club at 1 on Albert Building',
    'The City Club On Plein',
    'CampusKey Cape Town'
];

async function removeNonObsListings() {
    try {
        // Get all properties marked as Observatory
        const { data: obsProperties, error: fetchError } = await supabase
            .from('cape_town_competitors')
            .select('*')
            .eq('area', 'Observatory');

        if (fetchError) {
            console.error('Error fetching Observatory properties:', fetchError);
            return;
        }

        console.log(`Found ${obsProperties.length} properties marked as Observatory`);

        // Filter properties to remove
        const propertiesToRemove = obsProperties.filter(prop => 
            nonObsProperties.some(nonObsProp => 
                prop.title.toLowerCase().includes(nonObsProp.toLowerCase())
            )
        );

        console.log('\nRemoving the following properties:');
        for (const prop of propertiesToRemove) {
            console.log(`- ${prop.title} (${prop.current_price} ZAR/night)`);
            
            const { error: deleteError } = await supabase
                .from('cape_town_competitors')
                .delete()
                .eq('id', prop.id);

            if (deleteError) {
                console.error(`Error deleting ${prop.title}:`, deleteError);
            } else {
                console.log(`✅ Removed: ${prop.title}`);
            }

            // Small delay between operations
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\nSummary:');
        console.log(`✅ Removed ${propertiesToRemove.length} non-Observatory properties`);
        console.log(`✅ Remaining Observatory properties: ${obsProperties.length - propertiesToRemove.length}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

removeNonObsListings();
