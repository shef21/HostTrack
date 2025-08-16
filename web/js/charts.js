// ===== CHARTS JAVASCRIPT =====

class ChartsManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        console.log('Charts manager initialized');
        
        // Listen for page unload to destroy charts (not tab switching)
        window.addEventListener('beforeunload', () => {
            this.destroyCharts();
        });
        
        // Listen for page visibility changes but don't destroy charts immediately
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('🔍 Page hidden (tab switch), preserving charts');
                // Don't destroy charts on tab switch, just pause them if needed
            } else {
                console.log('🔍 Page visible again, charts should still be available');
                // Charts should still be available when returning to tab
                this.ensureChartsAvailable();
            }
        });
    }

    // Method to ensure charts are available when page becomes visible
    ensureChartsAvailable() {
        console.log('🔍 Ensuring charts are available...');
        
        // Check if any charts exist
        const hasCharts = Object.keys(this.charts).length > 0;
        
        if (!hasCharts) {
            console.log('⚠️ No charts found, they may need to be recreated');
            // Trigger a custom event that the dashboard can listen to
            window.dispatchEvent(new CustomEvent('chartsNeedRecreation'));
        } else {
            console.log('✅ Charts are available');
        }
    }

    // Method to destroy charts when switching pages
    destroyCharts() {
        console.log('🗑️ Destroying all charts...');
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
        
        // Also destroy analytics charts if they exist
        if (window.analyticsManager) {
            window.analyticsManager.destroyCharts();
        }
        
        console.log('✅ All charts destroyed');
    }

    // Method to create a chart with common options
    createChart(ctx, type, data, options = {}) {
        // Destroy existing chart if it exists
        if (this.charts[ctx.id]) {
            this.charts[ctx.id].destroy();
        }

        // Default options
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        };

        // Merge options
        const finalOptions = { ...defaultOptions, ...options };

        // Create chart
        this.charts[ctx.id] = new Chart(ctx, {
            type: type,
            data: data,
            options: finalOptions
        });

        return this.charts[ctx.id];
    }

    // Method to update chart data
    updateChart(chartId, newData) {
        if (this.charts[chartId]) {
            this.charts[chartId].data = newData;
            this.charts[chartId].update();
        }
    }

    // Method to get chart instance
    getChart(chartId) {
        return this.charts[chartId];
    }
}

// ChartsManager is initialized by app.js when needed