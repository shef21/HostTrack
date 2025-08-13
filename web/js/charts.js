// ===== CHARTS JAVASCRIPT =====

class ChartsManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        console.log('Charts manager initialized');
        
        // Listen for page changes to destroy charts
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.destroyCharts();
            }
        });
    }

    // Method to destroy charts when switching pages
    destroyCharts() {
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