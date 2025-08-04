// ===== CHARTS JAVASCRIPT =====

class ChartsManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        // Chart-specific functionality can be added here
        console.log('Charts manager initialized');
    }

    // Method to destroy charts when switching pages
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// Initialize charts manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chartsManager = new ChartsManager();
}); 