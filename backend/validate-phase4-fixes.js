#!/usr/bin/env node

/**
 * Phase 4 Fixes Validation Test
 * Tests the corrected mathematical calculations for market intelligence
 */

const { calculateMarketIntelligence } = require('./routes/ai-chat.js');

console.log('🔧 Phase 4 Fixes Validation Test...\n');

// Test data with known values for validation
const testProperties = [
    {
        id: 1,
        name: 'Test Property 1',
        location: 'Cape Town, Western Cape',
        type: 'house',
        price: 2000,
        amenities: ['pool', 'garden']
    },
    {
        id: 2,
        name: 'Test Property 2',
        location: 'Johannesburg, Gauteng',
        type: 'apartment',
        price: 1500,
        amenities: ['wifi', 'gym']
    }
];

const testTrendMetrics = {
    revenueTrend: 'increasing',
    occupancyTrend: 'improving',
    expenseTrend: 'stable',
    seasonalPattern: 'summer_peak'
};

const testPredictiveInsights = {
    revenueForecast: {
        trend: 'increasing',
        nextMonth: 18000,
        confidence: 'high'
    },
    occupancyForecast: {
        nextMonth: 85, // 85% occupancy
        nextQuarter: 80,
        peakSeason: true,
        confidence: 'medium'
    },
    expenseForecast: {
        trend: 'stable',
        nextMonth: 8000,
        confidence: 'medium'
    }
};

const testSmartRecommendations = {
    pricingRecommendations: [{ type: 'test' }],
    marketingStrategies: [{ type: 'test' }],
    propertyImprovements: [{ type: 'test' }],
    investmentOpportunities: [{ type: 'test' }]
};

console.log('🧪 Testing Corrected Market Intelligence Calculations...\n');

try {
    const result = calculateMarketIntelligence(
        testProperties,
        testTrendMetrics,
        testPredictiveInsights,
        testSmartRecommendations
    );
    
    console.log('✅ Function executed successfully!');
    
    // Validate demand forecast calculations
    if (result.demandForecast && Object.keys(result.demandForecast).length > 0) {
        console.log('\n📊 Demand Forecast Validation:');
        
        const forecast = result.demandForecast;
        const expectedCapacity = 2 * 30 * 3; // 2 properties × 30 days × 3 nights average
        
        console.log(`   - Properties: ${testProperties.length}`);
        console.log(`   - Expected Capacity: ${expectedCapacity} nights/month`);
        console.log(`   - Actual Capacity: ${forecast.marketCapacity} nights/month`);
        console.log(`   - Current Occupancy: ${forecast.currentDemand}%`);
        console.log(`   - Market Saturation: ${forecast.marketSaturation}%`);
        console.log(`   - Demand Gap: ${forecast.demandGap} nights`);
        
        // Validate calculations
        if (forecast.marketCapacity === expectedCapacity) {
            console.log('   ✅ Market capacity calculation: CORRECT');
        } else {
            console.log('   ❌ Market capacity calculation: INCORRECT');
        }
        
        if (forecast.marketSaturation === forecast.currentDemand) {
            console.log('   ✅ Market saturation calculation: CORRECT');
        } else {
            console.log('   ❌ Market saturation calculation: INCORRECT');
        }
        
        const expectedDemandGap = Math.max(0, expectedCapacity - Math.round((85 / 100) * expectedCapacity));
        if (forecast.demandGap === expectedDemandGap) {
            console.log('   ✅ Demand gap calculation: CORRECT');
        } else {
            console.log('   ❌ Demand gap calculation: INCORRECT');
        }
        
        console.log(`   - Growth Potential: ${forecast.growthPotential}`);
        
    } else {
        console.log('❌ No demand forecast generated');
    }
    
    // Validate market trends
    if (result.marketTrends && result.marketTrends.length > 0) {
        console.log('\n📈 Market Trends Validation:');
        result.marketTrends.forEach(trend => {
            if (trend.type === 'seasonal_demand') {
                console.log(`   - Pattern: ${trend.pattern}`);
                console.log(`   - Peak Season: ${trend.peakSeason}`);
                console.log(`   - Low Season: ${trend.lowSeason}`);
                
                // Validate seasonal logic
                if (trend.pattern === 'summer_peak' && trend.peakSeason === 'Dec-Feb') {
                    console.log('   ✅ Summer peak season logic: CORRECT');
                } else {
                    console.log('   ❌ Summer peak season logic: INCORRECT');
                }
            }
        });
    }
    
    // Validate competitor analysis
    if (result.competitorAnalysis && result.competitorAnalysis.length > 0) {
        console.log('\n🏆 Competitor Analysis Validation:');
        console.log(`   - Properties analyzed: ${result.competitorAnalysis.length}`);
        
        result.competitorAnalysis.forEach((competitor, index) => {
            console.log(`   - Property ${index + 1}:`);
            console.log(`     * Market Position: ${competitor.marketPosition}`);
            console.log(`     * Competitor Count: ${competitor.competitorCount}`);
            console.log(`     * Market Share: ${competitor.marketShare}%`);
            console.log(`     * Price Difference: R${competitor.priceDifference}`);
        });
    }
    
    // Validate competitive advantages
    if (result.competitiveAdvantages && result.competitiveAdvantages.length > 0) {
        console.log('\n⭐ Competitive Advantages Validation:');
        result.competitiveAdvantages.forEach((advantage, index) => {
            console.log(`   - Property ${index + 1}: ${advantage.propertyName}`);
            console.log(`     * Total Advantage Score: ${advantage.totalAdvantageScore}`);
            console.log(`     * Advantages Count: ${advantage.advantages.length}`);
            
            advantage.advantages.forEach(adv => {
                console.log(`     * ${adv.type}: ${adv.advantage} (${adv.strength} strength)`);
            });
        });
    }
    
    console.log(`\n🎯 Overall Confidence Level: ${result.confidence}`);
    
    // Final validation summary
    console.log('\n🔍 MATHEMATICAL VALIDATION SUMMARY:');
    
    const forecast = result.demandForecast;
    if (forecast) {
        const expectedCapacity = 2 * 30 * 3;
        const expectedDemandGap = Math.max(0, expectedCapacity - Math.round((85 / 100) * expectedCapacity));
        
        const capacityCorrect = forecast.marketCapacity === expectedCapacity;
        const saturationCorrect = forecast.marketSaturation === forecast.currentDemand;
        const gapCorrect = forecast.demandGap === expectedDemandGap;
        
        console.log(`   - Market Capacity: ${capacityCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
        console.log(`   - Market Saturation: ${saturationCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
        console.log(`   - Demand Gap: ${gapCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
        
        if (capacityCorrect && saturationCorrect && gapCorrect) {
            console.log('\n🎉 ALL MATHEMATICAL CALCULATIONS ARE NOW CORRECT!');
        } else {
            console.log('\n⚠️  SOME CALCULATIONS STILL NEED FIXING');
        }
    }
    
} catch (error) {
    console.error('❌ Error during validation:', error.message);
    console.error('Stack trace:', error.stack);
}
