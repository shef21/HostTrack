const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const config = require('./config/supabase');

// Initialize Supabase client
const supabase = createClient(config.url, config.anonKey);

async function formatAndSaveListings() {
    try {
        // Read the raw data
        const rawData = JSON.parse(fs.readFileSync('airbnb_sea_point_limited.json', 'utf8'));
        console.log(`Processing ${rawData.length} listings...`);

        // Format listings
        const formattedListings = rawData.map(listing => ({
            area: 'Sea Point',
            property_type: detectPropertyType(listing),
            external_id: `airbnb_${listing.room_id}`,
            platform: 'airbnb',
            title: listing.name,
            current_price: extractPrice(listing),
            price_type: 'nightly',
            bedrooms: extractBedrooms(listing),
            bathrooms: 1, // Default as Airbnb doesn't always provide this
            max_guests: listing.guest_limit || 2,
            rating: listing.rating?.value || null,
            review_count: listing.rating?.reviewCount || null,
            location_score: null,
            amenities: extractAmenities(listing),
            url: `https://www.airbnb.com/rooms/${listing.room_id}`,
            scan_date: new Date().toISOString(),
            images: listing.images?.map(img => img.url) || [],
            lat: listing.coordinates?.latitude || null,
            lng: listing.coordinates?.longitude || null
        }));

        // Save to Supabase
        for (const listing of formattedListings) {
            const { data, error } = await supabase
                .from('cape_town_competitors')
                .upsert(listing, {
                    onConflict: 'external_id',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error('Error saving listing:', error);
            } else {
                console.log(`Successfully saved: ${listing.title}`);
            }

            // Small delay between saves
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('All listings processed!');

    } catch (error) {
        console.error('Error:', error);
    }
}

function detectPropertyType(listing) {
    const title = (listing.name || '').toLowerCase();
    if (title.includes('studio')) return 'studio';
    if (title.includes('apartment')) return 'apartment';
    if (title.includes('villa')) return 'villa';
    if (title.includes('house')) return 'house';
    return 'apartment'; // Default
}

function extractPrice(listing) {
    if (listing.price?.unit?.amount) {
        return listing.price.unit.amount;
    }
    return null;
}

function extractBedrooms(listing) {
    const title = (listing.name || '').toLowerCase();
    const bedroomMatch = title.match(/(\d+)\s*bed(room)?s?/);
    if (bedroomMatch) {
        return parseInt(bedroomMatch[1]);
    }
    if (title.includes('studio')) {
        return 0;
    }
    return 1; // Default
}

function extractAmenities(listing) {
    const amenities = new Set();
    
    // Check payment messages for cancellation policy
    if (listing.paymentMessages?.some(msg => 
        msg.text?.toLowerCase().includes('free cancellation'))) {
        amenities.add('free_cancellation');
    }

    // Check title and description for common amenities
    const text = `${listing.name} ${listing.title}`.toLowerCase();
    if (text.includes('view')) amenities.add('view');
    if (text.includes('balcony')) amenities.add('balcony');
    if (text.includes('pool')) amenities.add('pool');
    if (text.includes('parking')) amenities.add('parking');
    if (text.includes('wifi')) amenities.add('wifi');

    return Array.from(amenities);
}

formatAndSaveListings();
