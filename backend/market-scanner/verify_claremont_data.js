const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyClaremont() {
    try {
        console.log('Checking Claremont data in Supabase...\n');
        
        const { data, error } = await supabase
            .from('cape_town_competitors')
            .select('*')
            .eq('area', 'Claremont')
            .order('current_price', { ascending: true });
            
        if (error) {
            console.error('Error:', error);
            return;
        }
        
        console.log(`Found ${data.length} listings in Claremont:`);
        console.log('=' . repeat(50));
        
        let totalPrice = 0;
        let listingsWithPrice = 0;
        
        data.forEach(listing => {
            console.log(`\n${listing.title}`);
            console.log(`Price: R${listing.current_price}`);
            console.log(`Rating: ${listing.rating || 'N/A'} (${listing.review_count} reviews)`);
            console.log(`Platform: ${listing.platform}`);
            console.log(`Property Type: ${listing.property_type}`);
            console.log(`Bedrooms: ${listing.bedrooms || 'N/A'}`);
            console.log(`Bathrooms: ${listing.bathrooms || 'N/A'}`);
            console.log(`Max Guests: ${listing.max_guests || 'N/A'}`);
            console.log(`URL: ${listing.url}`);
            console.log(`Last Scan: ${new Date(listing.scan_date).toLocaleString()}`);
            console.log('-' . repeat(50));
            
            if (listing.current_price) {
                totalPrice += listing.current_price;
                listingsWithPrice++;
            }
        });
        
        if (listingsWithPrice > 0) {
            const avgPrice = Math.round(totalPrice / listingsWithPrice);
            console.log(`\nAverage price per night: R${avgPrice}`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

verifyClaremont();