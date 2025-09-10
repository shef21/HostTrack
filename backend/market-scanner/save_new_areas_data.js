const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZiI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

// Map area names to their standardized enum values
const areaMapping = {
    'claremont': 'Claremont',
    'rondebosch': 'Rondebosch',
    'kenilworth': 'Kenilworth',
    'gardens': 'Gardens',
    'tamboerskloof': 'Tamboerskloof',
    'bo-kaap': 'Bo-Kaap',
    'bantry-bay': 'Bantry Bay',
    'clifton': 'Clifton',
    'fresnaye': 'Fresnaye',
    'hout-bay': 'Hout Bay',
    'constantia': 'Constantia',
    'bellville': 'Bellville',
    'durbanville': 'Durbanville',
    'muizenberg': 'Muizenberg',
    'kalk-bay': 'Kalk Bay',
    'fish-hoek': 'Fish Hoek'
};

async function normalizeAirbnbListing(listing, area) {
    return {
        area: areaMapping[area.toLowerCase()],
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

async function normalizeBookingListing(listing, area) {
    return {
        area: areaMapping[area.toLowerCase()],
        property_type: listing.property_type || 'apartment',
        external_id: `booking_${listing.hotel_id || listing.id}`,
        platform: 'Booking.com',
        title: listing.name || listing.title,
        current_price: parseFloat(listing.price?.replace(/[^0-9.]/g, '')) || null,
        price_history: JSON.stringify([{
            date: new Date().toISOString(),
            price: parseFloat(listing.price?.replace(/[^0-9.]/g, '')) || null
        }]),
        bedrooms: listing.bedrooms || null,
        bathrooms: listing.bathrooms || null,
        max_guests: listing.max_guests || null,
        rating: (listing.rating && parseFloat(listing.rating) / 2) || null, // Convert to 5-star scale
        review_count: listing.review_count || 0,
        amenities: listing.amenities || [],
        coordinates: listing.coordinates || { lat: null, lng: null },
        images: listing.images || [],
        url: listing.url,
        scan_date: new Date().toISOString()
    };
}

async function saveAreaData(area, platform) {
    try {
        const normalizedArea = area.toLowerCase().replace(/\s+/g, '-');
        const filename = platform === 'airbnb' 
            ? `airbnb_${normalizedArea}_limited.json`
            : `booking_${normalizedArea}_raw.json`;

        console.log(`📖 Reading ${filename}...`);
        const rawData = await fs.readFile(filename, 'utf8');
        const listings = JSON.parse(rawData);

        if (!listings || listings.length === 0) {
            console.log(`⚠️ No listings found in ${filename}`);
            return 0;
        }

        console.log(`Found ${listings.length} listings for ${area} on ${platform}`);

        const normalizedListings = await Promise.all(
            listings.map(listing => 
                platform === 'airbnb' 
                    ? normalizeAirbnbListing(listing, area)
                    : normalizeBookingListing(listing, area)
            )
        );

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

        return normalizedListings.length;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`⚠️ No file found for ${area} on ${platform}`);
            return 0;
        }
        throw error;
    }
}

async function saveAllNewAreas() {
    const areas = Object.keys(areaMapping).map(key => areaMapping[key]);
    const platforms = ['airbnb', 'booking'];
    let totalSaved = 0;

    console.log('🚀 Starting to save data for all new areas...\n');

    for (const area of areas) {
        console.log(`\n📍 Processing ${area}...`);
        for (const platform of platforms) {
            try {
                const count = await saveAreaData(area, platform);
                totalSaved += count;
                console.log(`✅ Saved ${count} listings for ${area} from ${platform}`);
            } catch (error) {
                console.error(`❌ Error processing ${platform} data for ${area}:`, error);
            }
        }
    }

    console.log(`\n✨ Finished! Saved ${totalSaved} total listings for new areas`);
}

// Run the save operation
saveAllNewAreas();
