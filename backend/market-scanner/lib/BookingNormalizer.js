const SupabaseClient = require('./SupabaseClient');

class BookingNormalizer {
    constructor() {
        this.supabase = new SupabaseClient();
    }

    async normalize(listing) {
        const normalized = {
            area: 'Sea Point',
            property_type: this.detectPropertyType(listing),
            external_id: `booking_${listing.external_id || Math.random().toString(36).substr(2, 9)}`,
            platform: 'booking',
            title: listing.title,
            current_price: listing.current_price,
            price_type: 'nightly',
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            max_guests: listing.max_guests || 2,
            rating: listing.rating,
            review_count: listing.review_count,
            location_score: null,
            amenities: listing.amenities || [],
            url: listing.url,
            scan_date: new Date().toISOString(),
            images: listing.images || [],
            coordinates: listing.coordinates,
            property_details: null
        };

        // Save to Supabase immediately
        await this.supabase.saveListing(normalized);

        return normalized;
    }

    detectPropertyType(listing) {
        const title = (listing.title || '').toLowerCase();
        const description = (listing.description || '').toLowerCase();

        if (title.includes('studio') || description.includes('studio')) return 'studio';
        if (title.includes('apartment') || description.includes('apartment')) return 'apartment';
        if (title.includes('villa') || description.includes('villa')) return 'villa';
        if (title.includes('house') || description.includes('house')) return 'house';
        if (title.includes('room') || description.includes('room')) return 'room';

        return 'apartment';
    }

    validateData(listing) {
        const required = ['title', 'current_price', 'url'];
        return required.every(field => listing[field] != null);
    }
}

module.exports = BookingNormalizer;