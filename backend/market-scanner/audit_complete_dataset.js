const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditCompleteDataset() {
    try {
        console.log('🔍 AUDITING COMPLETE DATASET\n');
        console.log('=' .repeat(50));

        // 1. Get total count and basic stats
        console.log('\n1. OVERALL DATASET STATISTICS');
        console.log('-'.repeat(30));
        
        const { data: totalData, error: totalError } = await supabase
            .from('cape_town_competitors')
            .select('*');

        if (totalError) {
            console.error('Error fetching data:', totalError);
            return;
        }

        console.log(`Total Properties: ${totalData.length}`);
        console.log(`Scan Date: ${new Date().toLocaleDateString()}`);

        // 2. Area breakdown
        console.log('\n2. AREA BREAKDOWN');
        console.log('-'.repeat(30));
        
        const areaStats = {};
        totalData.forEach(property => {
            const area = property.area || 'Unknown';
            if (!areaStats[area]) {
                areaStats[area] = { count: 0, platforms: {} };
            }
            areaStats[area].count++;
            
            const platform = property.platform || 'Unknown';
            if (!areaStats[area].platforms[platform]) {
                areaStats[area].platforms[platform] = 0;
            }
            areaStats[area].platforms[platform]++;
        });

        Object.entries(areaStats).forEach(([area, stats]) => {
            console.log(`\n${area}:`);
            console.log(`  Total: ${stats.count} properties`);
            Object.entries(stats.platforms).forEach(([platform, count]) => {
                console.log(`    ${platform}: ${count}`);
            });
        });

        // 3. Platform breakdown
        console.log('\n3. PLATFORM BREAKDOWN');
        console.log('-'.repeat(30));
        
        const platformStats = {};
        totalData.forEach(property => {
            const platform = property.platform || 'Unknown';
            if (!platformStats[platform]) {
                platformStats[platform] = { count: 0, areas: {} };
            }
            platformStats[platform].count++;
            
            const area = property.area || 'Unknown';
            if (!platformStats[platform].areas[area]) {
                platformStats[platform].areas[area] = 0;
            }
            platformStats[platform].areas[area]++;
        });

        Object.entries(platformStats).forEach(([platform, stats]) => {
            console.log(`\n${platform.toUpperCase()}:`);
            console.log(`  Total: ${stats.count} properties`);
            Object.entries(stats.areas).forEach(([area, count]) => {
                console.log(`    ${area}: ${count}`);
            });
        });

        // 4. Price analysis
        console.log('\n4. PRICE ANALYSIS');
        console.log('-'.repeat(30));
        
        const prices = totalData.filter(p => p.current_price && p.current_price > 0).map(p => p.current_price);
        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            
            console.log(`Price Range: R${minPrice} - R${maxPrice}`);
            console.log(`Average Price: R${Math.round(avgPrice)}`);
            console.log(`Properties with Valid Prices: ${prices.length}/${totalData.length}`);
        }

        // 5. Data quality checks
        console.log('\n5. DATA QUALITY CHECKS');
        console.log('-'.repeat(30));
        
        const qualityIssues = {
            missingPrices: 0,
            missingRatings: 0,
            missingCoordinates: 0,
            missingImages: 0,
            missingAmenities: 0,
            invalidPrices: 0,
            invalidRatings: 0
        };

        totalData.forEach(property => {
            // Check for missing prices
            if (!property.current_price || property.current_price <= 0) {
                qualityIssues.missingPrices++;
            }
            
            // Check for invalid prices (unrealistic)
            if (property.current_price && (property.current_price < 100 || property.current_price > 100000)) {
                qualityIssues.invalidPrices++;
            }
            
            // Check for missing ratings
            if (!property.rating) {
                qualityIssues.missingRatings++;
            }
            
            // Check for invalid ratings
            if (property.rating && (property.rating < 0 || property.rating > 5)) {
                qualityIssues.invalidRatings++;
            }
            
            // Check for missing coordinates
            if (!property.coordinates || !property.coordinates.lat || !property.coordinates.lng) {
                qualityIssues.missingCoordinates++;
            }
            
            // Check for missing images
            if (!property.images || property.images.length === 0) {
                qualityIssues.missingImages++;
            }
            
            // Check for missing amenities
            if (!property.amenities || property.amenities.length === 0) {
                qualityIssues.missingAmenities++;
            }
        });

        Object.entries(qualityIssues).forEach(([issue, count]) => {
            const percentage = ((count / totalData.length) * 100).toFixed(1);
            console.log(`${issue}: ${count} (${percentage}%)`);
        });

        // 6. Property type distribution
        console.log('\n6. PROPERTY TYPE DISTRIBUTION');
        console.log('-'.repeat(30));
        
        const propertyTypes = {};
        totalData.forEach(property => {
            const type = property.property_type || 'Unknown';
            if (!propertyTypes[type]) {
                propertyTypes[type] = 0;
            }
            propertyTypes[type]++;
        });

        Object.entries(propertyTypes).forEach(([type, count]) => {
            const percentage = ((count / totalData.length) * 100).toFixed(1);
            console.log(`${type}: ${count} (${percentage}%)`);
        });

        // 7. Recent activity
        console.log('\n7. RECENT ACTIVITY');
        console.log('-'.repeat(30));
        
        const recentProperties = totalData.filter(p => {
            if (!p.scan_date) return false;
            const scanDate = new Date(p.scan_date);
            const now = new Date();
            const diffDays = (now - scanDate) / (1000 * 60 * 60 * 24);
            return diffDays <= 7;
        });

        console.log(`Properties scanned in last 7 days: ${recentProperties.length}`);
        console.log(`Properties scanned in last 24 hours: ${totalData.filter(p => {
            if (!p.scan_date) return false;
            const scanDate = new Date(p.scan_date);
            const now = new Date();
            const diffHours = (now - scanDate) / (1000 * 60 * 60);
            return diffHours <= 24;
        }).length}`);

        // 8. Summary
        console.log('\n8. AUDIT SUMMARY');
        console.log('-'.repeat(30));
        console.log(`✅ Total Properties: ${totalData.length}`);
        console.log(`✅ Areas Covered: ${Object.keys(areaStats).length}`);
        console.log(`✅ Platforms: ${Object.keys(platformStats).length}`);
        console.log(`✅ Data Completeness: ${((totalData.length - qualityIssues.missingPrices) / totalData.length * 100).toFixed(1)}%`);
        
        const overallQuality = 100 - (
            (qualityIssues.missingPrices + qualityIssues.missingRatings + qualityIssues.missingCoordinates) / 
            (totalData.length * 3) * 100
        );
        console.log(`✅ Overall Data Quality: ${overallQuality.toFixed(1)}%`);

        // 9. Recommendations
        console.log('\n9. RECOMMENDATIONS');
        console.log('-'.repeat(30));
        
        if (qualityIssues.missingPrices > 0) {
            console.log(`⚠️  ${qualityIssues.missingPrices} properties missing prices - investigate data source`);
        }
        if (qualityIssues.missingCoordinates > 0) {
            console.log(`⚠️  ${qualityIssues.missingCoordinates} properties missing coordinates - improve geocoding`);
        }
        if (qualityIssues.invalidPrices > 0) {
            console.log(`⚠️  ${qualityIssues.invalidPrices} properties have unrealistic prices - validate pricing logic`);
        }
        if (qualityIssues.invalidRatings > 0) {
            console.log(`⚠️  ${qualityIssues.invalidRatings} properties have invalid ratings - check rating normalization`);
        }

        console.log('\n🎯 AUDIT COMPLETE');
        console.log('=' .repeat(50));

    } catch (error) {
        console.error('Audit failed:', error);
    }
}

auditCompleteDataset();
