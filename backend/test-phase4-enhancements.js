#!/usr/bin/env node

/**
 * Phase 4 Enhancement Tests: Advanced Market Intelligence
 * Tests the new market intelligence engine including:
 * - Competitor analysis and market positioning
 * - Market trends and demand patterns
 * - Competitive advantages identification
 * - Market opportunities analysis
 */

const { calculateMarketIntelligence } = require('./routes/ai-chat.js');

console.log('🚀 Starting Phase 4 Enhancement Tests: Advanced Market Intelligence...\n');

// Test data for market intelligence
const mockProperties = [
    {
        id: 1,
        name: 'Cape Town Beach Villa',
        location: 'Cape Town, Western Cape',
        type: 'house',
        price: 2500,
        amenities: ['ocean view', 'pool', 'garden', 'parking']
    },
    {
        id: 2,
        name: 'Johannesburg Business Suite',
        location: 'Johannesburg, Gauteng',
        type: 'apartment',
        price: 1800,
        amenities: ['wifi', 'gym', 'security']
    },
    {
        id: 3,
        name: 'Durban Coastal Apartment',
        location: 'Durban, KwaZulu-Natal',
        type: 'apartment',
        price: 1200,
        amenities: ['beach access', 'balcony']
    }
];

const mockTrendMetrics = {
    revenueTrend: 'increasing',
    occupancyTrend: 'improving',
    expenseTrend: 'rising',
    seasonalPattern: 'summer_peak',
    monthlyData: {
        '2024-01': { revenue: 15000, occupancy: 85, expenses: 8000 },
        '2024-02': { revenue: 18000, occupancy: 90, expenses: 8500 },
        '2024-03': { revenue: 16000, occupancy: 80, expenses: 8200 }
    }
};

const mockPredictiveInsights = {
    revenueForecast: {
        trend: 'increasing',
        nextMonth: 19000,
        nextQuarter: 55000,
        confidence: 'high'
    },
    occupancyForecast: {
        nextMonth: 92,
        nextQuarter: 88,
        peakSeason: true,
        confidence: 'medium'
    },
    expenseForecast: {
        trend: 'stable',
        nextMonth: 8500,
        nextQuarter: 25000,
        confidence: 'medium'
    }
};

const mockSmartRecommendations = {
    pricingRecommendations: [
        {
            type: 'rate_optimization',
            action: 'Increase rates gradually',
            currentPrice: 1200,
            suggestedIncrease: 180,
            reasoning: 'Revenue is growing - capitalize on demand',
            timing: 'Next 30 days',
            expectedImpact: '15-20% revenue increase'
        }
    ],
    marketingStrategies: [
        {
            type: 'peak_season_marketing',
            action: 'Aggressive marketing during peak season',
            strategy: 'Social media campaigns and partnerships',
            targetAudience: 'Tourists and business travelers',
            expectedImpact: '25-30% increase in bookings'
        }
    ],
    propertyImprovements: [
        {
            name: 'Kitchen Upgrade',
            cost: 15000,
            roi: 85,
            paybackPeriod: 14,
            monthlyRevenueIncrease: 1200,
            description: 'Modern kitchen with new appliances'
        }
    ],
    investmentOpportunities: [
        {
            type: 'property_expansion',
            opportunity: 'Add new property in growing market',
            investment: 500000,
            expectedROI: 25,
            paybackPeriod: 48,
            risk: 'medium',
            marketConditions: 'Favorable'
        }
    ]
};

// Test 1: Market Intelligence Function
console.log('🧪 Testing Market Intelligence Function...');
try {
    const marketIntelligence = calculateMarketIntelligence(
        mockProperties,
        mockTrendMetrics,
        mockPredictiveInsights,
        mockSmartRecommendations
    );
    
    console.log('✅ Market intelligence result:', JSON.stringify(marketIntelligence, null, 2));
    
    // Validate competitor analysis
    if (marketIntelligence.competitorAnalysis && marketIntelligence.competitorAnalysis.length > 0) {
        console.log('✅ Competitor analysis generated successfully');
        const competitor = marketIntelligence.competitorAnalysis[0];
        console.log(`   - Market position: ${competitor.marketPosition}`);
        console.log(`   - Competitor count: ${competitor.competitorCount}`);
        console.log(`   - Price difference: ${competitor.priceDifference}`);
        console.log(`   - Market share: ${competitor.marketShare}%`);
    } else {
        console.log('❌ No competitor analysis generated');
    }
    
    // Validate market trends
    if (marketIntelligence.marketTrends && marketIntelligence.marketTrends.length > 0) {
        console.log('✅ Market trends generated successfully');
        marketIntelligence.marketTrends.forEach(trend => {
            console.log(`   - ${trend.type}: ${trend.pattern || trend.trend}`);
        });
    } else {
        console.log('❌ No market trends generated');
    }
    
    // Validate competitive advantages
    if (marketIntelligence.competitiveAdvantages && marketIntelligence.competitiveAdvantages.length > 0) {
        console.log('✅ Competitive advantages generated successfully');
        const advantage = marketIntelligence.competitiveAdvantages[0];
        console.log(`   - Property: ${advantage.propertyName}`);
        console.log(`   - Advantage score: ${advantage.totalAdvantageScore}`);
        console.log(`   - Advantages count: ${advantage.advantages.length}`);
    } else {
        console.log('❌ No competitive advantages generated');
    }
    
    // Validate market opportunities
    if (marketIntelligence.marketOpportunities && marketIntelligence.marketOpportunities.length > 0) {
        console.log('✅ Market opportunities generated successfully');
        marketIntelligence.marketOpportunities.forEach(opportunity => {
            console.log(`   - ${opportunity.type}: ${opportunity.opportunity} (${opportunity.potential} potential)`);
        });
    } else {
        console.log('❌ No market opportunities generated');
    }
    
    // Validate demand forecast
    if (marketIntelligence.demandForecast && Object.keys(marketIntelligence.demandForecast).length > 0) {
        console.log('✅ Demand forecast generated successfully');
        console.log(`   - Current demand: ${marketIntelligence.demandForecast.currentDemand}%`);
        console.log(`   - Market capacity: ${marketIntelligence.demandForecast.marketCapacity}`);
        console.log(`   - Growth potential: ${marketIntelligence.demandForecast.growthPotential}`);
    } else {
        console.log('❌ No demand forecast generated');
    }
    
    console.log(`\n🎯 Overall confidence level: ${marketIntelligence.confidence}`);
    
} catch (error) {
    console.error('❌ Error testing market intelligence:', error);
}

// Test 2: Edge Cases
console.log('\n🧪 Testing Edge Cases...');

// Test with no properties
console.log('Testing with no properties...');
try {
    const emptyResult = calculateMarketIntelligence([], mockTrendMetrics, mockPredictiveInsights, mockSmartRecommendations);
    if (emptyResult.competitorAnalysis === 'insufficient_data') {
        console.log('✅ Correctly handles empty properties array');
    } else {
        console.log('❌ Should return insufficient_data for empty properties');
    }
} catch (error) {
    console.error('❌ Error testing empty properties:', error);
}

// Test with insufficient data
console.log('Testing with insufficient data...');
try {
    const insufficientData = {
        revenueTrend: 'insufficient_data',
        occupancyTrend: 'insufficient_data',
        seasonalPattern: 'insufficient_data'
    };
    
    const insufficientResult = calculateMarketIntelligence(
        mockProperties,
        insufficientData,
        { revenueForecast: 'insufficient_data', occupancyForecast: 'insufficient_data' },
        { pricingRecommendations: 'insufficient_data' }
    );
    
    if (insufficientResult.confidence === 'low') {
        console.log('✅ Correctly sets low confidence for insufficient data');
    } else {
        console.log('❌ Should set low confidence for insufficient data');
    }
} catch (error) {
    console.error('❌ Error testing insufficient data:', error);
}

// Test 3: Data Quality Validation
console.log('\n🧪 Testing Data Quality Validation...');

try {
    const highQualityData = {
        revenueTrend: 'increasing',
        occupancyTrend: 'improving',
        seasonalPattern: 'summer_peak'
    };
    
    const highQualityPredictive = {
        revenueForecast: { trend: 'increasing', confidence: 'high' },
        occupancyForecast: { confidence: 'high' }
    };
    
    const highQualityRecommendations = {
        pricingRecommendations: [{ type: 'optimization' }]
    };
    
    const highQualityResult = calculateMarketIntelligence(
        mockProperties,
        highQualityData,
        highQualityPredictive,
        highQualityRecommendations
    );
    
    if (highQualityResult.confidence === 'high') {
        console.log('✅ Correctly sets high confidence for quality data');
    } else {
        console.log('❌ Should set high confidence for quality data');
    }
} catch (error) {
    console.error('❌ Error testing data quality validation:', error);
}

console.log('\n🎉 Phase 4 Market Intelligence Tests Completed!');
console.log('\n📊 Summary of New Capabilities:');
console.log('   🏆 Competitor Analysis - Market positioning and share insights');
console.log('   📈 Market Trends - Demand patterns and seasonal analysis');
console.log('   ⭐ Competitive Advantages - Location and feature benefits');
console.log('   🎯 Market Opportunities - Growth and expansion potential');
console.log('   📊 Demand Forecasting - Market capacity and saturation analysis');
console.log('\n🚀 Nathi is now a comprehensive market intelligence advisor!');
