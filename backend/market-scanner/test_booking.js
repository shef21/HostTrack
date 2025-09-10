require('dotenv').config();
const axios = require('axios');
const BookingNormalizer = require('./lib/BookingNormalizer');

const RAPID_API_KEY = process.env.RAPID_API_KEY;
const RAPID_API_HOST = 'booking-com.p.rapidapi.com';

async function searchBookingProperties() {
    try {
        console.log('Searching for Booking.com properties in Sea Point...');

        // First get destination ID for Sea Point
        const destinationResponse = await axios.request({
            method: 'GET',
            url: 'https://booking-com.p.rapidapi.com/v1/hotels/locations',
            params: {
                name: 'Sea Point, Cape Town',
                locale: 'en-gb'
            },
            headers: {
                'X-RapidAPI-Key': RAPID_API_KEY,
                'X-RapidAPI-Host': RAPID_API_HOST
            }
        });

        if (!destinationResponse.data || !destinationResponse.data[0]) {
            throw new Error('Could not find destination ID for Sea Point');
        }

        const destId = destinationResponse.data[0].dest_id;
        console.log(`Found destination ID: ${destId}`);

        // Get check-in/check-out dates (next week for 1 night)
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 7);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 1);  // Just one night

        const formatDate = (date) => {
            return date.toISOString().split('T')[0];
        };

        // Log the dates we're using
        console.log(`Searching for dates: ${formatDate(checkIn)} to ${formatDate(checkOut)} (1 night)`);

        // Search for properties
        const searchResponse = await axios.request({
            method: 'GET',
            url: 'https://booking-com.p.rapidapi.com/v1/hotels/search',
            params: {
                dest_id: destId,
                order_by: 'popularity',
                filter_by_currency: 'ZAR',
                adults_number: '2',
                room_number: '1',
                checkout_date: formatDate(checkOut),
                checkin_date: formatDate(checkIn),
                units: 'metric',
                locale: 'en-gb'
            },
            headers: {
                'X-RapidAPI-Key': RAPID_API_KEY,
                'X-RapidAPI-Host': RAPID_API_HOST
            }
        });

        if (!searchResponse.data || !searchResponse.data.result) {
            throw new Error('No search results found');
        }

        console.log(`Found ${searchResponse.data.result.length} properties`);

        // Normalize the data
        const normalizer = new BookingNormalizer();
        const normalizedData = searchResponse.data.result
            .map(property => normalizer.normalize(property))
            .filter(property => normalizer.validateData(property));

        console.log(`Successfully normalized ${normalizedData.length} properties`);

        // Save both raw and normalized data
        const fs = require('fs');
        fs.writeFileSync('booking_sea_point_raw.json', 
            JSON.stringify(searchResponse.data.result, null, 2));
        console.log('Raw results saved to booking_sea_point_raw.json');

        fs.writeFileSync('booking_sea_point_normalized.json', 
            JSON.stringify(normalizedData, null, 2));
        console.log('Normalized results saved to booking_sea_point_normalized.json');

        // Print sample of normalized data
        if (normalizedData.length > 0) {
            console.log('\nSample normalized property:');
            const sample = normalizedData[0];
            console.log(`Name: ${sample.title}`);
            console.log(`Price: ${sample.current_price} ZAR/night`);
            console.log(`Rating: ${sample.rating} (${sample.review_count} reviews)`);
            console.log(`Type: ${sample.property_type}`);
            console.log(`Amenities: ${sample.amenities.join(', ')}`);
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        throw error;
    }
}

// Run the search
searchBookingProperties().catch(console.error);