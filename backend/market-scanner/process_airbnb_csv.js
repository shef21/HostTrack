/**
 * Airbnb CSV Data Processor
 * Transforms BNB Toolbox CSV data to cape_town_competitors table format
 */

const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Area mapping based on coordinates and location names
const AREA_MAPPING = {
    'Sea Point': { lat: [-33.91, -33.92], lng: [18.38, 18.40] },
    'Green Point': { lat: [-33.90, -33.91], lng: [18.39, 18.41] },
    'Century City': { lat: [-33.91, -33.93], lng: [18.41, 18.43] }, // Map City Centre to Century City
    'Camps Bay': { lat: [-33.95, -33.97], lng: [18.35, 18.37] },
    'V&A Waterfront': { lat: [-33.90, -33.92], lng: [18.42, 18.44] },
    'Woodstock': { lat: [-33.92, -33.94], lng: [18.44, 18.46] },
    'Observatory': { lat: [-33.93, -33.95], lng: [18.45, 18.47] },
    'Newlands': { lat: [-33.96, -33.98], lng: [18.46, 18.48] }
};

// Property type mapping
const PROPERTY_TYPE_MAPPING = {
    'Apartment': 'apartment',
    'Condo': 'apartment',
    'Studio': 'studio',
    'House': 'house',
    'Villa': 'villa',
    'Penthouse': 'penthouse',
    'Loft': 'apartment',
    'Guest suite': 'apartment',
    'Room': 'apartment'
};

class AirbnbDataProcessor {
    constructor() {
        this.processedData = [];
        this.errors = [];
        this.stats = {
            total: 0,
            processed: 0,
            errors: 0,
            skipped: 0
        };
    }

    // Extract area from coordinates and title
    extractArea(lat, lng, title) {
        if (!lat || !lng) return 'Cape Town City Centre';
        
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        
        for (const [area, bounds] of Object.entries(AREA_MAPPING)) {
            if (latitude >= bounds.lat[0] && latitude <= bounds.lat[1] &&
                longitude >= bounds.lng[0] && longitude <= bounds.lng[1]) {
                return area;
            }
        }
        
        // Fallback to title-based detection
        const titleLower = title.toLowerCase();
        if (titleLower.includes('sea point')) return 'Sea Point';
        if (titleLower.includes('green point')) return 'Green Point';
        if (titleLower.includes('camps bay')) return 'Camps Bay';
        if (titleLower.includes('waterfront')) return 'V&A Waterfront';
        if (titleLower.includes('woodstock')) return 'Woodstock';
        if (titleLower.includes('observatory')) return 'Observatory';
        if (titleLower.includes('newlands')) return 'Newlands';
        if (titleLower.includes('century city')) return 'Century City';
        
        return 'Century City'; // Default to Century City instead of Cape Town City Centre
    }

    // Extract property type from title and listing type
    extractPropertyType(title, listingType) {
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('studio')) return 'studio';
        if (titleLower.includes('penthouse')) return 'penthouse';
        if (titleLower.includes('villa')) return 'villa';
        if (titleLower.includes('house')) return 'house';
        if (titleLower.includes('loft')) return 'apartment';
        if (titleLower.includes('condo')) return 'apartment';
        
        return 'apartment'; // Default fallback
    }

    // Clean and convert price
    cleanPrice(priceStr) {
        if (!priceStr) return 0;
        
        // Remove currency symbols and extract number
        const cleaned = priceStr.replace(/[R,]/g, '').replace(/\s/g, '');
        const price = parseFloat(cleaned);
        
        return isNaN(price) ? 0 : price;
    }

    // Parse amenities from JSON string
    parseAmenities(amenitiesJson) {
        try {
            if (!amenitiesJson || amenitiesJson === 'undefined') return [];
            return JSON.parse(amenitiesJson);
        } catch (error) {
            console.warn('Failed to parse amenities:', error.message);
            return [];
        }
    }

    // Parse occupancy data from JSON string
    parseOccupancyData(occupancyJson) {
        try {
            if (!occupancyJson || occupancyJson === 'undefined') return {};
            return JSON.parse(occupancyJson);
        } catch (error) {
            console.warn('Failed to parse occupancy data:', error.message);
            return {};
        }
    }

    // Calculate max guests from beds and bedrooms
    calculateMaxGuests(beds, bedrooms) {
        const bedCount = parseInt(beds) || 0;
        const bedroomCount = parseInt(bedrooms) || 0;
        
        // Estimate: 2 guests per bedroom, minimum 1
        return Math.max(bedCount, bedroomCount * 2, 1);
    }

    // Process a single row
    processRow(row) {
        try {
            this.stats.total++;
            
            // Debug logging for first few rows
            if (this.stats.total <= 3) {
                console.log(`\n🔍 Debug Row ${this.stats.total}:`);
                console.log(`Available columns:`, Object.keys(row));
                console.log(`Title: "${row.Title}"`);
                console.log(`Name: "${row.Name}"`);
                console.log(`Price (raw): "${row['Price (raw)']}"`);
                console.log(`Price: "${row.Price}"`);
                console.log(`Id: "${row.Id}"`);
            }
            
            // Use Name field instead of Title, and check for valid data
            const propertyTitle = row.Name || row.Title || '';
            if (!propertyTitle || (!row['Price (raw)'] && !row.Price)) {
                this.stats.skipped++;
                if (this.stats.total <= 3) {
                    console.log(`❌ Skipping row ${this.stats.total} - missing data`);
                }
                return null;
            }

            const area = this.extractArea(row.Latitude, row.Longitude, propertyTitle);
            const propertyType = this.extractPropertyType(propertyTitle, row['Listing Type']);
            let currentPrice = this.cleanPrice(row['Price (raw)']);
            const originalPrice = this.cleanPrice(row['Original Price']);
            const discountedPrice = this.cleanPrice(row['Discounted Price']);
            
            // Skip if no valid price - try alternative price fields
            if (currentPrice === 0) {
                currentPrice = this.cleanPrice(row.Price);
                if (currentPrice === 0) {
                    this.stats.skipped++;
                    return null;
                }
            }

            const processedRow = {
                area: area,
                property_type: propertyType,
                external_id: row.Id || `airbnb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                platform: 'airbnb',
                title: propertyTitle,
                current_price: currentPrice,
                bedrooms: parseInt(row.Bedrooms) || 0,
                bathrooms: parseInt(row.Baths) || 0,
                max_guests: this.calculateMaxGuests(row.Beds, row.Bedrooms),
                rating: parseFloat(row['Average Rating']) || 0,
                review_count: parseInt(row['Number of Reviews']) || 0,
                amenities: this.parseAmenities(row['Amenities Raw Data (JSON)']),
                availability: this.parseOccupancyData(row['Occupancy Raw Data (JSON)']),
                location_score: 0, // Will be calculated later
                price_type: 'nightly',
                last_seen_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Add price history if available
            if (originalPrice > 0 && originalPrice !== currentPrice) {
                processedRow.price_history = [{
                    date: new Date().toISOString(),
                    price: originalPrice,
                    type: 'original'
                }, {
                    date: new Date().toISOString(),
                    price: currentPrice,
                    type: 'current'
                }];
            }

            this.stats.processed++;
            return processedRow;

        } catch (error) {
            this.stats.errors++;
            this.errors.push({
                row: this.stats.total,
                error: error.message,
                data: row
            });
            console.error(`Error processing row ${this.stats.total}:`, error.message);
            return null;
        }
    }

    // Process CSV file
    async processCSV(filePath) {
        return new Promise((resolve, reject) => {
            const results = [];
            
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    const processed = this.processRow(row);
                    if (processed) {
                        results.push(processed);
                    }
                })
                .on('end', () => {
                    this.processedData = results;
                    resolve(results);
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }

    // Upload to Supabase
    async uploadToDatabase() {
        try {
            console.log(`\n📤 Uploading ${this.processedData.length} records to Supabase...`);
            
            // Upload in batches of 100
            const batchSize = 100;
            const batches = [];
            
            for (let i = 0; i < this.processedData.length; i += batchSize) {
                batches.push(this.processedData.slice(i, i + batchSize));
            }
            
            let uploaded = 0;
            for (const batch of batches) {
                const { data, error } = await supabase
                    .from('cape_town_competitors')
                    .insert(batch);
                
                if (error) {
                    console.error('Batch upload error:', error);
                    throw error;
                }
                
                uploaded += batch.length;
                console.log(`✅ Uploaded batch: ${uploaded}/${this.processedData.length} records`);
            }
            
            console.log(`\n🎉 Successfully uploaded ${uploaded} records to database!`);
            return { success: true, uploaded };
            
        } catch (error) {
            console.error('❌ Database upload failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Generate processing report
    generateReport() {
        console.log('\n📊 PROCESSING REPORT');
        console.log('==================');
        console.log(`Total rows processed: ${this.stats.total}`);
        console.log(`Successfully processed: ${this.stats.processed}`);
        console.log(`Skipped (missing data): ${this.stats.skipped}`);
        console.log(`Errors: ${this.stats.errors}`);
        
        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.errors.slice(0, 5).forEach((error, index) => {
                console.log(`${index + 1}. Row ${error.row}: ${error.error}`);
            });
            if (this.errors.length > 5) {
                console.log(`... and ${this.errors.length - 5} more errors`);
            }
        }
        
        // Area distribution
        const areaCounts = {};
        this.processedData.forEach(item => {
            areaCounts[item.area] = (areaCounts[item.area] || 0) + 1;
        });
        
        console.log('\n📍 AREA DISTRIBUTION:');
        Object.entries(areaCounts).forEach(([area, count]) => {
            console.log(`${area}: ${count} properties`);
        });
        
        // Price range analysis
        const prices = this.processedData.map(item => item.current_price).filter(p => p > 0);
        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            
            console.log('\n💰 PRICE ANALYSIS:');
            console.log(`Min price: R${minPrice.toFixed(2)}`);
            console.log(`Max price: R${maxPrice.toFixed(2)}`);
            console.log(`Average price: R${avgPrice.toFixed(2)}`);
        }
    }
}

// Main execution function
async function main() {
    const processor = new AirbnbDataProcessor();
    const csvPath = './BNB-Toolbox-Scraper-Data-Cape Town-20250910 (1).csv';
    
    try {
        console.log('🚀 Starting Airbnb CSV data processing...');
        console.log(`📁 Processing file: ${csvPath}`);
        
        // Process CSV
        await processor.processCSV(csvPath);
        
        // Generate report
        processor.generateReport();
        
        // Upload to database
        const uploadResult = await processor.uploadToDatabase();
        
        if (uploadResult.success) {
            console.log('\n✅ Data processing completed successfully!');
            console.log(`📊 Uploaded ${uploadResult.uploaded} properties to cape_town_competitors table`);
        } else {
            console.log('\n❌ Data processing failed:', uploadResult.error);
        }
        
    } catch (error) {
        console.error('❌ Processing failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = AirbnbDataProcessor;
