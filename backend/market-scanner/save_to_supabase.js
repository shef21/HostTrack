const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function saveToSupabase() {
    try {
        console.log('Reading data files...');
        
        // Read Airbnb data
        let airbnbData = [];
        try {
            airbnbData = JSON.parse(fs.readFileSync('airbnb_sea_point_normalized.json', 'utf8'));
            console.log(`Found ${airbnbData.length} Airbnb listings`);
        } catch (e) {
            console.log('No Airbnb data found');
        }

        // Read Booking.com data
        let bookingData = [];
        try {
            bookingData = JSON.parse(fs.readFileSync('booking_sea_point_raw.json', 'utf8'));
            console.log(`Found ${bookingData.length} Booking.com listings`);
        } catch (e) {
            console.log('No Booking.com data found');
        }

        // Combine and format data
        const allListings = [
            ...airbnbData.map(listing => ({
                area: listing.area,
                property_type: listing.property_type,
                external_id: listing.external_id,
                platform: listing.platform,
                title: listing.title,
                current_price: listing.current_price,
                price_type: listing.price_type,
                bedrooms: listing.bedrooms,
                bathrooms: listing.bathrooms,
                max_guests: listing.max_guests,
                rating: listing.rating,
                review_count: listing.review_count,
                location_score: listing.location_score,
                amenities: listing.amenities,
                url: listing.url,
                scan_date: listing.scan_date,
                images: listing.images,
                coordinates: listing.coordinates,
                property_details: listing.property_details
            })),
            ...bookingData.map(listing => ({
                area: 'Sea Point',
                property_type: listing.property_type || 'apartment',
                external_id: listing.external_id || `booking_${Math.random().toString(36).substr(2, 9)}`,
                platform: 'booking',
                title: listing.title,
                current_price: listing.current_price,
                price_type: 'nightly',
                bedrooms: listing.bedrooms,
                bathrooms: listing.bathrooms,
                max_guests: listing.max_guests,
                rating: listing.rating,
                review_count: listing.review_count,
                location_score: null,
                amenities: listing.amenities,
                url: listing.url,
                scan_date: new Date().toISOString(),
                images: listing.images,
                coordinates: listing.coordinates,
                property_details: null
            }))
        ];

        console.log(`Total listings to save: ${allListings.length}`);

        // Save to Supabase in batches
        const batchSize = 50;
        for (let i = 0; i < allListings.length; i += batchSize) {
            const batch = allListings.slice(i, i + batchSize);
            console.log(`Saving batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(allListings.length/batchSize)}`);

            const { data, error } = await supabase
                .from('cape_town_competitors')
                .upsert(batch, {
                    onConflict: 'external_id',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error('Error saving batch:', error);
            } else {
                console.log(`Successfully saved ${batch.length} listings`);
            }

            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('All data saved to Supabase!');

    } catch (error) {
        console.error('Error:', error);
    }
}

saveToSupabase();
