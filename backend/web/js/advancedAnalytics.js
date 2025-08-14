/**
 * Advanced Analytics Engine for Phase 3
 * Handles predictive analytics, trend analysis, and AI insights
 */
class AdvancedAnalyticsEngine {
    constructor() {
        this.forecastModels = new Map();
        this.seasonalPatterns = new Map();
        this.anomalyThresholds = new Map();
        this.performanceMetrics = new Map();
        this.init();
    }

    async init() {
        console.log('🚀 Advanced Analytics Engine initialized');
        await this.loadHistoricalData();
    }

    /**
     * Analyze revenue trends and generate predictions
     */
    async analyzeRevenueTrends(data, periods = 12) {
        try {
            const trends = this.calculateTrends(data.revenue || [], periods);
            const seasonality = this.detectSeasonality(data.revenue || []);
            const forecast = this.generateForecast(trends, seasonality, periods);
            
            return {
                trends,
                seasonality,
                forecast,
                confidence: this.calculateConfidence(trends, data.revenue || []),
                insights: this.generateRevenueInsights(trends, seasonality)
            };
        } catch (error) {
            console.error('Error analyzing revenue trends:', error);
            throw error;
        }
    }

    /**
     * Detect seasonal patterns in data
     */
    detectSeasonality(data) {
        if (!data || data.length < 12) {
            return { hasSeasonality: false, patterns: {}, recommendations: [] };
        }

        const patterns = {
            monthly: this.analyzeMonthlyPatterns(data),
            weekly: this.analyzeWeeklyPatterns(data),
            seasonal: this.analyzeSeasonalPatterns(data)
        };
        
        return {
            hasSeasonality: patterns.monthly.variance > 0.3 || patterns.weekly.variance > 0.2,
            patterns,
            recommendations: this.generateSeasonalRecommendations(patterns)
        };
    }

    /**
     * Generate performance benchmarks
     */
    generateBenchmarks(data, comparisonPeriod = 'last-year') {
        const current = this.calculateCurrentMetrics(data);
        const historical = this.calculateHistoricalMetrics(data, comparisonPeriod);
        
        return {
            current,
            historical,
            improvement: this.calculateImprovement(current, historical),
            ranking: this.rankPerformance(current, historical),
            opportunities: this.identifyOpportunities(current, historical)
        };
    }

    /**
     * Detect anomalies in data
     */
    detectAnomalies(data, metric = 'revenue') {
        const values = data[metric] || [];
        if (values.length < 3) {
            return { anomalies: [], threshold: 2.5, mean: 0, stdDev: 0, recommendations: [] };
        }

        const mean = this.calculateMean(values);
        const stdDev = this.calculateStandardDeviation(values, mean);
        const threshold = 2.5; // 2.5 standard deviations
        
        const anomalies = values.map((value, index) => {
            const zScore = Math.abs((value - mean) / stdDev);
            return {
                index,
                value,
                zScore,
                isAnomaly: zScore > threshold,
                severity: zScore > threshold * 1.5 ? 'high' : 'medium'
            };
        }).filter(item => item.isAnomaly);
        
        return {
            anomalies,
            threshold,
            mean,
            stdDev,
            recommendations: this.generateAnomalyRecommendations(anomalies)
        };
    }

    /**
     * Generate AI-powered insights
     */
    generateInsights(data) {
        const insights = [];
        
        // Revenue insights
        if (data.revenue && data.revenue.length > 0) {
            const revenueAnalysis = this.analyzeRevenueTrends(data);
            insights.push(...this.generateRevenueInsights(revenueAnalysis));
        }
        
        // Occupancy insights
        if (data.occupancy && data.occupancy.length > 0) {
            const occupancyAnalysis = this.analyzeOccupancyPatterns(data);
            insights.push(...this.generateOccupancyInsights(occupancyAnalysis));
        }
        
        // Performance insights
        if (data.performance && data.performance.length > 0) {
            const performanceAnalysis = this.analyzePerformanceMetrics(data);
            insights.push(...this.generatePerformanceInsights(performanceAnalysis));
        }
        
        return {
            insights,
            priority: this.prioritizeInsights(insights),
            actions: this.generateActionItems(insights)
        };
    }

    // Helper methods for calculations
    calculateTrends(data, periods) {
        if (!data || data.length < 2) {
            return { slope: 0, intercept: 0, direction: 'stable', strength: 'weak', prediction: 0 };
        }

        const n = Math.min(data.length, periods);
        const x = Array.from({length: n}, (_, i) => i);
        const y = data.slice(-n);
        
        const {slope, intercept} = this.linearRegression(x, y);
        
        return {
            slope,
            intercept,
            direction: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable',
            strength: Math.abs(slope) > 0.1 ? 'strong' : Math.abs(slope) > 0.05 ? 'moderate' : 'weak',
            prediction: this.predictNextValue(slope, intercept, n)
        };
    }

    linearRegression(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + x[i] * y[i], 0);
        const sumXX = x.reduce((a, b) => a + b * b, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return { slope, intercept };
    }

    calculateMean(values) {
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    calculateStandardDeviation(values, mean) {
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    predictNextValue(slope, intercept, n) {
        return slope * n + intercept;
    }

    calculateConfidence(trends, data) {
        if (!data || data.length < 2) return 0;
        
        const variance = this.calculateVariance(data);
        const trendStrength = Math.abs(trends.slope);
        
        // Higher confidence for stronger trends and lower variance
        let confidence = Math.min(95, Math.max(50, (trendStrength * 100) + (1 - variance) * 50));
        return Math.round(confidence);
    }

    calculateVariance(data) {
        const mean = this.calculateMean(data);
        const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
        return variance / (mean * mean); // Normalized variance
    }

    // Pattern analysis methods
    analyzeMonthlyPatterns(data) {
        // Simplified monthly pattern analysis
        const monthlyAverages = new Array(12).fill(0);
        const monthlyCounts = new Array(12).fill(0);
        
        data.forEach((value, index) => {
            const month = index % 12;
            monthlyAverages[month] += value;
            monthlyCounts[month]++;
        });
        
        monthlyAverages.forEach((sum, month) => {
            if (monthlyCounts[month] > 0) {
                monthlyAverages[month] = sum / monthlyCounts[month];
            }
        });
        
        return {
            averages: monthlyAverages,
            variance: this.calculateVariance(monthlyAverages),
            peakMonth: monthlyAverages.indexOf(Math.max(...monthlyAverages)),
            lowMonth: monthlyAverages.indexOf(Math.min(...monthlyAverages))
        };
    }

    analyzeWeeklyPatterns(data) {
        // Simplified weekly pattern analysis
        const weeklyAverages = new Array(7).fill(0);
        const weeklyCounts = new Array(7).fill(0);
        
        data.forEach((value, index) => {
            const day = index % 7;
            weeklyAverages[day] += value;
            weeklyCounts[day]++;
        });
        
        weeklyAverages.forEach((sum, day) => {
            if (weeklyCounts[day] > 0) {
                weeklyAverages[day] = sum / weeklyCounts[day];
            }
        });
        
        return {
            averages: weeklyAverages,
            variance: this.calculateVariance(weeklyAverages),
            peakDay: weeklyAverages.indexOf(Math.max(...weeklyAverages)),
            lowDay: weeklyAverages.indexOf(Math.min(...weeklyAverages))
        };
    }

    analyzeSeasonalPatterns(data) {
        // Simplified seasonal analysis
        const seasons = [
            { name: 'Spring', months: [2, 3, 4] },
            { name: 'Summer', months: [5, 6, 7] },
            { name: 'Autumn', months: [8, 9, 10] },
            { name: 'Winter', months: [11, 0, 1] }
        ];
        
        const seasonalAverages = seasons.map(season => {
            const values = season.months.map(month => {
                const monthData = data.filter((_, index) => index % 12 === month);
                return monthData.length > 0 ? this.calculateMean(monthData) : 0;
            });
            return {
                name: season.name,
                average: this.calculateMean(values),
                variance: this.calculateVariance(values)
            };
        });
        
        return {
            seasons: seasonalAverages,
            peakSeason: seasonalAverages.reduce((max, season) => 
                season.average > max.average ? season : max
            ),
            lowSeason: seasonalAverages.reduce((min, season) => 
                season.average < min.average ? season : min
            )
        };
    }

    // Insight generation methods
    generateRevenueInsights(trends, seasonality) {
        const insights = [];
        
        if (trends.direction === 'increasing') {
            insights.push({
                id: 'revenue-growth',
                title: 'Revenue Growth Detected',
                description: `Your revenue is showing a ${trends.strength} upward trend.`,
                icon: '📈',
                priority: 'positive',
                metrics: [
                    { label: 'Growth Rate', value: `${Math.abs(trends.slope * 100).toFixed(1)}%` },
                    { label: 'Confidence', value: `${trends.confidence}%` }
                ]
            });
        }
        
        if (seasonality.hasSeasonality) {
            insights.push({
                id: 'seasonal-pattern',
                title: 'Seasonal Patterns Identified',
                description: 'Your business shows clear seasonal trends that can be leveraged.',
                icon: '🌱',
                priority: 'info',
                metrics: [
                    { label: 'Peak Season', value: seasonality.patterns.seasonal.peakSeason.name },
                    { label: 'Pattern Strength', value: 'High' }
                ]
            });
        }
        
        return insights;
    }

    generateOccupancyInsights(analysis) {
        // Placeholder for occupancy insights
        return [];
    }

    generatePerformanceInsights(analysis) {
        // Placeholder for performance insights
        return [];
    }

    generateSeasonalRecommendations(patterns) {
        const recommendations = [];
        
        if (patterns.monthly.variance > 0.3) {
            recommendations.push({
                title: 'Optimize Monthly Pricing',
                description: 'Consider dynamic pricing based on monthly demand patterns',
                impact: 'high',
                effort: 'medium'
            });
        }
        
        if (patterns.seasonal.peakSeason) {
            recommendations.push({
                title: 'Capitalize on Peak Season',
                description: `Focus marketing efforts during ${patterns.seasonal.peakSeason.name}`,
                impact: 'high',
                effort: 'low'
            });
        }
        
        return recommendations;
    }

    generateAnomalyRecommendations(anomalies) {
        if (anomalies.length === 0) return [];
        
        return [{
            title: 'Investigate Anomalies',
            description: `${anomalies.length} unusual data points detected. Review for data quality or business events.`,
            impact: 'medium',
            effort: 'low'
        }];
    }

    // Benchmark methods
    calculateCurrentMetrics(data) {
        return {
            revenue: this.calculateMean(data.revenue || []),
            occupancy: this.calculateMean(data.occupancy || []),
            bookings: this.calculateMean(data.bookings || [])
        };
    }

    calculateHistoricalMetrics(data, period) {
        // Simplified historical calculation
        return this.calculateCurrentMetrics(data);
    }

    calculateImprovement(current, historical) {
        return {
            revenue: ((current.revenue - historical.revenue) / historical.revenue) * 100,
            occupancy: ((current.occupancy - historical.occupancy) / historical.occupancy) * 100,
            bookings: ((current.bookings - historical.bookings) / historical.bookings) * 100
        };
    }

    rankPerformance(current, historical) {
        // Simplified ranking system
        const improvement = this.calculateImprovement(current, historical);
        const totalImprovement = (improvement.revenue + improvement.occupancy + improvement.bookings) / 3;
        
        if (totalImprovement > 10) return 'excellent';
        if (totalImprovement > 5) return 'good';
        if (totalImprovement > 0) return 'stable';
        return 'needs-improvement';
    }

    identifyOpportunities(current, historical) {
        const opportunities = [];
        const improvement = this.calculateImprovement(current, historical);
        
        if (improvement.revenue < 5) {
            opportunities.push({
                title: 'Revenue Optimization',
                description: 'Focus on increasing revenue through pricing or marketing',
                potential: 'high'
            });
        }
        
        if (improvement.occupancy < 80) {
            opportunities.push({
                title: 'Occupancy Improvement',
                description: 'Work on filling more available dates',
                potential: 'medium'
            });
        }
        
        return opportunities;
    }

    // Utility methods
    prioritizeInsights(insights) {
        return insights.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    generateActionItems(insights) {
        return insights.map(insight => ({
            id: insight.id,
            action: insight.title,
            description: insight.description,
            priority: insight.priority
        }));
    }

    async loadHistoricalData() {
        // Placeholder for loading historical data
        console.log('📊 Loading historical data for analytics...');
    }

    generateForecast(trends, seasonality, periods) {
        const forecast = [];
        const baseValue = trends.intercept;
        
        for (let i = 1; i <= periods; i++) {
            let predictedValue = trends.slope * i + baseValue;
            
            // Apply seasonal adjustment if available
            if (seasonality.hasSeasonality && seasonality.patterns.monthly.averages.length > 0) {
                const monthIndex = (i - 1) % 12;
                const seasonalFactor = seasonality.patterns.monthly.averages[monthIndex] / 
                    this.calculateMean(seasonality.patterns.monthly.averages);
                predictedValue *= seasonalFactor;
            }
            
            forecast.push({
                period: i,
                predictedValue: Math.max(0, predictedValue),
                confidence: Math.max(50, trends.confidence - (i * 2))
            });
        }
        
        return forecast;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedAnalyticsEngine;
}
