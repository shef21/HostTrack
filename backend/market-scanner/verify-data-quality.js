const { createClient } = require('@supabase/supabase-js');
const { DATA_VALIDATION } = require('./config/scanner.config');

// Supabase configuration
const SUPABASE_URL = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';

async function verifyDataQuality() {
    console.log('🔍 Starting data quality verification...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    try {
        // 1. Check Data Completeness
        console.log('\n📊 Checking data completeness...');
        const { data: competitors, error: competitorsError } = await supabase
            .from('cape_town_competitors')
            .select('*')
            .eq('area', 'Sea Point');
            
        if (competitorsError) throw competitorsError;
        
        const totalListings = competitors?.length || 0;
        console.log(`Total listings found: ${totalListings}`);
        
        if (totalListings === 0) {
            console.log('ℹ️ No data found yet - scanner needs to run first');
            return;
        }

        // 2. Platform Distribution
        const platformCounts = competitors.reduce((acc, curr) => {
            acc[curr.platform] = (acc[curr.platform] || 0) + 1;
            return acc;
        }, {});
        
        console.log('\n📱 Platform distribution:');
        Object.entries(platformCounts).forEach(([platform, count]) => {
            const percentage = ((count / totalListings) * 100).toFixed(1);
            console.log(`${platform}: ${count} (${percentage}%)`);
        });
        
        // 3. Price Range Analysis
        const prices = competitors.map(c => c.current_price).filter(Boolean);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        console.log('\n💰 Price analysis:');
        console.log(`Average price: R${avgPrice.toFixed(2)}`);
        console.log(`Price range: R${minPrice} - R${maxPrice}`);
        
        // 4. Data Quality Scores
        console.log('\n🎯 Data quality scores:');
        
        const qualityScores = competitors.map(listing => {
            let score = 0;
            let maxScore = 0;
            
            // Check required fields
            DATA_VALIDATION.required_fields.forEach(field => {
                maxScore++;
                if (listing[field]) score++;
            });
            
            // Check numeric fields
            DATA_VALIDATION.numeric_fields.forEach(field => {
                if (listing[field]) {
                    maxScore++;
                    if (!isNaN(parseFloat(listing[field]))) score++;
                }
            });
            
            // Check string fields
            DATA_VALIDATION.string_fields.forEach(field => {
                if (listing[field]) {
                    maxScore++;
                    if (typeof listing[field] === 'string' && listing[field].trim()) score++;
                }
            });
            
            return (score / maxScore) * 100;
        });
        
        const avgQualityScore = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
        console.log(`Average data quality score: ${avgQualityScore.toFixed(1)}%`);
        
        // 5. Missing Data Analysis
        console.log('\n❌ Missing data analysis:');
        const missingData = {};
        
        competitors.forEach(listing => {
            Object.keys(listing).forEach(field => {
                if (!listing[field]) {
                    missingData[field] = (missingData[field] || 0) + 1;
                }
            });
        });
        
        Object.entries(missingData).forEach(([field, count]) => {
            const percentage = ((count / totalListings) * 100).toFixed(1);
            console.log(`${field}: missing in ${count} listings (${percentage}%)`);
        });
        
        // 6. Duplicate Detection
        console.log('\n🔄 Checking for duplicates...');
        const duplicates = competitors.reduce((acc, curr) => {
            const key = `${curr.platform}-${curr.external_id}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        
        const duplicateCount = Object.values(duplicates).filter(count => count > 1).length;
        console.log(`Found ${duplicateCount} potential duplicates`);
        
        // 7. Data Freshness
        console.log('\n⏰ Data freshness analysis:');
        const now = new Date();
        const freshness = competitors.map(listing => {
            const updated = new Date(listing.updated_at);
            return (now - updated) / (1000 * 60 * 60); // Hours
        });
        
        const avgFreshness = freshness.reduce((a, b) => a + b, 0) / freshness.length;
        console.log(`Average data age: ${avgFreshness.toFixed(1)} hours`);
        
        // Overall Health Score
        const healthScore = (
            (avgQualityScore * 0.4) + // 40% weight on data quality
            ((1 - (duplicateCount / totalListings)) * 30) + // 30% weight on duplicate freedom
            ((1 - (avgFreshness / 24)) * 30) // 30% weight on freshness (normalized to 24 hours)
        ).toFixed(1);
        
        console.log('\n🏆 Overall Data Health Score:', healthScore + '%');
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}

// Run verification if called directly
if (require.main === module) {
    verifyDataQuality();
}

module.exports = { verifyDataQuality };