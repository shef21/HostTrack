const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function saveToSupabase() {
    try {
        // Read the Airbnb data
        const rawData = JSON.parse(fs.readFileSync('airbnb_sea_point_limited.json', 'utf8'));
        console.log(`Processing ${rawData.length} listings...`);

        let successCount = 0;
        let errorCount = 0;

        // Format and save each listing
        for (const listing of rawData) {
            try {
                // Extract amenities from various sources
                const amenities = new Set();
                if (listing.paymentMessages?.some(msg => msg.text?.toLowerCase().includes('free cancellation'))) {
                    amenities.add('free_cancellation');
                }
                const title = (listing.name + ' ' + listing.title).toLowerCase();
                if (title.includes('view')) amenities.add('view');
                if (title.includes('balcony')) amenities.add('balcony');
                if (title.includes('pool')) amenities.add('pool');
                if (title.includes('wifi')) amenities.add('wifi');
                if (title.includes('parking')) amenities.add('parking');

                // Extract bedrooms from bed info
                let bedrooms = 1; // Default
                const bedInfo = listing.structuredContent?.primaryLine?.[0]?.body?.toLowerCase() || '';
                if (bedInfo.includes('studio')) {
                    bedrooms = 0;
                } else {
                    const bedroomMatch = listing.name.match(/(\d+)\s*bed(room)?s?/i);
                    if (bedroomMatch) {
                        bedrooms = parseInt(bedroomMatch[1]);
                    }
                }

                // Calculate nightly price from weekly price
                let nightlyPrice = null;
                if (listing.price?.unit?.amount) {
                    nightlyPrice = Math.round(listing.price.unit.amount / 7);
                }

                // Format the listing data
                const formattedListing = {
                    area: 'Sea Point',
                    property_type: listing.title.includes('Studio') ? 'studio' : 'apartment',
                    external_id: `airbnb_${listing.room_id}`,
                    platform: 'airbnb',
                    title: listing.name,
                    current_price: nightlyPrice,
                    price_type: 'nightly',
                    bedrooms: bedrooms,
                    bathrooms: 1, // Default as Airbnb doesn't always provide this
                    max_guests: 2, // Default
                    rating: listing.rating?.value || null,
                    review_count: listing.rating?.reviewCount ? parseInt(listing.rating.reviewCount) : null,
                    location_score: null,
                    amenities: Array.from(amenities),
                    url: `https://www.airbnb.com/rooms/${listing.room_id}`,
                    scan_date: new Date().toISOString(),
                    images: listing.images?.map(img => img.url) || [],
                    lat: listing.coordinates?.latitude || null,
                    lng: listing.coordinates?.longitude || null
                };

                // Save to Supabase
                const { data, error } = await supabase
                    .from('cape_town_competitors')
                    .upsert(formattedListing, {
                        onConflict: 'external_id',
                        ignoreDuplicates: false
                    });

                if (error) {
                    console.error(`Error saving listing ${listing.room_id}:`, error);
                    errorCount++;
                } else {
                    console.log(`✅ Saved: ${listing.name} (${nightlyPrice} ZAR/night)`);
                    successCount++;
                }

                // Small delay between saves to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (listingError) {
                console.error(`Error processing listing ${listing.room_id}:`, listingError);
                errorCount++;
            }
        }

        console.log('\nSummary:');
        console.log(`✅ Successfully saved: ${successCount} listings`);
        console.log(`❌ Errors: ${errorCount} listings`);
        console.log('Done!');

    } catch (error) {
        console.error('Error:', error);
    }
}

saveToSupabase();
