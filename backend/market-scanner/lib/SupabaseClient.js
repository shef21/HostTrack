const { createClient } = require('@supabase/supabase-js');
const config = require('../config/supabase');

class SupabaseClient {
    constructor() {
        this.supabase = createClient(config.url, config.anonKey);
    }

    async saveListing(listing) {
        try {
            // Format the listing data
            const formattedListing = {
                area: listing.area || 'Sea Point',
                property_type: listing.property_type,
                external_id: listing.external_id,
                platform: listing.platform,
                title: listing.title,
                current_price: listing.current_price,
                price_type: listing.price_type || 'nightly',
                bedrooms: listing.bedrooms,
                bathrooms: listing.bathrooms,
                max_guests: listing.max_guests,
                rating: listing.rating,
                review_count: listing.review_count,
                location_score: listing.location_score,
                amenities: listing.amenities,
                url: listing.url,
                scan_date: listing.scan_date || new Date().toISOString(),
                images: listing.images,
                coordinates: listing.coordinates,
                property_details: listing.property_details
            };

            // Save to Supabase
            const { data, error } = await this.supabase
                .from('cape_town_competitors')
                .upsert(formattedListing, {
                    onConflict: 'external_id',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error('Error saving listing:', error);
                return false;
            }

            console.log(`Successfully saved listing: ${listing.title}`);
            return true;

        } catch (error) {
            console.error('Error in saveListing:', error);
            return false;
        }
    }

    async saveListings(listings) {
        try {
            // Save in batches of 50
            const batchSize = 50;
            for (let i = 0; i < listings.length; i += batchSize) {
                const batch = listings.slice(i, i + batchSize);
                console.log(`Saving batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(listings.length/batchSize)}`);

                const { data, error } = await this.supabase
                    .from('cape_town_competitors')
                    .upsert(batch, {
                        onConflict: 'external_id',
                        ignoreDuplicates: false
                    });

                if (error) {
                    console.error('Error saving batch:', error);
                }

                // Small delay between batches
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            return true;

        } catch (error) {
            console.error('Error in saveListings:', error);
            return false;
        }
    }

    async getLatestListings(platform = null, limit = 100) {
        try {
            let query = this.supabase
                .from('cape_town_competitors')
                .select('*')
                .order('scan_date', { ascending: false })
                .limit(limit);

            if (platform) {
                query = query.eq('platform', platform);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching listings:', error);
                return [];
            }

            return data;

        } catch (error) {
            console.error('Error in getLatestListings:', error);
            return [];
        }
    }
}

module.exports = SupabaseClient;