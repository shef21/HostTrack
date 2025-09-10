const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

const AREA_NAME = 'Claremont';

async function normalizeAirbnbListing(listing) {
    return {
        area: AREA_NAME,
        property_type: listing.room_type || 'apartment',
        external_id: `airbnb_${listing.id}`,
        platform: 'Airbnb',
        title: listing.name,
        current_price: listing.price?.unit?.amount || null,
        price_history: JSON.stringify([{
            date: new Date().toISOString(),
            price: listing.price?.unit?.amount || null
        }]),
        bedrooms: listing.bedrooms || null,
        bathrooms: listing.bathrooms || null,
        max_guests: listing.guest_limit || listing.person_capacity || null,
        rating: listing.rating || null,
        review_count: listing.review_count || 0,
        amenities: listing.amenities || [],
        coordinates: {
            lat: listing.lat,
            lng: listing.lng
        },
        images: listing.images || [],
        url: listing.url || `https://www.airbnb.com/rooms/${listing.id}`,
        scan_date: new Date().toISOString()
    };
}

async function normalizeBookingListing(listing) {
    return {
        area: AREA_NAME,
        property_type: listing.property_type || 'apartment',
        external_id: `booking_${listing.hotel_id || listing.url.split('/').pop()}`,
        platform: 'Booking.com',
        title: listing.title,
        current_price: listing.current_price || null,
        price_history: JSON.stringify([{
            date: new Date().toISOString(),
            price: listing.current_price || null
        }]),
        bedrooms: null, // Booking.com doesn't provide this directly
        bathrooms: null, // Booking.com doesn't provide this directly
        max_guests: null, // Booking.com doesn't provide this directly
        rating: (listing.rating && parseFloat(listing.rating) / 2) || null, // Convert to 5-star scale
        review_count: listing.review_count || 0,
        amenities: [], // We'll need to extract these from the full listing page
        coordinates: { lat: null, lng: null }, // We'll need to extract these from the full listing page
        images: [], // We'll need to extract these from the full listing page
        url: listing.url,
        scan_date: new Date().toISOString()
    };
}

async function saveListingsToSupabase(normalizedListings) {
    console.log(`🔄 Saving ${normalizedListings.length} listings to Supabase...`);
    
    // Save in batches of 50
    const batchSize = 50;
    for (let i = 0; i < normalizedListings.length; i += batchSize) {
        const batch = normalizedListings.slice(i, i + batchSize);
        const { error } = await supabase
            .from('cape_town_competitors')
            .upsert(batch, { 
                onConflict: 'external_id',
                ignoreDuplicates: false
            });

        if (error) {
            console.error(`❌ Error saving batch ${i/batchSize + 1}:`, error);
            throw error;
        }
        console.log(`✅ Saved batch ${i/batchSize + 1} of ${Math.ceil(normalizedListings.length/batchSize)}`);
    }
}

async function main() {
    try {
        console.log(`\n🚀 Starting to save ${AREA_NAME} data to Supabase...`);
        
        // Process Airbnb data
        console.log('\n📖 Reading Airbnb data...');
        const airbnbData = JSON.parse(
            await fs.readFile(`airbnb_${AREA_NAME.toLowerCase()}_limited.json`, 'utf8')
        );
        console.log(`Found ${airbnbData.length} Airbnb listings`);
        
        const normalizedAirbnb = await Promise.all(
            airbnbData.map(listing => normalizeAirbnbListing(listing))
        );
        
        // Process Booking.com data
        console.log('\n📖 Reading Booking.com data...');
        const bookingData = JSON.parse(
            await fs.readFile(`booking_${AREA_NAME.toLowerCase()}_raw.json`, 'utf8')
        );
        console.log(`Found ${bookingData.length} Booking.com listings`);
        
        const normalizedBooking = await Promise.all(
            bookingData.map(listing => normalizeBookingListing(listing))
        );
        
        // Combine and save all listings
        const allListings = [...normalizedAirbnb, ...normalizedBooking];
        await saveListingsToSupabase(allListings);
        
        console.log(`\n✨ Successfully saved ${allListings.length} listings for ${AREA_NAME}!`);
        console.log(`  - ${normalizedAirbnb.length} from Airbnb`);
        console.log(`  - ${normalizedBooking.length} from Booking.com`);
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('❌ Could not find scraped data files. Please run the scraper first.');
        } else {
            console.error('❌ Error saving data:', error);
        }
    }
}

// Run the save operation
main();
