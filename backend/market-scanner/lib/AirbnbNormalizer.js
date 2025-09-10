const SupabaseClient = require('./SupabaseClient');

class AirbnbNormalizer {
    constructor() {
        this.supabase = new SupabaseClient();
    }

    async normalize(listing) {
        const normalized = {
            area: 'Sea Point',
            property_type: this.detectPropertyType(listing),
            external_id: `airbnb_${listing.id}`,
            platform: 'airbnb',
            title: listing.name,
            current_price: this.extractPrice(listing),
            price_type: 'nightly',
            bedrooms: this.extractBedrooms(listing),
            bathrooms: this.extractBathrooms(listing),
            max_guests: listing.guest_limit || listing.max_guests || 2,
            rating: listing.rating,
            review_count: listing.review_count,
            location_score: listing.location_score,
            amenities: this.extractAmenities(listing),
            url: `https://www.airbnb.com/rooms/${listing.id}`,
            scan_date: new Date().toISOString(),
            images: listing.images || [],
            coordinates: listing.coordinates || null,
            property_details: {
                room_type: listing.room_type,
                category: listing.category,
                cleaning_fee: listing.cleaning_fee,
                airbnb_fee: listing.airbnb_fee,
                has_long_stay_discount: listing.has_long_stay_discount || false
            }
        };

        // Save to Supabase immediately
        await this.supabase.saveListing(normalized);

        return normalized;
    }

    detectPropertyType(listing) {
        const title = (listing.name || '').toLowerCase();
        const description = (listing.description || '').toLowerCase();
        
        if (title.includes('loft') || description.includes('loft')) return 'loft';
        if (title.includes('studio') || description.includes('studio')) return 'studio';
        if (title.includes('room') || description.includes('room')) return 'room';
        if (title.includes('villa') || description.includes('villa')) return 'villa';
        if (title.includes('house') || description.includes('house')) return 'house';
        
        return 'apartment';
    }

    extractPrice(listing) {
        if (listing.price && typeof listing.price === 'number') {
            return listing.price;
        }
        if (listing.price && typeof listing.price === 'string') {
            return parseFloat(listing.price.replace(/[^0-9.]/g, ''));
        }
        return null;
    }

    extractBedrooms(listing) {
        // Try to get from structured data first
        if (listing.bedrooms && typeof listing.bedrooms === 'number') {
            return listing.bedrooms;
        }

        // Try to extract from title
        const title = (listing.name || '').toLowerCase();
        const bedroomMatch = title.match(/(\d+)\s*bed(room)?s?/);
        if (bedroomMatch) {
            return parseInt(bedroomMatch[1]);
        }

        // If it's a studio, return 0
        if (title.includes('studio')) {
            return 0;
        }

        // Default to 1 if we can't determine
        return 1;
    }

    extractBathrooms(listing) {
        // Try structured data first
        if (listing.bathrooms && typeof listing.bathrooms === 'number') {
            return listing.bathrooms;
        }

        const description = (listing.description || '').toLowerCase();
        
        // Try various patterns
        const patterns = [
            /(\d+(?:\.\d+)?)\s*bath(room)?s?/,
            /(\d+(?:\.\d+)?)\s*private bath/,
            /(\d+(?:\.\d+)?)\s*ensuite/
        ];

        for (const pattern of patterns) {
            const match = description.match(pattern);
            if (match) {
                return parseFloat(match[1]);
            }
        }

        // Smart estimation based on bedrooms
        const bedrooms = this.extractBedrooms(listing);
        if (bedrooms === 0) return 1; // Studio always has 1 bathroom
        return Math.max(1, Math.ceil(bedrooms / 2)); // At least 1 bathroom, then roughly 1 per 2 bedrooms
    }

    extractAmenities(listing) {
        const amenities = new Set();
        const description = (listing.description || '').toLowerCase();
        const amenityList = listing.amenities || [];

        // Map common Airbnb amenities to our standard format
        const amenityMap = {
            'free cancellation': 'free_cancellation',
            'wifi': 'wifi',
            'pool': 'pool',
            'parking': 'parking',
            'gym': 'gym',
            'balcony': 'balcony',
            'view': 'view',
            'air conditioning': 'air_conditioning',
            'kitchen': 'kitchen',
            'washer': 'laundry',
            'dryer': 'laundry',
            'beach access': 'beach_access',
            'long term stays allowed': 'long_term_stay',
            'private bathroom': 'private_bathroom'
        };

        // Check structured amenities
        for (const amenity of amenityList) {
            const normalizedAmenity = amenityMap[amenity.toLowerCase()];
            if (normalizedAmenity) {
                amenities.add(normalizedAmenity);
            }
        }

        // Check description for amenities
        for (const [keyword, normalizedAmenity] of Object.entries(amenityMap)) {
            if (description.includes(keyword)) {
                amenities.add(normalizedAmenity);
            }
        }

        // Special checks
        if (description.includes('sea view') || description.includes('ocean view')) {
            amenities.add('view');
        }

        return Array.from(amenities);
    }

    validateData(listing) {
        const required = ['title', 'current_price', 'url'];
        return required.every(field => listing[field] != null);
    }
}

module.exports = AirbnbNormalizer;