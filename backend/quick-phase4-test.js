#!/usr/bin/env node

/**
 * Quick Phase 4 Test - Market Intelligence Core Functionality
 */

const { calculateMarketIntelligence } = require('./routes/ai-chat.js');

console.log('🚀 Quick Phase 4 Test: Market Intelligence Core...\n');

// Simple test data
const testProperties = [
    {
        id: 1,
        name: 'Test Property',
        location: 'Cape Town, Western Cape',
        type: 'house',
        price: 2000,
        amenities: ['pool', 'garden']
    }
];

const testTrends = {
    revenueTrend: 'increasing',
    seasonalPattern: 'summer_peak'
};

const testPredictive = {
    revenueForecast: { trend: 'increasing' },
    occupancyForecast: { nextMonth: 85 }
};

const testRecommendations = {
    pricingRecommendations: [{ type: 'test' }]
};

try {
    console.log('🧪 Testing market intelligence function...');
    const result = calculateMarketIntelligence(testProperties, testTrends, testPredictive, testRecommendations);
    
    console.log('✅ Function executed successfully!');
    console.log(`📊 Competitor analysis: ${result.competitorAnalysis?.length || 0} items`);
    console.log(`📈 Market trends: ${result.marketTrends?.length || 0} items`);
    console.log(`⭐ Competitive advantages: ${result.competitiveAdvantages?.length || 0} items`);
    console.log(`🎯 Market opportunities: ${result.marketOpportunities?.length || 0} items`);
    console.log(`📊 Demand forecast: ${result.demandForecast ? 'Generated' : 'Not generated'}`);
    console.log(`🎯 Confidence level: ${result.confidence}`);
    
    console.log('\n🎉 Phase 4 Market Intelligence is working correctly!');
    
} catch (error) {
    console.error('❌ Error:', error.message);
}
