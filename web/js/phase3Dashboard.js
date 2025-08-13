/**
 * Phase 3 Dashboard Manager
 * Integrates advanced analytics and AI insights
 */
console.log('🔍 Phase3DashboardManager class definition loaded');
class Phase3DashboardManager {
    constructor() {
        console.log('🔍 Phase3DashboardManager constructor called');
        console.log('🔍 AdvancedAnalyticsEngine available:', typeof AdvancedAnalyticsEngine);
        
        try {
            this.analyticsEngine = new AdvancedAnalyticsEngine();
            console.log('✅ AdvancedAnalyticsEngine created successfully');
        } catch (error) {
            console.error('❌ Failed to create AdvancedAnalyticsEngine:', error);
            this.analyticsEngine = null;
        }
        
        this.insights = [];
        this.predictions = [];
        this.recommendations = [];
        this.benchmarks = null;
        this.isLoading = false;
        
        console.log('🔍 Calling init() method...');
        this.init();
    }

    async init() {
        console.log('🚀 Phase 3 Dashboard Manager initialized');
        console.log('🔍 Starting initialization process...');
        
        try {
            await this.loadAdvancedAnalytics();
            console.log('📊 Advanced analytics loaded, setting up UI...');
        } catch (error) {
            console.error('❌ Failed to load advanced analytics, continuing with UI setup:', error);
        }
        
        this.setupEventListeners();
        this.startInsightsRefresh();
        this.renderPhase3Dashboard();
        console.log('✅ Phase 3 Dashboard Manager initialization complete');
    }

    async loadAdvancedAnalytics() {
        try {
            console.log('🔍 loadAdvancedAnalytics called');
            console.log('🔍 Current window.apiService:', window.apiService);
            console.log('🔍 Current window.apiService.isAuthenticated():', window.apiService?.isAuthenticated());
            
            this.isLoading = true;
            this.showLoadingState();

            if (!window.apiService || !window.apiService.isAuthenticated()) {
                console.error('❌ No authentication token found');
                console.log('🔍 apiService available:', !!window.apiService);
                console.log('🔍 apiService authenticated:', window.apiService?.isAuthenticated());
                console.log('🔍 apiService object:', window.apiService);
                return;
            }

            console.log('✅ Authentication check passed, making API request...');
            console.log('🔍 Making request to: /advanced-analytics/advanced?includePredictions=true');
            
            const response = await window.apiService.request('/advanced-analytics/advanced?includePredictions=true', { method: 'GET' });
            console.log('📡 API response received:', response);

            if (response.success) {
                this.insights = response.data.insights || [];
                this.predictions = response.data.predictions || [];
                this.recommendations = response.data.recommendations || [];
                this.benchmarks = response.data.benchmarks;
                
                console.log('📊 Advanced analytics loaded:', {
                    insights: this.insights.length,
                    predictions: this.predictions.length,
                    recommendations: this.recommendations.length
                });
            } else {
                console.error('Failed to load advanced analytics:', response.error);
            }
        } catch (error) {
            console.error('Error loading advanced analytics:', error);
            console.error('Error details:', error.stack);
            this.showErrorState(error.message);
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    renderPhase3Dashboard() {
        console.log('🎨 Phase 3 Dashboard rendering complete - AI chat handled by main dashboard');
        
        // AI chat is now handled by the integrated interface in the main dashboard
        // No need to create duplicate AI chat sections
    }

    renderInsightCard(insight) {
        const priorityClass = insight.priority || 'info';
        const metricsHtml = insight.metrics ? 
            insight.metrics.map(metric => 
                `<span class="metric">${metric.label}: ${metric.value}</span>`
            ).join('') : '';

        return `
            <div class="insight-card ${priorityClass}">
                <div class="insight-icon">${insight.icon || '💡'}</div>
                <div class="insight-content">
                    <h4>${insight.title}</h4>
                    <p>${insight.description}</p>
                    ${metricsHtml ? `<div class="insight-metrics">${metricsHtml}</div>` : ''}
                </div>
            </div>
        `;
    }

    renderPredictionsPanel() {
        const predictionsContainer = document.getElementById('predictions-panel');
        if (!predictionsContainer) {
            console.warn('Predictions panel not found, creating it...');
            this.createPredictionsPanel();
            return;
        }

        predictionsContainer.innerHTML = `
            <div class="predictions-header">
                <h3>🔮 Performance Predictions</h3>
                <span class="confidence-badge">${this.calculateAverageConfidence()}% confidence</span>
            </div>
            <div class="predictions-grid">
                ${this.predictions.map(prediction => this.renderPredictionCard(prediction)).join('')}
            </div>
        `;
    }

    createPredictionsPanel() {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        if (!dashboardGrid) return;

        const predictionsPanel = document.createElement('div');
        predictionsPanel.id = 'predictions-panel';
        predictionsPanel.className = 'predictions-panel';
        predictionsPanel.innerHTML = `
            <div class="predictions-header">
                <h3>🔮 Performance Predictions</h3>
                <span class="confidence-badge">0% confidence</span>
            </div>
            <div class="predictions-grid">
                <div class="prediction-placeholder">
                    <div class="prediction-icon">🔮</div>
                    <p>Loading predictions...</p>
                </div>
            </div>
        `;

        dashboardGrid.appendChild(predictionsPanel);
    }

    renderPredictionCard(prediction) {
        const trendClass = prediction.direction === 'increasing' ? 'positive' : 'negative';
        const trendArrow = prediction.direction === 'increasing' ? '↗' : '↘';

        return `
            <div class="prediction-card">
                <div class="prediction-header">
                    <h4>${prediction.metric}</h4>
                    <span class="prediction-period">${prediction.period}</span>
                </div>
                <div class="prediction-value">
                    <span class="predicted">${prediction.predictedValue}</span>
                    <span class="confidence">${prediction.confidence}%</span>
                </div>
                <div class="prediction-trend ${trendClass}">
                    <span class="trend-arrow">${trendArrow}</span>
                    <span class="trend-value">${Math.abs(prediction.trend).toFixed(1)}%</span>
                </div>
            </div>
        `;
    }

    renderRecommendationsPanel() {
        const recommendationsContainer = document.getElementById('recommendations-panel');
        if (!recommendationsContainer) {
            console.warn('Recommendations panel not found, creating it...');
            this.createRecommendationsPanel();
            return;
        }

        recommendationsContainer.innerHTML = `
            <div class="recommendations-header">
                <h3>🎯 Actionable Recommendations</h3>
                <span class="priority-badge">${this.getHighPriorityCount()} high priority</span>
            </div>
            <div class="recommendations-list">
                ${this.recommendations.map(rec => this.renderRecommendationItem(rec)).join('')}
            </div>
        `;
    }

    createRecommendationsPanel() {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        if (!dashboardGrid) return;

        const recommendationsPanel = document.createElement('div');
        recommendationsPanel.id = 'recommendations-panel';
        recommendationsPanel.className = 'recommendations-panel';
        recommendationsPanel.innerHTML = `
            <div class="recommendations-header">
                <h3>🎯 Actionable Recommendations</h3>
                <span class="priority-badge">0 high priority</span>
            </div>
            <div class="recommendations-list">
                <div class="recommendation-placeholder">
                    <div class="recommendation-icon">🎯</div>
                    <p>Loading recommendations...</p>
                </div>
            </div>
        `;

        dashboardGrid.appendChild(recommendationsPanel);
    }

    renderRecommendationItem(recommendation) {
        const impactClass = recommendation.impact || 'medium';
        const effortClass = recommendation.effort || 'medium';

        return `
            <div class="recommendation-item ${impactClass}">
                <div class="recommendation-icon">💡</div>
                <div class="recommendation-content">
                    <h4>${recommendation.title}</h4>
                    <p>${recommendation.description}</p>
                    <div class="recommendation-meta">
                        <span class="impact-badge ${impactClass}">Impact: ${impactClass}</span>
                        <span class="effort-badge ${effortClass}">Effort: ${effortClass}</span>
                    </div>
                    <div class="recommendation-actions">
                        <button class="btn btn-primary btn-sm" onclick="phase3Dashboard.implementRecommendation('${recommendation.id}')">
                            Implement
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="phase3Dashboard.dismissRecommendation('${recommendation.id}')">
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderBenchmarksPanel() {
        if (!this.benchmarks) return;

        const benchmarksContainer = document.getElementById('benchmarks-panel');
        if (!benchmarksContainer) {
            this.createBenchmarksPanel();
            return;
        }

        const { current, historical, improvement, ranking, opportunities } = this.benchmarks;

        benchmarksContainer.innerHTML = `
            <div class="benchmarks-header">
                <h3>📊 Performance Benchmarks</h3>
                <span class="ranking-badge ${ranking}">${ranking}</span>
            </div>
            <div class="benchmarks-content">
                <div class="benchmark-metrics">
                    <div class="benchmark-metric">
                        <h4>Revenue</h4>
                        <div class="metric-value">$${current.revenue.toFixed(0)}</div>
                        <div class="metric-change ${improvement.revenue >= 0 ? 'positive' : 'negative'}">
                            ${improvement.revenue >= 0 ? '+' : ''}${improvement.revenue.toFixed(1)}%
                        </div>
                    </div>
                    <div class="benchmark-metric">
                        <h4>Occupancy</h4>
                        <div class="metric-value">${current.occupancy.toFixed(1)}%</div>
                        <div class="metric-change ${improvement.occupancy >= 0 ? 'positive' : 'negative'}">
                            ${improvement.occupancy >= 0 ? '+' : ''}${improvement.occupancy.toFixed(1)}%
                        </div>
                    </div>
                    <div class="benchmark-metric">
                        <h4>Bookings</h4>
                        <div class="metric-value">${current.bookings.toFixed(0)}</div>
                        <div class="metric-change ${improvement.bookings >= 0 ? 'positive' : 'negative'}">
                            ${improvement.bookings >= 0 ? '+' : ''}${improvement.bookings.toFixed(1)}%
                        </div>
                    </div>
                </div>
                ${opportunities.length > 0 ? `
                    <div class="opportunities-section">
                        <h4>Opportunities</h4>
                        <div class="opportunities-list">
                            ${opportunities.map(opp => `
                                <div class="opportunity-item ${opp.potential}">
                                    <span class="opportunity-title">${opp.title}</span>
                                    <span class="opportunity-potential">${opp.potential}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    createBenchmarksPanel() {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        if (!dashboardGrid) return;

        const benchmarksPanel = document.createElement('div');
        benchmarksPanel.id = 'benchmarks-panel';
        benchmarksPanel.className = 'benchmarks-panel';
        benchmarksPanel.innerHTML = `
            <div class="benchmarks-header">
                <h3>📊 Performance Benchmarks</h3>
                <span class="ranking-badge">loading...</span>
            </div>
            <div class="benchmarks-content">
                <div class="benchmark-placeholder">
                    <div class="benchmark-icon">📊</div>
                    <p>Loading benchmarks...</p>
                </div>
            </div>
        `;

        dashboardGrid.appendChild(benchmarksPanel);
    }

    renderAnomalyDetection() {
        // This will be implemented when we add anomaly detection
        console.log('Anomaly detection panel will be implemented in next phase');
    }

    // Helper methods
    calculateAverageConfidence() {
        if (!this.predictions.length) return 0;
        const total = this.predictions.reduce((sum, p) => sum + (p.confidence || 0), 0);
        return Math.round(total / this.predictions.length);
    }

    getHighPriorityCount() {
        return this.recommendations.filter(r => r.impact === 'high').length;
    }

    showLoadingState() {
        // Update placeholder content to show loading state
        this.updatePlaceholderContent('Loading AI insights...', 'Loading predictions...', 'Loading recommendations...');
    }

    hideLoadingState() {
        // Loading state is handled by the data rendering
    }

    updatePlaceholderContent(insightsText, predictionsText, recommendationsText) {
        // Update insights panel placeholder
        const insightsGrid = document.querySelector('#ai-insights-panel .insights-grid');
        if (insightsGrid) {
            insightsGrid.innerHTML = `
                <div class="insight-placeholder">
                    <div class="insight-icon">💡</div>
                    <p>${insightsText}</p>
                </div>
            `;
        }

        // Update predictions panel placeholder
        const predictionsGrid = document.querySelector('#predictions-panel .predictions-grid');
        if (predictionsGrid) {
            predictionsGrid.innerHTML = `
                <div class="prediction-placeholder">
                    <div class="prediction-icon">🔮</div>
                    <p>${predictionsText}</p>
                </div>
            `;
        }

        // Update recommendations panel placeholder
        const recommendationsList = document.querySelector('#recommendations-panel .recommendations-list');
        if (recommendationsList) {
            recommendationsList.innerHTML = `
                <div class="recommendation-placeholder">
                    <div class="recommendation-icon">🎯</div>
                    <p>${recommendationsText}</p>
                </div>
            `;
        }
    }

    showErrorState(message) {
        // Show error state in the placeholder content
        this.updatePlaceholderContent(
            `Error: ${message}`,
            `Error: ${message}`,
            `Error: ${message}`
        );
    }

    setupEventListeners() {
        // Event listeners for Phase 3 features
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-refresh-analytics')) {
                this.loadAdvancedAnalytics();
            }
        });

        // Listen for dashboard tab changes
        const dashboardTab = document.querySelector('[data-tab="dashboard"]');
        if (dashboardTab) {
            dashboardTab.addEventListener('click', () => {
                setTimeout(() => this.renderPhase3Dashboard(), 100);
            });
        }
    }

    startInsightsRefresh() {
        // Auto-refresh insights every 10 minutes
        setInterval(() => this.loadAdvancedAnalytics(), 10 * 60 * 1000);
    }

    // Action methods
    async implementRecommendation(recommendationId) {
        try {
            const recommendation = this.recommendations.find(r => r.id === recommendationId);
            if (!recommendation) return;

            console.log(`Implementing recommendation: ${recommendation.title}`);
            
            // Show implementation modal or action
            this.showImplementationModal(recommendation);
            
            // Mark as implemented
            this.markRecommendationAsImplemented(recommendationId);
            
        } catch (error) {
            console.error('Error implementing recommendation:', error);
        }
    }

    async dismissRecommendation(recommendationId) {
        try {
            console.log(`Dismissing recommendation: ${recommendationId}`);
            
            // Remove from recommendations list
            this.recommendations = this.recommendations.filter(r => r.id !== recommendationId);
            
            // Re-render recommendations panel
            this.renderRecommendationsPanel();
            
        } catch (error) {
            console.error('Error dismissing recommendation:', error);
        }
    }

    showImplementationModal(recommendation) {
        // Create and show implementation modal
        const modal = document.createElement('div');
        modal.className = 'modal implementation-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Implement: ${recommendation.title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>${recommendation.description}</p>
                    <div class="implementation-steps">
                        <h4>Implementation Steps:</h4>
                        <ol>
                            <li>Review current performance metrics</li>
                            <li>Set specific goals and targets</li>
                            <li>Create action plan with timelines</li>
                            <li>Monitor progress and adjust</li>
                        </ol>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="phase3Dashboard.startImplementation('${recommendation.id}')">
                        Start Implementation
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    markRecommendationAsImplemented(recommendationId) {
        // Update recommendation status
        const recommendation = this.recommendations.find(r => r.id === recommendationId);
        if (recommendation) {
            recommendation.status = 'implemented';
            recommendation.implementedAt = new Date().toISOString();
        }
    }

    async startImplementation(recommendationId) {
        try {
            console.log(`Starting implementation for: ${recommendationId}`);
            
            // Close modal
            const modal = document.querySelector('.implementation-modal');
            if (modal) modal.remove();
            
            // Show success message
            this.showNotification('Implementation started successfully!', 'success');
            
            // Update recommendation status
            this.markRecommendationAsImplemented(recommendationId);
            
        } catch (error) {
            console.error('Error starting implementation:', error);
            this.showNotification('Failed to start implementation', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Public methods for external access
    refreshAnalytics() {
        return this.loadAdvancedAnalytics();
    }

    getInsights() {
        return this.insights;
    }

    getPredictions() {
        return this.predictions;
    }

    getRecommendations() {
        return this.recommendations;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Phase3DashboardManager;
}
