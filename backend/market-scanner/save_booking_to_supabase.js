const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function saveToSupabase() {
    try {
        const rawData = JSON.parse(fs.readFileSync('booking_sea_point_raw.json', 'utf8'));
        console.log(`Processing ${rawData.length} listings...`);

        let successCount = 0;
        let errorCount = 0;

        for (const listing of rawData) {
            try {
                // Generate a unique external_id for Booking.com listings
                const externalId = `booking_${Buffer.from(listing.url).toString('base64').slice(0, 32)}`;

                // Normalize rating from 0-10 scale to 0-5 scale
                const normalizedRating = listing.rating ? (listing.rating / 2) : null;

                // Determine property type based on title and description
                let propertyType = 'apartment';
                const title = listing.title.toLowerCase();
                if (title.includes('villa')) {
                    propertyType = 'villa';
                } else if (title.includes('studio')) {
                    propertyType = 'studio';
                } else if (title.includes('penthouse')) {
                    propertyType = 'penthouse';
                }

                const formattedListing = {
                    area: 'Sea Point',
                    property_type: propertyType,
                    external_id: externalId,
                    platform: 'booking',
                    title: listing.title.replace('\\nOpens in new window', '').trim(),
                    current_price: listing.current_price,
                    price_history: [{
                        date: new Date().toISOString(),
                        price: listing.current_price,
                        currency: 'ZAR',
                        duration: '1 night'
                    }],
                    bedrooms: listing.bedrooms || 1,
                    bathrooms: listing.bathrooms || 1,
                    max_guests: 2,
                    rating: normalizedRating,
                    review_count: listing.review_count || 0,
                    location_score: null,
                    amenities: listing.amenities || [],
                    coordinates: {
                        lat: null,
                        lng: null
                    },
                    images: listing.images || [],
                    scan_date: new Date().toISOString(),
                    availability: {},
                    last_seen_at: new Date().toISOString(),
                    url: listing.url
                };

                const { data, error } = await supabase
                    .from('cape_town_competitors')
                    .upsert(formattedListing, {
                        onConflict: 'external_id',
                        ignoreDuplicates: false
                    });

                if (error) {
                    console.error(`Error saving listing "${listing.title}":`, error);
                    errorCount++;
                } else {
                    console.log(`✅ Saved: ${listing.title} (${listing.current_price} ZAR/night)`);
                    successCount++;
                }

                // Add a small delay between requests
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (listingError) {
                console.error(`Error processing listing "${listing.title}":`, listingError);
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