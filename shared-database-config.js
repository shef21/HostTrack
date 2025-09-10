/**
 * Shared Database Configuration
 * For use by separate AI agent and HostTrack project
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase Configuration
const SUPABASE_URL = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Market Intelligence Functions
class MarketIntelligence {
    constructor() {
        this.supabase = supabase;
    }

    // Get competitor properties by area
    async getCompetitorsByArea(area, propertyType = null) {
        try {
            let query = this.supabase
                .from('cape_town_competitors')
                .select('*')
                .eq('area', area)
                .eq('platform', 'airbnb');

            if (propertyType) {
                query = query.eq('property_type', propertyType);
            }

            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching competitors by area:', error);
            return [];
        }
    }

    // Get pricing analysis for area
    async getPricingAnalysis(area, propertyType = null) {
        try {
            const competitors = await this.getCompetitorsByArea(area, propertyType);
            
            if (competitors.length === 0) {
                return {
                    averagePrice: 0,
                    minPrice: 0,
                    maxPrice: 0,
                    medianPrice: 0,
                    totalProperties: 0,
                    priceRange: 'No data available'
                };
            }

            const prices = competitors
                .map(c => c.current_price)
                .filter(p => p && p > 0)
                .sort((a, b) => a - b);

            const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const medianPrice = prices[Math.floor(prices.length / 2)];

            return {
                averagePrice: Math.round(averagePrice),
                minPrice,
                maxPrice,
                medianPrice,
                totalProperties: competitors.length,
                priceRange: `R${minPrice} - R${maxPrice}`
            };
        } catch (error) {
            console.error('Error calculating pricing analysis:', error);
            return null;
        }
    }

    // Get market trends by area
    async getMarketTrends(area) {
        try {
            const { data, error } = await this.supabase
                .from('cape_town_market_trends')
                .select('*')
                .eq('area', area)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching market trends:', error);
            return [];
        }
    }

    // Get area statistics
    async getAreaStats(area) {
        try {
            const { data, error } = await this.supabase
                .from('cape_town_area_stats')
                .select('*')
                .eq('area', area)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching area stats:', error);
            return null;
        }
    }

    // Get competitive analysis
    async getCompetitiveAnalysis(area, propertyType = null) {
        try {
            const [pricing, trends, stats] = await Promise.all([
                this.getPricingAnalysis(area, propertyType),
                this.getMarketTrends(area),
                this.getAreaStats(area)
            ]);

            return {
                area,
                propertyType,
                pricing,
                trends,
                stats,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error generating competitive analysis:', error);
            return null;
        }
    }

    // Get all available areas
    async getAvailableAreas() {
        try {
            const { data, error } = await this.supabase
                .from('cape_town_competitors')
                .select('area')
                .eq('platform', 'airbnb');

            if (error) throw error;
            
            const areas = [...new Set(data.map(item => item.area))];
            return areas;
        } catch (error) {
            console.error('Error fetching available areas:', error);
            return [];
        }
    }

    // Get property types by area
    async getPropertyTypes(area) {
        try {
            const { data, error } = await this.supabase
                .from('cape_town_competitors')
                .select('property_type')
                .eq('area', area)
                .eq('platform', 'airbnb');

            if (error) throw error;
            
            const types = [...new Set(data.map(item => item.property_type))];
            return types;
        } catch (error) {
            console.error('Error fetching property types:', error);
            return [];
        }
    }
}

// Export for use in AI agent
module.exports = {
    supabase,
    MarketIntelligence,
    SUPABASE_URL,
    SUPABASE_ANON_KEY
};

// Example usage for AI agent
if (require.main === module) {
    const marketIntel = new MarketIntelligence();
    
    async function testConnection() {
        console.log('🔍 Testing database connection...');
        
        try {
            const areas = await marketIntel.getAvailableAreas();
            console.log('✅ Available areas:', areas);
            
            const pricing = await marketIntel.getPricingAnalysis('Sea Point');
            console.log('✅ Sea Point pricing:', pricing);
            
            const analysis = await marketIntel.getCompetitiveAnalysis('Century City', 'apartment');
            console.log('✅ Competitive analysis:', analysis);
            
        } catch (error) {
            console.error('❌ Connection test failed:', error);
        }
    }
    
    testConnection();
}
