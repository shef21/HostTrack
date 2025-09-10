const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function saveToSupabase() {
    try {
        // Save both Airbnb and Booking.com data
        await saveAirbnbData();
        await saveBookingData();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function saveAirbnbData() {
    try {
        // Read the Airbnb data
        const rawData = JSON.parse(fs.readFileSync('airbnb_green_point_limited.json', 'utf8'));
        console.log(`\nProcessing ${rawData.length} Airbnb listings...`);

        let successCount = 0;
        let errorCount = 0;

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

                // Use direct nightly price from the single-night scan
                const nightlyPrice = listing.price?.unit?.amount || null;

                // Format the listing data
                const formattedListing = {
                    area: 'Green Point',
                    property_type: listing.title.includes('Studio') ? 'studio' : 'apartment',
                    external_id: `airbnb_${listing.room_id}`,
                    platform: 'airbnb',
                    title: listing.name,
                    current_price: nightlyPrice,
                    price_history: [{
                        date: new Date().toISOString(),
                        price: nightlyPrice,
                        currency: 'ZAR',
                        duration: '1 night'
                    }],
                    bedrooms: bedrooms,
                    bathrooms: 1, // Default as Airbnb doesn't always provide this
                    max_guests: 2, // Default
                    rating: listing.rating?.value || null,
                    review_count: listing.rating?.reviewCount ? parseInt(listing.rating.reviewCount) : null,
                    location_score: null,
                    amenities: Array.from(amenities),
                    coordinates: {
                        lat: listing.coordinates?.latitude || null,
                        lng: listing.coordinates?.longitude || null
                    },
                    images: listing.images?.map(img => img.url) || [],
                    scan_date: new Date().toISOString(),
                    availability: {},
                    last_seen_at: new Date().toISOString(),
                    url: `https://www.airbnb.com/rooms/${listing.room_id}`
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
                    console.log(`✅ Saved Airbnb: ${listing.name} (${nightlyPrice} ZAR/night)`);
                    successCount++;
                }

                // Small delay between saves
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (listingError) {
                console.error(`Error processing Airbnb listing:`, listingError);
                errorCount++;
            }
        }

        console.log('\nAirbnb Summary:');
        console.log(`✅ Successfully saved: ${successCount} listings`);
        console.log(`❌ Errors: ${errorCount} listings`);

    } catch (error) {
        console.error('Error processing Airbnb data:', error);
    }
}

async function saveBookingData() {
    try {
        // Read the Booking.com data
        const rawData = JSON.parse(fs.readFileSync('booking_green_point_raw.json', 'utf8'));
        console.log(`\nProcessing ${rawData.length} Booking.com listings...`);

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
                    area: 'Green Point',
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
                    console.log(`✅ Saved Booking: ${listing.title} (${listing.current_price} ZAR/night)`);
                    successCount++;
                }

                // Add a small delay between requests
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (listingError) {
                console.error(`Error processing Booking.com listing:`, listingError);
                errorCount++;
            }
        }

        console.log('\nBooking.com Summary:');
        console.log(`✅ Successfully saved: ${successCount} listings`);
        console.log(`❌ Errors: ${errorCount} listings`);
        console.log('Done!');

    } catch (error) {
        console.error('Error processing Booking.com data:', error);
    }
}

saveToSupabase();
