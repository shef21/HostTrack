/**
 * Market Scanner Configuration
 * Central configuration for the property market scanner
 */

const AREAS = {
    SEA_POINT: {
        name: 'Sea Point',
        boundaries: {
            lat: [-33.9150, -33.9250], // Sea Point latitude range
            lng: [18.3800, 18.3900]    // Sea Point longitude range
        },
        searchTerms: ['Sea Point', 'Three Anchor Bay', 'Fresnaye'],
        propertyTypes: ['apartment', 'penthouse'],
        amenities: ['ocean view', 'beachfront', 'pool'],
        priceRanges: {
            apartment: { min: 1200, max: 5000 },
            penthouse: { min: 2500, max: 10000 }
        }
    }
    // Other areas will be added here
};

const SCAN_CONFIG = {
    interval: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
    timeout: 30000,   // 30 seconds
    concurrency: 5,   // Number of concurrent requests
    userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        // Add more user agents for rotation
    ]
};

const RATE_LIMITS = {
    requestsPerMinute: 30,
    pauseBetweenRequests: 2000, // 2 seconds
    maxDailyRequests: 5000
};

const DATA_VALIDATION = {
    price: {
        min: 100,    // Minimum acceptable price
        max: 50000   // Maximum acceptable price
    },
    required_fields: [
        'title',
        'price',
        'location',
        'property_type',
        'platform'
    ],
    string_fields: [
        'title',
        'location',
        'property_type',
        'platform',
        'external_id'
    ],
    numeric_fields: [
        'price',
        'bedrooms',
        'bathrooms',
        'max_guests'
    ]
};

const ERROR_HANDLING = {
    maxRetries: 3,
    backoffMultiplier: 1.5,
    initialBackoff: 1000, // 1 second
    maxBackoff: 60000,    // 1 minute
    errorThreshold: 5     // Number of errors before alerting
};

module.exports = {
    AREAS,
    SCAN_CONFIG,
    RATE_LIMITS,
    DATA_VALIDATION,
    ERROR_HANDLING
};
