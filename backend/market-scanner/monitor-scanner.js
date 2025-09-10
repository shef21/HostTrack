require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { AREAS, SCAN_CONFIG, RATE_LIMITS } = require('./config/scanner.config');

class ScannerMonitor {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        this.metrics = {
            scanStart: null,
            scanEnd: null,
            totalListings: 0,
            newListings: 0,
            updatedListings: 0,
            errorCount: 0,
            platformMetrics: {},
            rateLimitHits: 0,
            processingTime: 0
        };
    }

    async monitorScan() {
        console.log('🔍 Starting scanner monitoring...');
        this.metrics.scanStart = new Date();

        try {
            // 1. Monitor Database Changes
            await this.trackDatabaseChanges();

            // 2. Check Rate Limiting
            await this.checkRateLimits();

            // 3. Verify Data Consistency
            await this.verifyDataConsistency();

            // 4. Generate Performance Report
            await this.generatePerformanceReport();

        } catch (error) {
            console.error('❌ Monitoring error:', error);
            this.metrics.errorCount++;
        }
    }

    async trackDatabaseChanges() {
        console.log('\n📊 Tracking database changes...');

        const startTime = new Date();
        startTime.setHours(startTime.getHours() - 1); // Look at last hour's changes

        // Get recent changes
        const { data: changes, error } = await this.supabase
            .from('cape_town_competitors')
            .select('*')
            .eq('area', 'Sea Point')
            .gte('created_at', startTime.toISOString());

        if (error) throw error;

        // Analyze changes
        this.metrics.totalListings = changes.length;
        
        // Group by platform
        this.metrics.platformMetrics = changes.reduce((acc, curr) => {
            if (!acc[curr.platform]) {
                acc[curr.platform] = {
                    count: 0,
                    avgPrice: 0,
                    newListings: 0,
                    updates: 0
                };
            }
            
            acc[curr.platform].count++;
            acc[curr.platform].avgPrice += curr.current_price || 0;
            
            if (curr.created_at === curr.updated_at) {
                acc[curr.platform].newListings++;
                this.metrics.newListings++;
            } else {
                acc[curr.platform].updates++;
                this.metrics.updatedListings++;
            }
            
            return acc;
        }, {});

        // Calculate averages
        Object.values(this.metrics.platformMetrics).forEach(platform => {
            if (platform.count > 0) {
                platform.avgPrice = platform.avgPrice / platform.count;
            }
        });
    }

    async checkRateLimits() {
        console.log('\n⚡ Checking rate limits...');

        // Check recent requests
        const startTime = new Date();
        startTime.setMinutes(startTime.getMinutes() - 1); // Last minute

        const { data: requests, error } = await this.supabase
            .from('cape_town_market_data')
            .select('created_at')
            .gte('created_at', startTime.toISOString());

        if (error) throw error;

        const requestCount = requests.length;
        const isRateLimited = requestCount >= RATE_LIMITS.requestsPerMinute;

        if (isRateLimited) {
            this.metrics.rateLimitHits++;
            console.warn(`⚠️ Rate limit threshold reached: ${requestCount} requests/minute`);
        }
    }

    async verifyDataConsistency() {
        console.log('\n🔍 Verifying data consistency...');

        // Check for missing required fields
        const { data: inconsistentData, error } = await this.supabase
            .from('cape_town_competitors')
            .select('*')
            .eq('area', 'Sea Point')
            .or('current_price.is.null,external_id.is.null,platform.is.null');

        if (error) throw error;

        if (inconsistentData.length > 0) {
            console.warn(`⚠️ Found ${inconsistentData.length} records with missing required fields`);
            
            // Group by missing field
            const missingFields = inconsistentData.reduce((acc, curr) => {
                Object.entries(curr).forEach(([key, value]) => {
                    if (!value && ['current_price', 'external_id', 'platform'].includes(key)) {
                        acc[key] = (acc[key] || 0) + 1;
                    }
                });
                return acc;
            }, {});

            console.log('Missing fields breakdown:', missingFields);
        }
    }

    async generatePerformanceReport() {
        this.metrics.scanEnd = new Date();
        this.metrics.processingTime = 
            (this.metrics.scanEnd - this.metrics.scanStart) / 1000; // in seconds

        console.log('\n📊 Scanner Performance Report');
        console.log('============================');
        console.log(`Scan Duration: ${this.metrics.processingTime.toFixed(2)} seconds`);
        console.log(`Total Listings Processed: ${this.metrics.totalListings}`);
        console.log(`New Listings: ${this.metrics.newListings}`);
        console.log(`Updated Listings: ${this.metrics.updatedListings}`);
        console.log(`Error Count: ${this.metrics.errorCount}`);
        console.log(`Rate Limit Hits: ${this.metrics.rateLimitHits}`);

        console.log('\nPlatform Metrics:');
        Object.entries(this.metrics.platformMetrics).forEach(([platform, metrics]) => {
            console.log(`\n${platform}:`);
            console.log(`  Listings: ${metrics.count}`);
            console.log(`  Average Price: R${metrics.avgPrice.toFixed(2)}`);
            console.log(`  New Listings: ${metrics.newListings}`);
            console.log(`  Updates: ${metrics.updates}`);
        });

        // Calculate health score
        const healthScore = this.calculateHealthScore();
        console.log(`\n🏆 Overall Scanner Health: ${healthScore}%`);

        // Store metrics in database for historical tracking
        await this.storeMetrics();
    }

    calculateHealthScore() {
        // Weighted scoring system
        const weights = {
            errorRate: 0.3,
            rateLimitHealth: 0.2,
            dataQuality: 0.3,
            processingSpeed: 0.2
        };

        // Calculate individual scores
        const errorScore = Math.max(0, 100 - (this.metrics.errorCount * 10));
        const rateLimitScore = Math.max(0, 100 - (this.metrics.rateLimitHits * 20));
        const dataQualityScore = 
            (this.metrics.totalListings > 0) 
                ? ((this.metrics.newListings + this.metrics.updatedListings) / this.metrics.totalListings) * 100
                : 0;
        const speedScore = 
            (this.metrics.processingTime < 60) 
                ? 100 
                : Math.max(0, 100 - ((this.metrics.processingTime - 60) / 60) * 100);

        // Calculate weighted average
        return Math.round(
            errorScore * weights.errorRate +
            rateLimitScore * weights.rateLimitHealth +
            dataQualityScore * weights.dataQuality +
            speedScore * weights.processingSpeed
        );
    }

    async storeMetrics() {
        try {
            const { error } = await this.supabase
                .from('cape_town_market_trends')
                .insert([{
                    area: 'Sea Point',
                    trend_type: 'scanner_metrics',
                    trend_value: this.calculateHealthScore(),
                    trend_direction: 'stable',
                    data_points: this.metrics.totalListings,
                    start_date: this.metrics.scanStart,
                    end_date: this.metrics.scanEnd,
                    confidence_level: 0.95
                }]);

            if (error) throw error;
            console.log('✅ Metrics stored successfully');
        } catch (error) {
            console.error('❌ Failed to store metrics:', error);
        }
    }
}

// Run monitor if called directly
if (require.main === module) {
    const monitor = new ScannerMonitor();
    monitor.monitorScan();
}

module.exports = ScannerMonitor;
