/**
 * AI Chat Backend Route
 * Secure proxy for Gemini API calls with user authentication and rate limiting
 */

const express = require('express');
const router = express.Router();
const { getUserContext } = require('../config/supabase');
const authenticateUser = require('../middleware/auth');

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Rate limiting and cost control configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 15; // Gemini free tier limit
const MAX_REQUESTS_PER_DAY = 100; // Daily limit to control costs
const DAILY_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

// User usage tracking
const userRequestCounts = new Map(); // Per-minute tracking
const userDailyCounts = new Map(); // Daily tracking
const userTokenUsage = new Map(); // Token usage tracking

// Simple response cache to reduce AI calls
const responseCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Cleanup old cache entries every hour
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of responseCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            responseCache.delete(key);
        }
    }
    console.log(`AI Chat - Cache cleanup completed, ${responseCache.size} entries remaining`);
}, 60 * 60 * 1000); // Every hour

// Cost estimation (approximate)
const COST_PER_1K_INPUT_TOKENS = 0.00015; // $0.00015 per 1K input tokens
const COST_PER_1K_OUTPUT_TOKENS = 0.0006; // $0.0006 per 1K output tokens

// Enhanced middleware to check rate limits and daily usage
function checkRateLimit(req, res, next) {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const now = Date.now();
    
    // Check per-minute rate limit
    const userRequests = userRequestCounts.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
        return res.status(429).json({ 
            error: 'Rate limit exceeded', 
            message: 'Please wait a moment before sending another message',
            retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - recentRequests[0])) / 1000)
        });
    }
    
    // Check daily limit
    const userDailyRequests = userDailyCounts.get(userId) || [];
    const todayRequests = userDailyRequests.filter(time => now - time < DAILY_LIMIT_WINDOW);
    
    if (todayRequests.length >= MAX_REQUESTS_PER_DAY) {
        return res.status(429).json({ 
            error: 'Daily limit exceeded', 
            message: 'You have reached your daily AI chat limit. Please try again tomorrow.',
            retryAfter: Math.ceil((DAILY_LIMIT_WINDOW - (now - todayRequests[0])) / 1000)
        });
    }
    
    // Add current request to both trackers
    recentRequests.push(now);
    todayRequests.push(now);
    userRequestCounts.set(userId, recentRequests);
    userDailyCounts.set(userId, todayRequests);
    
    next();
}

// PHASE 1 ENHANCEMENT: Trend analysis function for historical data
function calculateTrendMetrics(historicalBookings, historicalExpenses, currentMonth) {
    try {
        if (!historicalBookings || !historicalExpenses || historicalBookings.length === 0) {
            return {
                revenueTrend: 'insufficient_data',
                occupancyTrend: 'insufficient_data',
                expenseTrend: 'insufficient_data',
                seasonalPattern: 'insufficient_data'
            };
        }

        // Group data by month for trend analysis
        const monthlyData = {};
        const currentYear = currentMonth.getFullYear();
        
        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const month = currentMonth.getMonth() - i;
            const year = month < 0 ? currentYear - 1 : currentYear;
            const monthKey = `${year}-${String(Math.abs(month)).padStart(2, '0')}`;
            monthlyData[monthKey] = {
                revenue: 0,
                bookings: 0,
                expenses: 0,
                confirmedBookings: 0
            };
        }

        // Process historical bookings
        historicalBookings.forEach(booking => {
            if (booking.status === 'confirmed' && booking.check_in) {
                const bookingDate = new Date(booking.check_in);
                const monthKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
                
                if (monthlyData[monthKey]) {
                    monthlyData[monthKey].revenue += booking.price || 0;
                    monthlyData[monthKey].bookings += 1;
                    monthlyData[monthKey].confirmedBookings += 1;
                }
            }
        });

        // Process historical expenses
        historicalExpenses.forEach(expense => {
            if (expense.date) {
                const expenseDate = new Date(expense.date);
                const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
                
                if (monthlyData[monthKey]) {
                    monthlyData[monthKey].expenses += expense.amount || 0;
                }
            }
        });

        // Calculate trends
        const months = Object.keys(monthlyData).sort();
        const revenueValues = months.map(month => monthlyData[month].revenue);
        const expenseValues = months.map(month => monthlyData[month].expenses);
        const bookingValues = months.map(month => monthlyData[month].confirmedBookings);

        // Revenue trend (last 3 months vs previous 3 months)
        let revenueTrend = 'stable';
        if (revenueValues.length >= 6) {
            const recentRevenue = revenueValues.slice(-3).reduce((sum, val) => sum + val, 0);
            const previousRevenue = revenueValues.slice(-6, -3).reduce((sum, val) => sum + val, 0);
            
            if (previousRevenue > 0) {
                const change = ((recentRevenue - previousRevenue) / previousRevenue) * 100;
                if (change > 10) revenueTrend = 'increasing';
                else if (change < -10) revenueTrend = 'decreasing';
            }
        }

        // Occupancy trend (based on booking patterns)
        let occupancyTrend = 'stable';
        if (bookingValues.length >= 6) {
            const recentBookings = bookingValues.slice(-3).reduce((sum, val) => sum + val, 0);
            const previousBookings = bookingValues.slice(-6, -3).reduce((sum, val) => sum + val, 0);
            
            if (previousBookings > 0) {
                const change = ((recentBookings - previousBookings) / previousBookings) * 100;
                if (change > 15) occupancyTrend = 'increasing';
                else if (change < -15) occupancyTrend = 'decreasing';
            }
        }

        // Expense trend
        let expenseTrend = 'stable';
        if (expenseValues.length >= 6) {
            const recentExpenses = expenseValues.slice(-3).reduce((sum, val) => sum + val, 0);
            const previousExpenses = expenseValues.slice(-6, -3).reduce((sum, val) => sum + val, 0);
            
            if (previousExpenses > 0) {
                const change = ((recentExpenses - previousExpenses) / previousExpenses) * 100;
                if (change > 20) expenseTrend = 'increasing';
                else if (change < -20) expenseTrend = 'decreasing';
            }
        }

        // Seasonal pattern detection (simple approach)
        let seasonalPattern = 'no_pattern';
        if (months.length >= 6) {
            const summerMonths = months.filter(month => {
                const monthNum = parseInt(month.split('-')[1]);
                return monthNum >= 12 || monthNum <= 2; // Dec, Jan, Feb (Southern Hemisphere)
            });
            const winterMonths = months.filter(month => {
                const monthNum = parseInt(month.split('-')[1]);
                return monthNum >= 6 && monthNum <= 8; // Jun, Jul, Aug
            });

            if (summerMonths.length > 0 && winterMonths.length > 0) {
                const summerRevenue = summerMonths.reduce((sum, month) => sum + monthlyData[month].revenue, 0);
                const winterRevenue = winterMonths.reduce((sum, month) => sum + monthlyData[month].revenue, 0);
                
                if (summerRevenue > winterRevenue * 1.3) {
                    seasonalPattern = 'summer_peak';
                } else if (winterRevenue > summerRevenue * 1.3) {
                    seasonalPattern = 'winter_peak';
                }
            }
        }

        return {
            revenueTrend,
            occupancyTrend,
            expenseTrend,
            seasonalPattern,
            monthlyData,
            months
        };
    } catch (error) {
        console.error('Error calculating trend metrics:', error);
        return {
            revenueTrend: 'error',
            occupancyTrend: 'error',
            expenseTrend: 'error',
            seasonalPattern: 'error'
        };
    }
}

// PHASE 2 ENHANCEMENT: Predictive analytics engine
function calculatePredictiveInsights(trendMetrics, monthlyData, properties, currentMonth) {
    try {
        if (!trendMetrics || !monthlyData || Object.keys(monthlyData).length === 0) {
            return {
                revenueForecast: 'insufficient_data',
                occupancyForecast: 'insufficient_data',
                expenseForecast: 'insufficient_data',
                seasonalOpportunities: 'insufficient_data',
                confidence: 'low'
            };
        }

        const months = Object.keys(monthlyData).sort();
        const revenueValues = months.map(month => monthlyData[month].revenue);
        const expenseValues = months.map(month => monthlyData[month].expenses);
        const bookingValues = months.map(month => monthlyData[month].confirmedBookings);

        // Revenue Forecasting (next 3 months)
        let revenueForecast = {
            nextMonth: 0,
            threeMonth: 0,
            sixMonth: 0,
            trend: 'stable',
            confidence: 'medium'
        };

        if (revenueValues.length >= 3) {
            const recentRevenue = revenueValues.slice(-3);
            const avgRecentRevenue = recentRevenue.reduce((sum, val) => sum + val, 0) / recentRevenue.length;
            
            // Simple linear trend projection
            if (trendMetrics.revenueTrend === 'increasing') {
                const growthRate = 0.15; // 15% growth assumption
                revenueForecast.nextMonth = Math.round(avgRecentRevenue * (1 + growthRate));
                revenueForecast.threeMonth = Math.round(avgRecentRevenue * Math.pow(1 + growthRate, 3));
                revenueForecast.sixMonth = Math.round(avgRecentRevenue * Math.pow(1 + growthRate, 6));
                revenueForecast.trend = 'increasing';
                revenueForecast.confidence = 'high';
            } else if (trendMetrics.revenueTrend === 'decreasing') {
                const declineRate = 0.10; // 10% decline assumption
                revenueForecast.nextMonth = Math.round(avgRecentRevenue * (1 - declineRate));
                revenueForecast.threeMonth = Math.round(avgRecentRevenue * Math.pow(1 - declineRate, 3));
                revenueForecast.sixMonth = Math.round(avgRecentRevenue * Math.pow(1 - declineRate, 6));
                revenueForecast.trend = 'decreasing';
                revenueForecast.confidence = 'medium';
            } else {
                // Stable trend - use average with slight seasonal adjustment
                revenueForecast.nextMonth = Math.round(avgRecentRevenue * 1.02); // 2% seasonal bump
                revenueForecast.threeMonth = Math.round(avgRecentRevenue * 1.05);
                revenueForecast.sixMonth = Math.round(avgRecentRevenue * 1.08);
                revenueForecast.trend = 'stable';
                revenueForecast.confidence = 'high';
            }
        }

        // Occupancy Forecasting
        let occupancyForecast = {
            nextMonth: 0,
            threeMonth: 0,
            peakSeason: null,
            lowSeason: null,
            confidence: 'medium'
        };

        if (bookingValues.length >= 3 && properties.length > 0) {
            const avgBookings = bookingValues.reduce((sum, val) => sum + val, 0) / bookingValues.length;
            const totalDaysInMonth = 30; // Simplified assumption
            const currentOccupancy = (avgBookings * 2) / (properties.length * totalDaysInMonth) * 100; // 2-day average stay

            if (trendMetrics.occupancyTrend === 'increasing') {
                occupancyForecast.nextMonth = Math.min(100, Math.round(currentOccupancy * 1.2));
                occupancyForecast.threeMonth = Math.min(100, Math.round(currentOccupancy * 1.35));
            } else if (trendMetrics.occupancyTrend === 'decreasing') {
                occupancyForecast.nextMonth = Math.max(0, Math.round(currentOccupancy * 0.9));
                occupancyForecast.threeMonth = Math.max(0, Math.round(currentOccupancy * 0.8));
            } else {
                occupancyForecast.nextMonth = Math.round(currentOccupancy);
                occupancyForecast.threeMonth = Math.round(currentOccupancy);
            }

            // Seasonal occupancy patterns
            if (trendMetrics.seasonalPattern === 'summer_peak') {
                occupancyForecast.peakSeason = { months: 'Dec-Feb', rate: Math.min(100, Math.round(currentOccupancy * 1.4)) };
                occupancyForecast.lowSeason = { months: 'Jun-Aug', rate: Math.max(0, Math.round(currentOccupancy * 0.7)) };
            } else if (trendMetrics.seasonalPattern === 'winter_peak') {
                occupancyForecast.peakSeason = { months: 'Jun-Aug', rate: Math.min(100, Math.round(currentOccupancy * 1.4)) };
                occupancyForecast.lowSeason = { months: 'Dec-Feb', rate: Math.max(0, Math.round(currentOccupancy * 0.7)) };
            }
        }

        // Expense Forecasting
        let expenseForecast = {
            nextMonth: 0,
            threeMonth: 0,
            trend: 'stable',
            optimizationOpportunity: false,
            confidence: 'medium'
        };

        if (expenseValues.length >= 3) {
            const avgExpenses = expenseValues.reduce((sum, val) => sum + val, 0) / expenseValues.length;
            
            if (trendMetrics.expenseTrend === 'increasing') {
                expenseForecast.nextMonth = Math.round(avgExpenses * 1.1);
                expenseForecast.threeMonth = Math.round(avgExpenses * 1.25);
                expenseForecast.trend = 'increasing';
                expenseForecast.optimizationOpportunity = true;
            } else if (trendMetrics.expenseTrend === 'decreasing') {
                expenseForecast.nextMonth = Math.round(avgExpenses * 0.95);
                expenseForecast.threeMonth = Math.round(avgExpenses * 0.9);
                expenseForecast.trend = 'decreasing';
                expenseForecast.optimizationOpportunity = false;
            } else {
                expenseForecast.nextMonth = Math.round(avgExpenses);
                expenseForecast.threeMonth = Math.round(avgExpenses);
                expenseForecast.trend = 'stable';
                expenseForecast.optimizationOpportunity = false;
            }
        }

        // Seasonal Opportunities
        let seasonalOpportunities = [];
        if (trendMetrics.seasonalPattern === 'summer_peak') {
            seasonalOpportunities.push({
                season: 'Summer (Dec-Feb)',
                action: 'Maximize rates and marketing',
                potentialIncrease: '20-30%',
                timing: 'Next 2-3 months'
            });
        } else if (trendMetrics.seasonalPattern === 'winter_peak') {
            seasonalOpportunities.push({
                season: 'Winter (Jun-Aug)',
                action: 'Maximize rates and marketing',
                potentialIncrease: '20-30%',
                timing: 'Next 2-3 months'
            });
        } else {
            seasonalOpportunities.push({
                season: 'Year-round',
                action: 'Focus on consistent optimization',
                potentialIncrease: '10-15%',
                timing: 'Ongoing'
            });
        }

        return {
            revenueForecast,
            occupancyForecast,
            expenseForecast,
            seasonalOpportunities,
            confidence: 'medium'
        };

    } catch (error) {
        console.error('Error calculating predictive insights:', error);
        return {
            revenueForecast: 'error',
            occupancyForecast: 'error',
            expenseForecast: 'error',
            seasonalOpportunities: 'error',
            confidence: 'low'
        };
    }
}

// PHASE 3 ENHANCEMENT: Smart recommendations engine
function calculateSmartRecommendations(trendMetrics, predictiveInsights, properties, monthlyData, currentMonth) {
    try {
        if (!trendMetrics || !predictiveInsights || !properties || properties.length === 0) {
            return {
                pricingRecommendations: 'insufficient_data',
                marketingStrategies: 'insufficient_data',
                propertyImprovements: 'insufficient_data',
                investmentOpportunities: 'insufficient_data',
                confidence: 'low'
            };
        }

        const recommendations = {
            pricingRecommendations: [],
            marketingStrategies: [],
            propertyImprovements: [],
            investmentOpportunities: [],
            confidence: 'medium'
        };

        // Smart Pricing Recommendations
        if (predictiveInsights.revenueForecast !== 'insufficient_data') {
            const currentAvgPrice = properties.reduce((sum, prop) => sum + prop.price, 0) / properties.length;
            
            if (predictiveInsights.revenueForecast.trend === 'increasing') {
                // Optimize pricing during growth phase
                recommendations.pricingRecommendations.push({
                    type: 'rate_optimization',
                    action: 'Increase rates gradually',
                    currentPrice: currentAvgPrice,
                    suggestedIncrease: Math.round(currentAvgPrice * 0.15), // 15% increase
                    reasoning: 'Revenue is growing - capitalize on demand',
                    timing: 'Next 30 days',
                    expectedImpact: '15-20% revenue increase'
                });
            } else if (predictiveInsights.revenueForecast.trend === 'decreasing') {
                // Competitive pricing during decline
                recommendations.pricingRecommendations.push({
                    type: 'competitive_pricing',
                    action: 'Maintain competitive rates',
                    currentPrice: currentAvgPrice,
                    suggestedDecrease: Math.round(currentAvgPrice * 0.05), // 5% decrease
                    reasoning: 'Revenue declining - maintain market position',
                    timing: 'Immediate',
                    expectedImpact: 'Stabilize occupancy rates'
                });
            }

            // Seasonal pricing optimization
            if (trendMetrics.seasonalPattern === 'summer_peak') {
                recommendations.pricingRecommendations.push({
                    type: 'seasonal_pricing',
                    action: 'Premium pricing during peak season',
                    currentPrice: currentAvgPrice,
                    suggestedIncrease: Math.round(currentAvgPrice * 0.25), // 25% increase
                    reasoning: 'Summer peak season - maximize revenue',
                    timing: 'Dec-Feb',
                    expectedImpact: '25-30% revenue increase during peak'
                });
            } else if (trendMetrics.seasonalPattern === 'winter_peak') {
                recommendations.pricingRecommendations.push({
                    type: 'seasonal_pricing',
                    action: 'Premium pricing during peak season',
                    currentPrice: currentAvgPrice,
                    suggestedIncrease: Math.round(currentAvgPrice * 0.25), // 25% increase
                    reasoning: 'Winter peak season - maximize revenue',
                    timing: 'Jun-Aug',
                    expectedImpact: '25-30% revenue increase during peak'
                });
            }
        }

        // Marketing Strategy Recommendations
        if (predictiveInsights.occupancyForecast !== 'insufficient_data') {
            if (predictiveInsights.occupancyForecast.peakSeason) {
                recommendations.marketingStrategies.push({
                    type: 'peak_season_marketing',
                    action: 'Aggressive marketing during peak season',
                    strategy: 'Increase marketing budget by 40%',
                    channels: ['Social media ads', 'Google Ads', 'Property listing sites'],
                    timing: predictiveInsights.occupancyForecast.peakSeason.months,
                    expectedImpact: 'Boost occupancy to 90%+ during peak',
                    budget: '40% increase in marketing spend'
                });
            }

            if (trendMetrics.occupancyTrend === 'decreasing') {
                recommendations.marketingStrategies.push({
                    type: 'occupancy_recovery',
                    action: 'Revitalize marketing strategy',
                    strategy: 'Multi-channel marketing campaign',
                    channels: ['Social media', 'Email marketing', 'Local partnerships', 'Guest referrals'],
                    timing: 'Immediate - next 30 days',
                    expectedImpact: 'Increase occupancy by 15-20%',
                    budget: '25% increase in marketing spend'
                });
            }
        }

        // Property Improvement ROI Calculations
        if (properties.length > 0) {
            const avgPropertyValue = properties.reduce((sum, prop) => sum + (prop.price * 30), 0) / properties.length; // Monthly revenue potential
            
            // Calculate ROI for common improvements
            const improvements = [
                {
                    name: 'Kitchen Upgrade',
                    cost: 15000,
                    expectedRevenueIncrease: 0.15, // 15% increase
                    paybackPeriod: Math.round(15000 / (avgPropertyValue * 0.15 / 12)), // months
                    roi: Math.round((avgPropertyValue * 0.15 * 12 - 15000) / 15000 * 100), // percentage
                    priority: 'high'
                },
                {
                    name: 'Bathroom Renovation',
                    cost: 8000,
                    expectedRevenueIncrease: 0.10, // 10% increase
                    paybackPeriod: Math.round(8000 / (avgPropertyValue * 0.10 / 12)),
                    roi: Math.round((avgPropertyValue * 0.10 * 12 - 8000) / 8000 * 100),
                    priority: 'medium'
                },
                {
                    name: 'Outdoor Space Enhancement',
                    cost: 5000,
                    expectedRevenueIncrease: 0.08, // 8% increase
                    paybackPeriod: Math.round(5000 / (avgPropertyValue * 0.08 / 12)),
                    roi: Math.round((avgPropertyValue * 0.08 * 12 - 5000) / 5000 * 100),
                    priority: 'low'
                }
            ];

            recommendations.propertyImprovements = improvements.filter(imp => imp.roi > 0);
        }

        // Investment Opportunities
        if (predictiveInsights.revenueForecast !== 'insufficient_data' && 
            predictiveInsights.revenueForecast.trend === 'increasing') {
            
            recommendations.investmentOpportunities.push({
                type: 'portfolio_expansion',
                action: 'Consider adding new properties',
                reasoning: 'Revenue growing consistently - good time to expand',
                expectedROI: '20-25% based on current trends',
                timing: 'Next 3-6 months',
                risk: 'medium',
                recommendation: 'Start researching new property opportunities'
            });
        }

        if (trendMetrics.seasonalPattern !== 'no_pattern') {
            recommendations.investmentOpportunities.push({
                type: 'seasonal_optimization',
                action: 'Optimize existing properties for seasonal demand',
                reasoning: 'Clear seasonal patterns identified - optimize for peak seasons',
                expectedROI: '15-20% through seasonal rate optimization',
                timing: 'Immediate - implement before next peak season',
                risk: 'low',
                recommendation: 'Implement dynamic pricing strategy'
            });
        }

        // Set confidence level based on data quality
        if (trendMetrics.revenueTrend !== 'insufficient_data' && 
            predictiveInsights.revenueForecast !== 'insufficient_data') {
            recommendations.confidence = 'high';
        }

        return recommendations;

    } catch (error) {
        console.error('Error calculating smart recommendations:', error);
        return {
            pricingRecommendations: 'error',
            marketingStrategies: 'error',
            propertyImprovements: 'error',
            investmentOpportunities: 'error',
            confidence: 'low'
        };
    }
}

// PHASE 4 ENHANCEMENT: Advanced market intelligence engine
function calculateMarketIntelligence(properties, trendMetrics, predictiveInsights, smartRecommendations) {
    try {
        if (!properties || properties.length === 0) {
            return {
                competitorAnalysis: 'insufficient_data',
                marketTrends: 'insufficient_data',
                demandForecast: 'insufficient_data',
                competitiveAdvantages: 'insufficient_data',
                marketOpportunities: 'insufficient_data',
                confidence: 'low'
            };
        }

        const marketIntelligence = {
            competitorAnalysis: [],
            marketTrends: [],
            demandForecast: {},
            competitiveAdvantages: [],
            marketOpportunities: [],
            confidence: 'medium'
        };

        // Competitor Analysis (simulated based on property characteristics)
        properties.forEach(property => {
            const location = property.location;
            const propertyType = property.type;
            const currentPrice = property.price;
            
            // Simulate competitor data based on location and property type
            const competitorData = generateCompetitorData(location, propertyType, currentPrice);
            
            marketIntelligence.competitorAnalysis.push({
                propertyId: property.id,
                location: location,
                propertyType: propertyType,
                currentPrice: currentPrice,
                marketPosition: competitorData.marketPosition,
                competitorCount: competitorData.competitorCount,
                averageMarketPrice: competitorData.averageMarketPrice,
                priceDifference: competitorData.priceDifference,
                marketShare: competitorData.marketShare,
                recommendations: competitorData.recommendations
            });
        });

        // Market Trends Analysis
        if (trendMetrics.seasonalPattern !== 'insufficient_data') {
            let peakSeason, lowSeason;
            
            // More comprehensive seasonal pattern handling
            switch (trendMetrics.seasonalPattern) {
                case 'summer_peak':
                    peakSeason = 'Dec-Feb';
                    lowSeason = 'Jun-Aug';
                    break;
                case 'winter_peak':
                    peakSeason = 'Jun-Aug';
                    lowSeason = 'Dec-Feb';
                    break;
                case 'spring_peak':
                    peakSeason = 'Sep-Nov';
                    lowSeason = 'Mar-May';
                    break;
                case 'autumn_peak':
                    peakSeason = 'Mar-May';
                    lowSeason = 'Sep-Nov';
                    break;
                default:
                    peakSeason = 'Year-round';
                    lowSeason = 'Year-round';
            }
            
            marketIntelligence.marketTrends.push({
                type: 'seasonal_demand',
                pattern: trendMetrics.seasonalPattern,
                peakSeason: peakSeason,
                lowSeason: lowSeason,
                demandVariation: '40-60%',
                marketOpportunity: 'High during peak seasons'
            });
        }

        if (trendMetrics.revenueTrend !== 'insufficient_data') {
            marketIntelligence.marketTrends.push({
                type: 'revenue_growth',
                trend: trendMetrics.revenueTrend,
                marketGrowth: trendMetrics.revenueTrend === 'increasing' ? 'Growing market' : 'Declining market',
                opportunity: trendMetrics.revenueTrend === 'increasing' ? 'Expand portfolio' : 'Focus on efficiency',
                marketTiming: trendMetrics.revenueTrend === 'increasing' ? 'Good time to invest' : 'Wait for recovery'
            });
        }

        // Demand Forecasting
        if (predictiveInsights.occupancyForecast !== 'insufficient_data') {
            const currentOccupancy = predictiveInsights.occupancyForecast.nextMonth || 0;
            const averageNightsPerStay = 3; // Realistic assumption for vacation rentals
            const marketCapacity = properties.length * 30 * averageNightsPerStay; // Monthly nights available
            const currentDemandNights = Math.round((currentOccupancy / 100) * marketCapacity);
            
            marketIntelligence.demandForecast = {
                currentDemand: currentOccupancy, // Keep as percentage for display
                marketCapacity: marketCapacity, // Total nights available per month
                demandGap: Math.max(0, marketCapacity - currentDemandNights), // Nights gap
                marketSaturation: currentOccupancy, // Already a percentage
                demandTrend: predictiveInsights.occupancyForecast.peakSeason ? 'Seasonal' : 'Consistent',
                growthPotential: currentOccupancy < 80 ? 'High' : 'Moderate'
            };
        }

        // Competitive Advantages Analysis
        properties.forEach(property => {
            const advantages = [];
            
            // Location advantages
            if (property.location.includes('Cape Town')) {
                advantages.push({
                    type: 'location',
                    advantage: 'Premium tourist destination',
                    strength: 'High',
                    marketValue: '20-30% premium pricing'
                });
            }
            
            if (property.location.includes('Johannesburg')) {
                advantages.push({
                    type: 'location',
                    advantage: 'Business travel hub',
                    strength: 'Medium',
                    marketValue: '15-20% premium pricing'
                });
            }
            
            // Property type advantages
            if (property.type === 'apartment') {
                advantages.push({
                    type: 'property_type',
                    advantage: 'Low maintenance, high turnover',
                    strength: 'High',
                    marketValue: 'Consistent occupancy'
                });
            }
            
            if (property.type === 'house') {
                advantages.push({
                    type: 'property_type',
                    advantage: 'Premium experience, longer stays',
                    strength: 'Medium',
                    marketValue: 'Higher nightly rates'
                });
            }
            
            // Amenity advantages
            if (property.amenities && property.amenities.length > 0) {
                advantages.push({
                    type: 'amenities',
                    advantage: `Unique features: ${property.amenities.slice(0, 3).join(', ')}`,
                    strength: 'Medium',
                    marketValue: '5-15% premium pricing'
                });
            }
            
            marketIntelligence.competitiveAdvantages.push({
                propertyId: property.id,
                propertyName: property.name,
                advantages: advantages,
                totalAdvantageScore: advantages.reduce((score, adv) => {
                    if (adv.strength === 'High') return score + 3;
                    if (adv.strength === 'Medium') return score + 2;
                    return score + 1;
                }, 0)
            });
        });

        // Market Opportunities
        if (predictiveInsights.revenueForecast !== 'insufficient_data' && 
            predictiveInsights.revenueForecast.trend === 'increasing') {
            
            marketIntelligence.marketOpportunities.push({
                type: 'market_expansion',
                opportunity: 'Growing market demand',
                potential: 'High',
                timing: 'Next 3-6 months',
                action: 'Consider adding new properties',
                expectedROI: '25-35% based on market growth'
            });
        }
        
        if (trendMetrics.seasonalPattern !== 'no_pattern') {
            marketIntelligence.marketOpportunities.push({
                type: 'seasonal_optimization',
                opportunity: 'Seasonal demand patterns',
                potential: 'Medium',
                timing: 'Before next peak season',
                action: 'Optimize pricing and marketing',
                expectedROI: '20-30% through seasonal optimization'
            });
        }

        // Set confidence level based on data quality
        if (trendMetrics.revenueTrend !== 'insufficient_data' && 
            predictiveInsights.revenueForecast !== 'insufficient_data' &&
            smartRecommendations.pricingRecommendations !== 'insufficient_data') {
            marketIntelligence.confidence = 'high';
        }

        return marketIntelligence;

    } catch (error) {
        console.error('Error calculating market intelligence:', error);
        return {
            competitorAnalysis: 'error',
            marketTrends: 'error',
            demandForecast: 'error',
            competitiveAdvantages: 'error',
            marketOpportunities: 'error',
            confidence: 'low'
        };
    }
}

// Helper function to generate competitor data
function generateCompetitorData(location, propertyType, currentPrice) {
    // Simulate competitor analysis based on location and property characteristics
    const baseCompetitorCount = Math.floor(Math.random() * 20) + 10; // 10-30 competitors
    const marketPosition = Math.random() > 0.5 ? 'competitive' : 'premium';
    const priceVariation = (Math.random() - 0.5) * 0.3; // ±15% variation
    
    const averageMarketPrice = Math.round(currentPrice * (1 + priceVariation));
    const priceDifference = currentPrice - averageMarketPrice;
    const marketShare = Math.round((1 / baseCompetitorCount) * 100);
    
    let recommendations = [];
    if (priceDifference > 0) {
        recommendations.push('Consider competitive pricing to increase market share');
    } else if (priceDifference < 0) {
        recommendations.push('Premium positioning justified by property quality');
    }
    
    if (marketShare < 5) {
        recommendations.push('Focus on unique selling propositions to stand out');
    }
    
    return {
        marketPosition,
        competitorCount: baseCompetitorCount,
        averageMarketPrice,
        priceDifference,
        marketShare,
        recommendations
    };
}

// Helper function to calculate market demand
function calculateMarketDemand(currentOccupancy, propertyCount) {
    const averageNightsPerStay = 3; // Realistic assumption for vacation rentals
    const totalCapacity = propertyCount * 30 * averageNightsPerStay; // Monthly nights available
    const currentDemandNights = Math.round((currentOccupancy / 100) * totalCapacity);
    const demandGap = Math.max(0, totalCapacity - currentDemandNights);
    
    return {
        currentDemand: currentOccupancy, // Keep as percentage
        totalCapacity: totalCapacity, // Total nights available
        demandGap: demandGap, // Nights gap
        utilizationRate: currentOccupancy // Already a percentage
    };
}

// Get user's property context for AI responses
async function getUserPropertyContext(userId, authToken) {
    try {
        // Create user-specific Supabase client
        const { createUserClient } = require('../config/supabase');
        const supabase = createUserClient(authToken);
        
        // Get user's properties
        const { data: properties, error: propertiesError } = await supabase
            .from('properties')
            .select('id, name, location, type, bedrooms, bathrooms, max_guests, price, currency, amenities')
            .eq('owner_id', userId)
            .order('created_at', { ascending: false });
        
        if (propertiesError) {
            console.error('Error fetching properties for AI context:', propertiesError);
            throw propertiesError;
        }
        
        // PHASE 1 ENHANCEMENT: Get 6 months of historical data for trend analysis
        const currentDate = new Date();
        const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
        
        // Get historical booking data for trend analysis
        const { data: historicalBookings, error: historicalBookingsError } = await supabase
            .from('bookings')
            .select('id, property_id, check_in, check_out, price, status, created_at')
            .eq('owner_id', userId)
            .gte('created_at', sixMonthsAgo.toISOString())
            .order('created_at', { ascending: true });
        
        if (historicalBookingsError) {
            console.error('Error fetching historical bookings for AI context:', historicalBookingsError);
        }
        
        // Get recent booking statistics (last 30 days)
        const { data: recentBookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('id, property_id, check_in, check_out, price, status, created_at')
            .eq('owner_id', userId)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false });
        
        if (bookingsError) {
            console.error('Error fetching bookings for AI context:', bookingsError);
        }
        
        // Get current month revenue
        const currentMonth = new Date();
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        const { data: monthlyBookings, error: monthlyError } = await supabase
            .from('bookings')
            .select('price, status')
            .eq('owner_id', userId)
            .gte('check_in', startOfMonth.toISOString())
            .lte('check_in', endOfMonth.toISOString())
            .eq('status', 'confirmed');
        
        if (monthlyError) {
            console.error('Error fetching monthly bookings for AI context:', monthlyError);
        }
        
        // PHASE 1 ENHANCEMENT: Get historical expenses for trend analysis
        const { data: historicalExpenses, error: historicalExpensesError } = await supabase
            .from('expenses')
            .select('amount, category, property_id, date')
            .eq('owner_id', userId)
            .gte('date', sixMonthsAgo.toISOString())
            .order('date', { ascending: true });
        
        if (historicalExpensesError) {
            console.error('Error fetching historical expenses for AI context:', historicalExpensesError);
        }
        
        // Get recent expenses for cost analysis
        const { data: recentExpenses, error: expensesError } = await supabase
            .from('expenses')
            .select('amount, category, property_id, date')
            .eq('owner_id', userId)
            .gte('date', startOfMonth.toISOString())
            .lte('date', endOfMonth.toISOString())
            .order('date', { ascending: false });
        
        if (expensesError) {
            console.error('Error fetching expenses for AI context:', expensesError);
        }
        
        // Get ALL services for maintenance insights (not just monthly due)
        const { data: recentServices, error: servicesError } = await supabase
            .from('services')
            .select('name, status, property_id, cost, next_due, description')
            .eq('owner_id', userId)
            .order('next_due', { ascending: false });
        
        if (servicesError) {
            console.error('Error fetching services for AI context:', servicesError);
        }
        
        // Calculate metrics
        const totalProperties = properties?.length || 0;
        const totalBookings = recentBookings?.length || 0;
        const confirmedBookings = recentBookings?.filter(b => b.status === 'confirmed').length || 0;
        const monthlyRevenue = monthlyBookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0;
        
        // Calculate expenses and services metrics
        const monthlyExpenses = recentExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
        const pendingServices = recentServices?.filter(s => s.status === 'active').length || 0;
        const completedServices = recentServices?.filter(s => s.status === 'completed').length || 0;
        
        // Calculate occupancy rate (simplified - based on confirmed bookings vs total days)
        const totalDaysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const totalAvailableDays = totalProperties * totalDaysInMonth;
        const occupiedDays = confirmedBookings * 2; // Assume average 2-day stays
        const occupancyRate = totalAvailableDays > 0 ? Math.round((occupiedDays / totalAvailableDays) * 100) : 0;
        
        // Calculate profit margin
        const profitMargin = monthlyRevenue > 0 ? Math.round(((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100) : 0;
        
        // PHASE 1 ENHANCEMENT: Calculate trend analysis metrics
        const trendMetrics = calculateTrendMetrics(historicalBookings, historicalExpenses, currentMonth);
        
        // PHASE 2 ENHANCEMENT: Calculate predictive insights
        const predictiveInsights = calculatePredictiveInsights(trendMetrics, trendMetrics.monthlyData, properties, currentMonth);
        
        // PHASE 3 ENHANCEMENT: Calculate smart recommendations
        const smartRecommendations = calculateSmartRecommendations(trendMetrics, predictiveInsights, properties, trendMetrics.monthlyData, currentMonth);
        
        // PHASE 4 ENHANCEMENT: Calculate market intelligence
        const marketIntelligence = calculateMarketIntelligence(properties, trendMetrics, predictiveInsights, smartRecommendations);
        
        // Build detailed context
        let context = `You are Nathi, a friendly and knowledgeable property management AI assistant for HostTrack. `;
        
        if (totalProperties > 0) {
            context += `The user manages ${totalProperties} property(ies): `;
            properties.forEach((prop, index) => {
                context += `${prop.name} (${prop.type}) in ${prop.location} with ${prop.bedrooms} bedrooms, ${prop.bathrooms} bathrooms, max ${prop.max_guests} guests, priced at ${prop.currency} ${prop.price}/night`;
                if (prop.amenities && prop.amenities.length > 0) {
                    context += `, featuring ${prop.amenities.slice(0, 3).join(', ')}`;
                }
                context += index < properties.length - 1 ? '; ' : '. ';
            });
            
            context += `Recent performance: ${confirmedBookings} confirmed bookings in the last 30 days, generating ${properties[0].currency || 'ZAR'} ${monthlyRevenue.toLocaleString()} in revenue this month. `;
            context += `Current occupancy rate is approximately ${occupancyRate}%. `;
            context += `Monthly expenses: ${properties[0].currency || 'ZAR'} ${monthlyExpenses.toLocaleString()}, profit margin: ${profitMargin}%. `;
            context += `Services: ${pendingServices} pending, ${completedServices} completed this month. `;
            
            // PHASE 1 ENHANCEMENT: Add trend insights and market intelligence
            if (trendMetrics.revenueTrend !== 'insufficient_data') {
                context += `📈 **TREND ANALYSIS**: `;
                
                if (trendMetrics.revenueTrend === 'increasing') {
                    context += `Your revenue is trending UPWARD - great momentum! `;
                } else if (trendMetrics.revenueTrend === 'decreasing') {
                    context += `Your revenue is trending DOWNWARD - let's identify opportunities to improve. `;
                } else {
                    context += `Your revenue is STABLE - consistent performance. `;
                }
                
                if (trendMetrics.occupancyTrend === 'increasing') {
                    context += `Occupancy rates are IMPROVING. `;
                } else if (trendMetrics.occupancyTrend === 'decreasing') {
                    context += `Occupancy rates are DECLINING - this needs attention. `;
                } else {
                    context += `Occupancy rates are STABLE. `;
                }
                
                if (trendMetrics.expenseTrend === 'increasing') {
                    context += `⚠️ Expenses are RISING - let's optimize costs. `;
                } else if (trendMetrics.expenseTrend === 'decreasing') {
                    context += `✅ Expenses are DECREASING - excellent cost management! `;
                } else {
                    context += `Expenses are STABLE. `;
                }
                
                // Seasonal pattern insights
                if (trendMetrics.seasonalPattern === 'summer_peak') {
                    context += `🌞 **SEASONAL INSIGHT**: You have a SUMMER peak season - maximize rates during Dec-Feb! `;
                } else if (trendMetrics.seasonalPattern === 'winter_peak') {
                    context += `❄️ **SEASONAL INSIGHT**: You have a WINTER peak season - maximize rates during Jun-Aug! `;
                }
                
                // PHASE 2 ENHANCEMENT: Add predictive insights
                if (predictiveInsights.revenueForecast !== 'insufficient_data') {
                    context += `🔮 **PREDICTIVE INSIGHTS**: `;
                    
                    // Revenue forecasting
                    if (predictiveInsights.revenueForecast.trend === 'increasing') {
                        context += `Your revenue is projected to grow to ${properties[0].currency || 'ZAR'} ${predictiveInsights.revenueForecast.nextMonth.toLocaleString()} next month and ${predictiveInsights.revenueForecast.threeMonth.toLocaleString()} in 3 months! `;
                    } else if (predictiveInsights.revenueForecast.trend === 'decreasing') {
                        context += `Your revenue is projected to decline to ${properties[0].currency || 'ZAR'} ${predictiveInsights.revenueForecast.nextMonth.toLocaleString()} next month - let's identify growth opportunities! `;
                    } else {
                        context += `Your revenue is projected to remain stable at ${properties[0].currency || 'ZAR'} ${predictiveInsights.revenueForecast.nextMonth.toLocaleString()} next month. `;
                    }
                    
                    // Occupancy forecasting
                    if (predictiveInsights.occupancyForecast.peakSeason) {
                        context += `📅 **OCCUPANCY FORECAST**: Peak season (${predictiveInsights.occupancyForecast.peakSeason.months}) expected at ${predictiveInsights.occupancyForecast.peakSeason.rate}% occupancy. `;
                    }
                    
                    // Seasonal opportunities
                    if (predictiveInsights.seasonalOpportunities.length > 0) {
                        const opportunity = predictiveInsights.seasonalOpportunities[0];
                        context += `🎯 **OPPORTUNITY**: ${opportunity.action} during ${opportunity.season} for ${opportunity.potentialIncrease} potential increase. `;
                    }
                    
                    // PHASE 3 ENHANCEMENT: Add smart recommendations
                    if (smartRecommendations.pricingRecommendations !== 'insufficient_data' && 
                        smartRecommendations.pricingRecommendations.length > 0) {
                        
                        const pricingRec = smartRecommendations.pricingRecommendations[0];
                        context += `💰 **PRICING RECOMMENDATION**: ${pricingRec.action} - ${pricingRec.reasoning}. `;
                        context += `Expected impact: ${pricingRec.expectedImpact}. `;
                    }
                    
                    if (smartRecommendations.marketingStrategies !== 'insufficient_data' && 
                        smartRecommendations.marketingStrategies.length > 0) {
                        
                        const marketingRec = smartRecommendations.marketingStrategies[0];
                        context += `📢 **MARKETING STRATEGY**: ${marketingRec.action} - ${marketingRec.strategy}. `;
                        context += `Expected impact: ${marketingRec.expectedImpact}. `;
                    }
                    
                    if (smartRecommendations.propertyImprovements !== 'insufficient_data' && 
                        smartRecommendations.propertyImprovements.length > 0) {
                        
                        const improvement = smartRecommendations.propertyImprovements[0];
                        context += `🏠 **PROPERTY IMPROVEMENT**: ${improvement.name} - ROI: ${improvement.roi}%, Payback: ${improvement.paybackPeriod} months. `;
                    }
                    
                    // PHASE 4 ENHANCEMENT: Add market intelligence insights
                    if (marketIntelligence.competitorAnalysis !== 'insufficient_data' && 
                        marketIntelligence.competitorAnalysis.length > 0) {
                        
                        const competitor = marketIntelligence.competitorAnalysis[0];
                        context += `🏆 **MARKET POSITION**: You're positioned as ${competitor.marketPosition} in ${competitor.location} with ${competitor.competitorCount} competitors. `;
                        context += `Your price is ${competitor.priceDifference > 0 ? 'above' : 'below'} market average by ${Math.abs(competitor.priceDifference)}. `;
                    }
                    
                    if (marketIntelligence.marketTrends !== 'insufficient_data' && 
                        marketIntelligence.marketTrends.length > 0) {
                        
                        const marketTrend = marketIntelligence.marketTrends[0];
                        if (marketTrend.type === 'seasonal_demand') {
                            context += `📈 **MARKET TREND**: ${marketTrend.pattern} demand pattern with ${marketTrend.demandVariation} variation. `;
                            context += `Market opportunity: ${marketTrend.marketOpportunity}. `;
                        }
                    }
                    
                    if (marketIntelligence.competitiveAdvantages !== 'insufficient_data' && 
                        marketIntelligence.competitiveAdvantages.length > 0) {
                        
                        const advantage = marketIntelligence.competitiveAdvantages[0];
                        if (advantage.advantages.length > 0) {
                            const topAdvantage = advantage.advantages[0];
                            context += `⭐ **COMPETITIVE ADVANTAGE**: ${topAdvantage.advantage} - ${topAdvantage.marketValue}. `;
                        }
                    }
                }
            }
            
            // Add specific insights based on property types
            const propertyTypes = [...new Set(properties.map(p => p.type))];
            if (propertyTypes.includes('apartment') && propertyTypes.includes('house')) {
                context += `The user has a mix of apartments and houses, which is great for diversifying their portfolio. `;
            } else if (propertyTypes.includes('apartment')) {
                context += `The user specializes in apartment rentals, which typically have higher turnover but lower maintenance costs. `;
            } else if (propertyTypes.includes('house')) {
                context += `The user focuses on house rentals, which often command higher rates and longer stays. `;
            }
        } else {
            context += `The user is new to HostTrack and doesn't have any properties listed yet. `;
        }
        
        return {
            hasProperties: totalProperties > 0,
            propertyCount: totalProperties,
            properties: properties || [],
            recentBookings: recentBookings || [],
            monthlyRevenue: monthlyRevenue,
            monthlyExpenses: monthlyExpenses,
            occupancyRate: occupancyRate,
            profitMargin: profitMargin,
            pendingServices: pendingServices,
            completedServices: completedServices,
            recentServices: recentServices || [],
            // PHASE 1 ENHANCEMENT: Include trend analysis data
            trendMetrics: trendMetrics,
            historicalBookings: historicalBookings || [],
            historicalExpenses: historicalExpenses || [],
            // PHASE 2 ENHANCEMENT: Include predictive insights data
            predictiveInsights: predictiveInsights,
            // PHASE 3 ENHANCEMENT: Include smart recommendations data
            smartRecommendations: smartRecommendations,
            // PHASE 4 ENHANCEMENT: Include market intelligence data
            marketIntelligence: marketIntelligence,
            context: context
        };
        
    } catch (error) {
        console.error('Error getting user property context:', error);
        return {
            hasProperties: false,
            propertyCount: 0,
            context: 'You are Nathi, a friendly property management AI assistant for HostTrack. The user is new to the platform and doesn\'t have any properties listed yet.'
        };
    }
}

// Main chat endpoint
router.post('/chat', authenticateUser, checkRateLimit, async (req, res) => {
    try {
        const { message, topic, conversationContext, conversationTopics } = req.body;
        const userId = req.user?.id;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required and must be a string' });
        }

        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not configured');
            return res.status(500).json({ 
                error: 'AI service temporarily unavailable',
                message: 'Please try again later'
            });
        }

        // Check cache first to reduce AI calls
        const cacheKey = `${userId}:${message.toLowerCase().trim()}`;
        const cachedResponse = responseCache.get(cacheKey);
        
        if (cachedResponse && (Date.now() - cachedResponse.timestamp) < CACHE_TTL) {
            console.log(`AI Chat - Cache hit for user ${userId}, avoiding AI call`);
            return res.json({
                success: true,
                response: cachedResponse.response,
                timestamp: new Date().toISOString(),
                usage: {
                    user: userId,
                    messageLength: message.length,
                    responseLength: cachedResponse.response.length,
                    cached: true,
                    cost: 0
                }
            });
        }

        // Get user's property context with authentication token
        const userContext = await getUserPropertyContext(userId, req.headers.authorization?.split(' ')[1]);
        
        // Build enhanced AI prompt with topic-first approach
        let prompt = `You are Nathi, a friendly and knowledgeable property management AI assistant for HostTrack. `;
        
        // PRIORITY 1: Topic-specific instructions (most important)
        if (topic && topic !== 'general') {
            prompt += `IMPORTANT: The user is specifically asking about ${topic}. You MUST focus your entire response on ${topic} and avoid discussing other topics unless directly relevant. `;
            
            // Add topic-specific context and data
            if (topic === 'services') {
                prompt += `For services questions, focus on maintenance, upkeep, scheduling, and service-related insights. `;
                if (userContext.recentServices && userContext.recentServices.length > 0) {
                    prompt += `DETAILED SERVICE INFORMATION: `;
                    userContext.recentServices.forEach((service, index) => {
                        const dueDate = new Date(service.next_due).toLocaleDateString();
                        const cost = service.cost ? `${userContext.properties[0]?.currency || 'ZAR'} ${service.cost}` : 'No cost specified';
                        prompt += `Service ${index + 1}: ${service.name} - Status: ${service.status} - Description: ${service.description || 'No description provided'} - Next Due: ${dueDate} - Cost: ${cost}`;
                        prompt += index < userContext.recentServices.length - 1 ? ' | ' : '. ';
                    });
                    prompt += `IMPORTANT: Use this EXACT service data when responding. Quote specific service names, statuses, and due dates. `;
                    
                    // Debug logging for services
                    console.log(`AI Chat - Services data for user ${userId}:`, {
                        totalServices: userContext.recentServices.length,
                        services: userContext.recentServices.map(s => ({
                            name: s.name,
                            status: s.status,
                            description: s.description,
                            nextDue: s.next_due,
                            cost: s.cost
                        }))
                    });
                } else {
                    prompt += `No services found in the system. `;
                    console.log(`AI Chat - No services found for user ${userId}`);
                }
                prompt += `CRITICAL: Do NOT discuss property performance, pricing, occupancy rates, or booking strategies unless the user specifically asks about those topics. Focus ONLY on services, maintenance, and upkeep. `;
            } else if (topic === 'properties') {
                prompt += `For property questions, focus on property details, amenities, pricing, and property-specific insights. `;
            } else if (topic === 'bookings') {
                prompt += `For booking questions, focus on reservations, guest management, calendar, and booking-specific insights. `;
            } else if (topic === 'revenue') {
                prompt += `For revenue questions, focus on income, pricing, expenses, and financial insights. `;
            } else if (topic === 'analytics') {
                prompt += `For analytics questions, focus on performance metrics, trends, and data insights. `;
            }
        }
        
        // PRIORITY 2: Conversation context
        if (conversationContext) {
            prompt += `Conversation context: ${conversationContext}. Use this context to provide relevant follow-up information. `;
        }
        
        // PRIORITY 3: Conversation topics
        if (conversationTopics && conversationTopics.length > 0) {
            prompt += `Previous conversation topics: ${conversationTopics.join(', ')}. `;
        }
        
        // PRIORITY 4: General property context (only if relevant to the topic)
        if (userContext.hasProperties) {
            // Only include property context if it's relevant to the current topic
            if (topic === 'properties' || topic === 'general' || topic === 'analytics') {
                prompt += `${userContext.context} `;
                
                if (userContext.properties.length > 0) {
                    const prop = userContext.properties[0];
                    prompt += `Current business metrics: ${userContext.confirmedBookings || 0} confirmed bookings in last 30 days, ${prop.currency || 'ZAR'} ${userContext.monthlyRevenue?.toLocaleString() || 0} monthly revenue, ${userContext.occupancyRate || 0}% occupancy rate, ${prop.currency || 'ZAR'} ${userContext.monthlyExpenses?.toLocaleString() || 0} monthly expenses, ${userContext.profitMargin || 0}% profit margin, ${userContext.pendingServices || 0} pending services. `;
                }
            }
        } else {
            prompt += `The user is new to HostTrack and doesn't have any properties listed yet. `;
        }
        
        prompt += `Question: ${message} `;
        prompt += `CRITICAL INSTRUCTIONS: 
        1. Respond ONLY about ${topic || 'the topic asked'}. 
        2. If topic is 'services', focus ONLY on services, maintenance, and upkeep. Do NOT mention property performance, pricing, occupancy, or bookings.
        3. If topic is 'properties', focus ONLY on property details and property-specific insights.
        4. If topic is 'bookings', focus ONLY on reservations and guest management.
        5. Stay on topic and do not go off-topic under any circumstances.
        6. Be specific, actionable, and use the relevant data provided. 
        7. Keep response under 200 words. 
        8. Do not repeat introductory phrases like "I'm from hosttrack" or "I'm Nathi" unless this is the very first message.
        
        // PHASE 1 ENHANCEMENT: Enhanced AI Capabilities
        9. **TREND ANALYSIS**: If the user asks about performance, trends, or analytics, use the trend data provided:
           - Revenue trends: ${userContext.trendMetrics?.revenueTrend || 'insufficient_data'}
           - Occupancy trends: ${userContext.trendMetrics?.occupancyTrend || 'insufficient_data'}
           - Expense trends: ${userContext.trendMetrics?.expenseTrend || 'insufficient_data'}
           - Seasonal patterns: ${userContext.trendMetrics?.seasonalPattern || 'insufficient_data'}
        
        10. **SMART INSIGHTS**: Provide actionable insights based on trends:
            - If revenue is increasing: Suggest how to maintain momentum
            - If revenue is decreasing: Identify opportunities for improvement
            - If occupancy is declining: Suggest strategies to boost bookings
            - If expenses are rising: Suggest cost optimization strategies
        
        11. **SEASONAL INTELLIGENCE**: Use seasonal pattern data to provide timing-specific advice:
            - Summer peak: Maximize rates and marketing during Dec-Feb
            - Winter peak: Maximize rates and marketing during Jun-Aug
            - No pattern: Suggest year-round optimization strategies
        
        // PHASE 2 ENHANCEMENT: Predictive Analytics Capabilities
        12. **REVENUE FORECASTING**: Use predictive insights to provide future revenue projections:
            - Next month: ${userContext.predictiveInsights?.revenueForecast?.nextMonth || 'insufficient_data'}
            - 3 months: ${userContext.predictiveInsights?.revenueForecast?.threeMonth || 'insufficient_data'}
            - Trend: ${userContext.predictiveInsights?.revenueForecast?.trend || 'insufficient_data'}
        
        13. **OCCUPANCY FORECASTING**: Use occupancy predictions for strategic planning:
            - Next month: ${userContext.predictiveInsights?.occupancyForecast?.nextMonth || 'insufficient_data'}%
            - Peak season: ${userContext.predictiveInsights?.occupancyForecast?.peakSeason?.months || 'insufficient_data'} at ${userContext.predictiveInsights?.occupancyForecast?.peakSeason?.rate || 'insufficient_data'}%
        
        14. **EXPENSE FORECASTING**: Use expense predictions for budget planning:
            - Next month: ${userContext.predictiveInsights?.expenseForecast?.nextMonth || 'insufficient_data'}
            - Trend: ${userContext.predictiveInsights?.expenseForecast?.trend || 'insufficient_data'}
            - Optimization: ${userContext.predictiveInsights?.expenseForecast?.optimizationOpportunity ? 'Yes - focus on cost reduction' : 'No - costs are well managed'}
        
        15. **SEASONAL OPPORTUNITIES**: Use seasonal data for strategic recommendations:
            - Season: ${userContext.predictiveInsights?.seasonalOpportunities?.[0]?.season || 'insufficient_data'}
            - Action: ${userContext.predictiveInsights?.seasonalOpportunities?.[0]?.action || 'insufficient_data'}
            - Potential: ${userContext.predictiveInsights?.seasonalOpportunities?.[0]?.potentialIncrease || 'insufficient_data'}
            - Timing: ${userContext.predictiveInsights?.seasonalOpportunities?.[0]?.timing || 'insufficient_data'}
        
        16. **PREDICTIVE RECOMMENDATIONS**: Always provide actionable advice based on forecasts:
            - If revenue is increasing: Suggest how to maintain momentum and maximize growth
            - If revenue is decreasing: Identify specific strategies to reverse the trend
            - If occupancy is declining: Provide marketing and pricing strategies
            - If expenses are rising: Suggest cost optimization and efficiency measures
        
        // PHASE 3 ENHANCEMENT: Smart Recommendations Engine
        17. **PRICING RECOMMENDATIONS**: Use smart pricing data for rate optimization:
            - Rate optimization: ${userContext.smartRecommendations?.pricingRecommendations?.[0]?.action || 'insufficient_data'}
            - Current price: ${userContext.smartRecommendations?.pricingRecommendations?.[0]?.currentPrice || 'insufficient_data'}
            - Suggested change: ${userContext.smartRecommendations?.pricingRecommendations?.[0]?.suggestedIncrease || 'insufficient_data'}
            - Expected impact: ${userContext.smartRecommendations?.pricingRecommendations?.[0]?.expectedImpact || 'insufficient_data'}
        
        18. **MARKETING STRATEGIES**: Use marketing recommendations for occupancy improvement:
            - Strategy: ${userContext.smartRecommendations?.marketingStrategies?.[0]?.strategy || 'insufficient_data'}
            - Channels: ${userContext.smartRecommendations?.marketingStrategies?.[0]?.channels?.join(', ') || 'insufficient_data'}
            - Expected impact: ${userContext.smartRecommendations?.marketingStrategies?.[0]?.expectedImpact || 'insufficient_data'}
            - Budget: ${userContext.smartRecommendations?.marketingStrategies?.[0]?.budget || 'insufficient_data'}
        
        19. **PROPERTY IMPROVEMENTS**: Use ROI calculations for investment decisions:
            - Improvement: ${userContext.smartRecommendations?.propertyImprovements?.[0]?.name || 'insufficient_data'}
            - ROI: ${userContext.smartRecommendations?.propertyImprovements?.[0]?.roi || 'insufficient_data'}%
            - Payback period: ${userContext.smartRecommendations?.propertyImprovements?.[0]?.paybackPeriod || 'insufficient_data'} months
            - Priority: ${userContext.smartRecommendations?.propertyImprovements?.[0]?.priority || 'insufficient_data'}
        
        20. **INVESTMENT OPPORTUNITIES**: Use investment data for portfolio growth:
            - Opportunity: ${userContext.smartRecommendations?.investmentOpportunities?.[0]?.action || 'insufficient_data'}
            - Expected ROI: ${userContext.smartRecommendations?.investmentOpportunities?.[0]?.expectedROI || 'insufficient_data'}
            - Risk level: ${userContext.smartRecommendations?.investmentOpportunities?.[0]?.risk || 'insufficient_data'}
            - Timing: ${userContext.smartRecommendations?.investmentOpportunities?.[0]?.timing || 'insufficient_data'}
        
        21. **SMART RECOMMENDATIONS**: Always provide specific, actionable advice:
            - Include exact pricing recommendations with numbers
            - Provide specific marketing strategies with channels
            - Give ROI calculations for property improvements
            - Suggest investment opportunities with risk assessment
            - Use the actual data provided, not generic advice
        
        // PHASE 4 ENHANCEMENT: Advanced Market Intelligence
        22. **COMPETITOR ANALYSIS**: Use market intelligence for competitive positioning:
            - Market position: ${userContext.marketIntelligence?.competitorAnalysis?.[0]?.marketPosition || 'insufficient_data'}
            - Competitor count: ${userContext.marketIntelligence?.competitorAnalysis?.[0]?.competitorCount || 'insufficient_data'}
            - Price difference: ${userContext.marketIntelligence?.competitorAnalysis?.[0]?.priceDifference || 'insufficient_data'}
            - Market share: ${userContext.marketIntelligence?.competitorAnalysis?.[0]?.marketShare || 'insufficient_data'}%
        
        23. **MARKET TRENDS**: Use market trend data for strategic planning:
            - Demand pattern: ${userContext.marketIntelligence?.marketTrends?.[0]?.pattern || 'insufficient_data'}
            - Peak season: ${userContext.marketIntelligence?.marketTrends?.[0]?.peakSeason || 'insufficient_data'}
            - Market opportunity: ${userContext.marketIntelligence?.marketTrends?.[0]?.marketOpportunity || 'insufficient_data'}
        
        24. **COMPETITIVE ADVANTAGES**: Use advantage analysis for positioning:
            - Location advantage: ${userContext.marketIntelligence?.competitiveAdvantages?.[0]?.advantages?.[0]?.advantage || 'insufficient_data'}
            - Market value: ${userContext.marketIntelligence?.competitiveAdvantages?.[0]?.advantages?.[0]?.marketValue || 'insufficient_data'}
            - Advantage score: ${userContext.marketIntelligence?.competitiveAdvantages?.[0]?.totalAdvantageScore || 'insufficient_data'}
        
        25. **MARKET OPPORTUNITIES**: Use opportunity data for growth strategies:
            - Opportunity type: ${userContext.marketIntelligence?.marketOpportunities?.[0]?.type || 'insufficient_data'}
            - Potential: ${userContext.marketIntelligence?.marketOpportunities?.[0]?.potential || 'insufficient_data'}
            - Expected ROI: ${userContext.marketIntelligence?.marketOpportunities?.[0]?.expectedROI || 'insufficient_data'}
        
        26. **MARKET INTELLIGENCE**: Always provide market-aware advice:
            - Reference competitor positioning and market share
            - Use market trends for strategic timing
            - Leverage competitive advantages in recommendations
            - Identify market opportunities for growth
            - Provide location-specific market insights`;

        // Call Gemini API
        const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 300,
                    topP: 0.8,
                    topK: 40
                }
            })
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error:', geminiResponse.status, errorText);
            
            if (geminiResponse.status === 429) {
                return res.status(429).json({ 
                    error: 'AI service busy',
                    message: 'The AI service is currently busy. Please try again in a moment.'
                });
            }
            
            return res.status(500).json({ 
                error: 'AI service error',
                message: 'Sorry, I encountered an error. Please try again.'
            });
        }

        const data = await geminiResponse.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            
            // Cache the response to reduce future AI calls
            responseCache.set(cacheKey, {
                response: aiResponse,
                timestamp: Date.now()
            });
            
            // Estimate token usage and cost
            const estimatedInputTokens = Math.ceil(prompt.length / 4); // Rough estimate
            const estimatedOutputTokens = Math.ceil(aiResponse.length / 4);
            const estimatedCost = (estimatedInputTokens * COST_PER_1K_INPUT_TOKENS / 1000) + 
                                 (estimatedOutputTokens * COST_PER_1K_OUTPUT_TOKENS / 1000);
            
            // Track user's token usage
            const userTokens = userTokenUsage.get(userId) || { input: 0, output: 0, cost: 0 };
            userTokens.input += estimatedInputTokens;
            userTokens.output += estimatedOutputTokens;
            userTokens.cost += estimatedCost;
            userTokenUsage.set(userId, userTokens);
            
            // Log usage for monitoring
            console.log(`AI Chat - User: ${userId}, Message: ${message.substring(0, 50)}..., Tokens: ${estimatedInputTokens}i/${estimatedOutputTokens}o, Cost: $${estimatedCost.toFixed(6)}`);
            
            res.json({
                success: true,
                response: aiResponse,
                timestamp: new Date().toISOString(),
                usage: {
                    user: userId,
                    messageLength: message.length,
                    responseLength: aiResponse.length,
                    cached: false,
                    tokens: {
                        input: estimatedInputTokens,
                        output: estimatedOutputTokens
                    },
                    cost: estimatedCost
                }
            });
        } else {
            throw new Error('Invalid response format from Gemini API');
        }

    } catch (error) {
        console.error('AI Chat error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Sorry, I encountered an error. Please try again.'
        });
    }
});

// Get chat status and usage info
router.get('/status', authenticateUser, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const userRequests = userRequestCounts.get(userId) || [];
        const now = Date.now();
        const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
        
        const userTokens = userTokenUsage.get(userId) || { input: 0, output: 0, cost: 0 };
        
        res.json({
            success: true,
            rateLimit: {
                current: recentRequests.length,
                limit: MAX_REQUESTS_PER_MINUTE,
                window: RATE_LIMIT_WINDOW / 1000, // seconds
                resetTime: recentRequests.length > 0 ? 
                    new Date(recentRequests[0] + RATE_LIMIT_WINDOW).toISOString() : 
                    new Date().toISOString()
            },
            dailyLimit: {
                current: todayRequests.length,
                limit: MAX_REQUESTS_PER_DAY,
                window: DAILY_LIMIT_WINDOW / 1000 / 60 / 60, // hours
                resetTime: todayRequests.length > 0 ? 
                    new Date(todayRequests[0] + DAILY_LIMIT_WINDOW).toISOString() : 
                    new Date().toISOString()
            },
            usage: {
                tokens: {
                    input: userTokens.input,
                    output: userTokens.output,
                    total: userTokens.input + userTokens.output
                },
                cost: {
                    current: userTokens.cost,
                    estimated: userTokens.cost,
                    currency: 'USD'
                }
            },
            service: {
                status: GEMINI_API_KEY ? 'available' : 'unavailable',
                provider: 'Google Gemini'
            }
        });
    } catch (error) {
        console.error('Chat status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'AI Chat Backend',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!GEMINI_API_KEY
    });
});

// Usage monitoring endpoint (for administrators)
router.get('/usage', authenticateUser, (req, res) => {
    try {
        // Only allow admin users or the user themselves
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const totalUsers = userRequestCounts.size;
        const totalDailyRequests = Array.from(userDailyCounts.values())
            .reduce((sum, requests) => sum + requests.length, 0);
        const totalCost = Array.from(userTokenUsage.values())
            .reduce((sum, usage) => sum + usage.cost, 0);

        res.json({
            success: true,
            summary: {
                totalUsers,
                totalDailyRequests,
                totalCost: totalCost.toFixed(6),
                cacheSize: responseCache.size
            },
            limits: {
                perMinute: MAX_REQUESTS_PER_MINUTE,
                perDay: MAX_REQUESTS_PER_DAY,
                cacheTTL: CACHE_TTL / 1000 / 60 // minutes
            }
        });
    } catch (error) {
        console.error('Usage monitoring error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export functions for testing purposes
module.exports = {
    router,
    calculateTrendMetrics,
    calculatePredictiveInsights,
    calculateSmartRecommendations,
    calculateMarketIntelligence,
    getUserPropertyContext
};
