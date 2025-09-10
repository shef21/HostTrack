const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function saveClaremont() {
    try {
        console.log('Reading Airbnb data...');
        const rawData = fs.readFileSync('airbnb_claremont_limited.json', 'utf8');
        const listings = JSON.parse(rawData);
        
        console.log(`Processing ${listings.length} listings...`);
        
        // Remove duplicates first
        const uniqueListings = Array.from(new Set(listings.map(l => l.room_id)))
            .map(id => listings.find(l => l.room_id === id));
        
        console.log(`Found ${uniqueListings.length} unique listings...`);
        
        const normalizedListings = uniqueListings.map(listing => {
            // Extract rating value
            let rating = null;
            if (listing.rating && listing.rating.value) {
                rating = parseFloat(listing.rating.value);
            }

            // Extract review count
            let reviewCount = 0;
            if (listing.rating && listing.rating.reviewCount) {
                reviewCount = parseInt(listing.rating.reviewCount, 10);
            }

            // Extract coordinates
            const coordinates = {
                lat: listing.coordinates?.latitude || null,
                lng: listing.coordinates?.longitud || null  // Note: API returns 'longitud'
            };

            // Extract price
            const price = listing.price?.unit?.amount || null;

            // Extract images
            const images = listing.images?.map(img => img.url) || [];

            return {
                area: 'Claremont',
                property_type: listing.room_type || 'apartment',
                external_id: `airbnb_${listing.room_id}`,
                platform: 'Airbnb',
                title: listing.name,
                current_price: price,
                price_history: JSON.stringify([{
                    date: new Date().toISOString(),
                    price: price
                }]),
                bedrooms: listing.bedrooms || null,
                bathrooms: listing.bathrooms || null,
                max_guests: listing.guest_limit || listing.person_capacity || null,
                rating: rating,
                review_count: reviewCount,
                amenities: listing.amenities || [],
                coordinates: coordinates,
                images: images,
                url: listing.url || `https://www.airbnb.com/rooms/${listing.room_id}`,
                scan_date: new Date().toISOString()
            };
        });
        
        // Save one at a time to avoid any duplicate issues
        console.log('Saving to Supabase...');
        let savedCount = 0;
        let updatedCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < normalizedListings.length; i++) {
            const listing = normalizedListings[i];
            console.log(`Processing listing ${i + 1} of ${normalizedListings.length}: ${listing.title}`);
            
            // First check if listing exists
            const { data: existingData, error: existingError } = await supabase
                .from('cape_town_competitors')
                .select('id')
                .eq('external_id', listing.external_id)
                .single();
                
            if (existingError && existingError.code !== 'PGRST116') {  // PGRST116 means no rows returned
                console.error(`Error checking listing ${i + 1}:`, existingError);
                errorCount++;
                continue;
            }
            
            if (existingData) {
                // Update existing listing
                const { error: updateError } = await supabase
                    .from('cape_town_competitors')
                    .update(listing)
                    .eq('id', existingData.id);
                    
                if (updateError) {
                    console.error(`Error updating listing ${i + 1}:`, updateError);
                    errorCount++;
                } else {
                    updatedCount++;
                    console.log(`Updated: ${listing.title}`);
                }
            } else {
                // Insert new listing
                const { error: insertError } = await supabase
                    .from('cape_town_competitors')
                    .insert(listing);
                    
                if (insertError) {
                    console.error(`Error inserting listing ${i + 1}:`, insertError);
                    errorCount++;
                } else {
                    savedCount++;
                    console.log(`Saved new: ${listing.title}`);
                }
            }
            
            // Small delay between operations
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('\n✅ Claremont data processing complete!');
        console.log(`New listings saved: ${savedCount}`);
        console.log(`Listings updated: ${updatedCount}`);
        console.log(`Errors: ${errorCount}`);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

saveClaremont();