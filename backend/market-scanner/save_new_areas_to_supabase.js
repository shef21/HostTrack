const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function saveNewAreasToSupabase() {
    const resultsDir = 'scrape_results';
    const stats = {
        total: 0,
        success: 0,
        errors: 0,
        areas: {}
    };

    try {
        // Get all JSON files in the results directory
        const files = fs.readdirSync(resultsDir).filter(file => file.endsWith('.json'));
        console.log(`Found ${files.length} result files to process`);

        for (const file of files) {
            const platform = file.startsWith('airbnb_') ? 'airbnb' : 'booking';
            const areaMatch = file.match(/(airbnb|booking)_([a-z_]+)_\d+/);
            if (!areaMatch) continue;

            const area = areaMatch[2].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (!stats.areas[area]) {
                stats.areas[area] = { airbnb: 0, booking: 0, errors: 0 };
            }

            try {
                const filePath = path.join(resultsDir, file);
                const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const listings = Array.isArray(rawData) ? rawData : [];

                console.log(`\nProcessing ${area} - ${platform} (${listings.length} listings)`);

                for (const listing of listings) {
                    try {
                        const formattedListing = {
                            area: area,
                            platform: platform,
                            external_id: platform === 'airbnb' ? 
                                `airbnb_${listing.room_id}` : 
                                `booking_${Buffer.from(listing.url).toString('base64').slice(0, 32)}`,
                            title: platform === 'airbnb' ? 
                                listing.name : 
                                listing.title,
                            current_price: platform === 'airbnb' ? 
                                listing.price?.unit?.amount : 
                                listing.current_price,
                            price_history: [{
                                date: new Date().toISOString(),
                                price: platform === 'airbnb' ? 
                                    listing.price?.unit?.amount : 
                                    listing.current_price,
                                currency: 'ZAR',
                                duration: '1 night'
                            }],
                            rating: platform === 'airbnb' ? 
                                listing.rating?.value : 
                                (listing.rating ? listing.rating / 2 : null),
                            review_count: platform === 'airbnb' ? 
                                (listing.rating?.reviewCount ? parseInt(listing.rating.reviewCount) : null) : 
                                listing.review_count,
                            property_type: platform === 'airbnb' ? 
                                (listing.title?.toLowerCase().includes('studio') ? 'studio' : 'apartment') :
                                'apartment',
                            bedrooms: 1,
                            bathrooms: 1,
                            max_guests: 2,
                            amenities: platform === 'airbnb' ? 
                                extractAirbnbAmenities(listing) : 
                                listing.amenities || [],
                            coordinates: platform === 'airbnb' ? {
                                lat: listing.coordinates?.latitude || null,
                                lng: listing.coordinates?.longitude || null
                            } : {
                                lat: null,
                                lng: null
                            },
                            images: platform === 'airbnb' ? 
                                (listing.images?.map(img => img.url) || []) : 
                                [],
                            url: platform === 'airbnb' ? 
                                `https://www.airbnb.com/rooms/${listing.room_id}` : 
                                listing.url,
                            scan_date: new Date().toISOString(),
                            last_seen_at: new Date().toISOString()
                        };

                        // Save to Supabase
                        const { error } = await supabase
                            .from('cape_town_competitors')
                            .upsert(formattedListing, {
                                onConflict: 'external_id',
                                ignoreDuplicates: false
                            });

                        if (error) {
                            console.error(`Error saving ${platform} listing in ${area}:`, error);
                            stats.errors++;
                            stats.areas[area].errors++;
                        } else {
                            stats.success++;
                            stats.areas[area][platform]++;
                            process.stdout.write('✓');
                        }

                        // Small delay to avoid rate limits
                        await new Promise(resolve => setTimeout(resolve, 100));

                    } catch (listingError) {
                        console.error(`Error processing listing in ${area}:`, listingError);
                        stats.errors++;
                        stats.areas[area].errors++;
                    }
                }

                stats.total += listings.length;
                console.log(`\n✅ Completed ${area} - ${platform}`);

            } catch (fileError) {
                console.error(`Error processing file ${file}:`, fileError);
            }
        }

        // Print final summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 SAVE TO SUPABASE SUMMARY');
        console.log('='.repeat(50));

        Object.entries(stats.areas).forEach(([area, counts]) => {
            console.log(`\n${area}:`);
            console.log(`  Airbnb: ${counts.airbnb} saved`);
            console.log(`  Booking.com: ${counts.booking} saved`);
            if (counts.errors > 0) {
                console.log(`  ❌ Errors: ${counts.errors}`);
            }
        });

        console.log('\n' + '='.repeat(50));
        console.log(`📈 TOTAL LISTINGS PROCESSED: ${stats.total}`);
        console.log(`✅ Successfully Saved: ${stats.success}`);
        console.log(`❌ Errors: ${stats.errors}`);
        console.log(`⏱️ COMPLETED AT: ${new Date().toLocaleString()}`);
        console.log('='.repeat(50) + '\n');

    } catch (error) {
        console.error('Error in main process:', error);
    }
}

function extractAirbnbAmenities(listing) {
    const amenities = new Set();
    
    // Check payment messages for free cancellation
    if (listing.paymentMessages?.some(msg => msg.text?.toLowerCase().includes('free cancellation'))) {
        amenities.add('free_cancellation');
    }

    // Check title and description for amenities
    const title = (listing.name + ' ' + listing.title).toLowerCase();
    if (title.includes('view')) amenities.add('view');
    if (title.includes('balcony')) amenities.add('balcony');
    if (title.includes('pool')) amenities.add('pool');
    if (title.includes('wifi')) amenities.add('wifi');
    if (title.includes('parking')) amenities.add('parking');

    return Array.from(amenities);
}

// Run the save process
saveNewAreasToSupabase();
