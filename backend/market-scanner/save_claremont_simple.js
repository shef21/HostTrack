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
        
        // Remove duplicates by external_id
        const uniqueListings = listings.reduce((acc, listing) => {
            const externalId = `airbnb_${listing.id}`;
            if (!acc.some(l => `airbnb_${l.id}` === externalId)) {
                acc.push(listing);
            }
            return acc;
        }, []);
        
        console.log(`Found ${uniqueListings.length} unique listings...`);
        
        const normalizedListings = uniqueListings.map(listing => {
            // Extract rating value if it's an object
            let rating = null;
            if (listing.rating) {
                if (typeof listing.rating === 'object' && listing.rating.value) {
                    rating = parseFloat(listing.rating.value);
                } else if (typeof listing.rating === 'number') {
                    rating = listing.rating;
                }
            }

            // Extract review count if it's in an object
            let reviewCount = 0;
            if (listing.rating && listing.rating.reviewCount) {
                reviewCount = parseInt(listing.rating.reviewCount, 10);
            } else if (listing.review_count) {
                reviewCount = listing.review_count;
            }

            return {
                area: 'Claremont',
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
                rating: rating,
                review_count: reviewCount,
                amenities: listing.amenities || [],
                coordinates: {
                    lat: listing.lat,
                    lng: listing.lng
                },
                images: listing.images || [],
                url: listing.url || `https://www.airbnb.com/rooms/${listing.id}`,
                scan_date: new Date().toISOString()
            };
        });
        
        // Save in batches of 10
        console.log('Saving to Supabase in batches...');
        const batchSize = 10;
        for (let i = 0; i < normalizedListings.length; i += batchSize) {
            const batch = normalizedListings.slice(i, i + batchSize);
            console.log(`Saving batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(normalizedListings.length/batchSize)}...`);
            
            const { data, error } = await supabase
                .from('cape_town_competitors')
                .upsert(batch, {
                    onConflict: 'external_id'
                });
                
            if (error) {
                console.error(`Error saving batch ${Math.floor(i/batchSize) + 1}:`, error);
                return;
            }
            
            // Wait a bit between batches
            if (i + batchSize < normalizedListings.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log('✅ Successfully saved Claremont listings to Supabase!');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

saveClaremont();