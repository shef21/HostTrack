// ===== ANALYTICS JAVASCRIPT =====

class AnalyticsManager {
    constructor() {
        console.log('=== ANALYTICS DEBUG: AnalyticsManager constructor called ===');
        
        // Initialize data storage
        this.data = {
            dashboard: null,
            revenue: null,
            occupancy: null,
            expenses: null
        };
        
        // Initialize charts storage
        this.charts = {};
        
        // Initialize flags
        this.initialized = false;
        this.eventListenersSetup = false;
        
        // Setup event listeners
        this.setupAnalyticsEventListeners();
        
        console.log('AnalyticsManager initialized successfully');
    }

    // Method to clear existing event listeners
    clearEventListeners() {
        console.log('Clearing existing event listeners...');
        
        // Remove event listeners from buttons by cloning them (this removes all listeners)
        const buttons = [
            'export-data-btn',
            'load-real-data-btn',
            'debug-user-data-btn'
        ];
        
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                console.log(`Cleared event listeners for ${buttonId}`);
            }
        });
        
        // Reset the flag
        this.eventListenersSetup = false;
    }

    setupAnalyticsEventListeners() {
        console.log('=== ANALYTICS DEBUG: setupAnalyticsEventListeners() called ===');
        
        // Prevent duplicate event listener setup
        if (this.eventListenersSetup) {
            console.log('Event listeners already set up, skipping...');
            return;
        }
        
        // Clear any existing event listeners first
        this.clearEventListeners();
        
        // Export data button
        const exportBtn = document.getElementById('export-data-btn');
        console.log('Export button found:', !!exportBtn);
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Load real data button
        const loadRealDataBtn = document.getElementById('load-real-data-btn');
        console.log('Load real data button found:', !!loadRealDataBtn);
        if (loadRealDataBtn) {
            loadRealDataBtn.addEventListener('click', () => {
                this.loadRealData();
            });
        }

        // Debug user data button
        const debugBtn = document.getElementById('debug-user-data-btn');
        console.log('Debug user data button found:', !!debugBtn);
        if (debugBtn) {
            debugBtn.addEventListener('click', () => {
                this.debugUserData();
            });
        }

        // Date range selectors
        const dateSelectors = document.querySelectorAll('.date-range-selector');
        console.log('Date range selectors found:', dateSelectors.length);
        dateSelectors.forEach(selector => {
            selector.addEventListener('change', () => {
                this.handleDateRangeChange();
            });
        });
        
        // Mark as set up
        this.eventListenersSetup = true;
        console.log('Event listeners setup completed');
    }

    onPageLoad() {
        console.log('=== ANALYTICS DEBUG: onPageLoad() called ===');
        
        // Only setup event listeners if they haven't been set up yet
        if (!this.eventListenersSetup) {
            console.log('Setting up analytics event listeners...');
            this.setupAnalyticsEventListeners();
        } else {
            console.log('Event listeners already set up, skipping setup...');
        }
        
        // Load real data by default when analytics page is accessed
        this.loadRealData();
        
        console.log('Analytics page loaded, event listeners set up. Real data will load automatically.');
    }

    // Load real user data
    async loadRealData() {
        try {
            console.log('Loading real user data...');
            
            // Load dashboard data
            await this.loadDashboardData();
            
            // Load revenue data
            await this.loadRevenueData();
            
            // Load occupancy data
            await this.loadOccupancyData();
            
            // Load expenses data
            await this.loadExpensesData();
            
            console.log('Real data loaded successfully');
            this.showNotification('Real data loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error loading real data:', error);
            this.showNotification('Error loading real data. Please try again.', 'error');
        }
    }

    // Debug: List all user data
    async debugUserData() {
        try {
            console.log('Debug: Listing all user data...');
            
            const response = await window.apiService.request('/analytics/debug/user-data', { method: 'GET' });
            
            if (response) {
                console.log('=== USER DATA DEBUG ===');
                console.log('Properties:', response.properties?.length || 0);
                console.log('Bookings:', response.bookings?.length || 0);
                console.log('Services:', response.services?.length || 0);
                console.log('Expenses:', response.expenses?.length || 0);
                
                if (response.properties && response.properties.length > 0) {
                    console.log('Sample property names:', response.properties.map(p => p.name));
                }
                if (response.bookings && response.bookings.length > 0) {
                    console.log('Sample booking names:', response.bookings.map(b => b.guest_name));
                }
                if (response.services && response.services.length > 0) {
                    console.log('Sample service names:', response.services.map(s => s.name));
                }
                
                this.showNotification(`Debug data logged to console. Properties: ${response.properties?.length || 0}, Bookings: ${response.bookings?.length || 0}, Services: ${response.services?.length || 0}`, 'info');
            }
            
        } catch (error) {
            console.error('Error debugging user data:', error);
            this.showNotification('Error debugging user data. Please check console for details.', 'error');
        }
    }

    // Load dashboard data
    async loadDashboardData() {
        try {
            const response = await window.apiService.request('/analytics/dashboard', { method: 'GET' });
            if (response) {
                this.data.dashboard = response;
                this.updateDashboardDisplay();
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    // Load revenue data
    async loadRevenueData() {
        try {
            const response = await window.apiService.request('/analytics/revenue', { method: 'GET' });
            if (response) {
                this.data.revenue = response;
                this.updateRevenueChart();
            }
        } catch (error) {
            console.error('Error loading revenue data:', error);
        }
    }

    // Load occupancy data
    async loadOccupancyData() {
        try {
            const response = await window.apiService.request('/analytics/occupancy', { method: 'GET' });
            if (response) {
                this.data.occupancy = response;
                this.updateOccupancyChart();
            }
        } catch (error) {
            console.error('Error loading occupancy data:', error);
        }
    }

    // Load expenses data
    async loadExpensesData() {
        try {
            const response = await window.apiService.request('/analytics/expenses', { method: 'GET' });
            if (response) {
                this.data.expenses = response;
                this.updateExpensesChart();
            }
        } catch (error) {
            console.error('Error loading expenses data:', error);
        }
    }

    // Update dashboard display
    updateDashboardDisplay() {
        if (!this.data.dashboard) return;

        const { overview, properties, bookings, services } = this.data.dashboard;

        // Update overview cards
        this.updateCard('total-revenue', `R ${overview.totalRevenue?.toLocaleString() || 0}`);
        this.updateCard('total-bookings', overview.totalBookings || 0);
        this.updateCard('avg-booking-value', `R ${overview.avgBookingValue?.toLocaleString() || 0}`);
        this.updateCard('total-properties', properties.total || 0);
        this.updateCard('confirmed-bookings', bookings.confirmed || 0);
        this.updateCard('pending-bookings', bookings.pending || 0);
        this.updateCard('total-services', services.total || 0);
    }

    // Update individual card
    updateCard(cardId, value) {
        const card = document.getElementById(cardId);
        if (card) {
            const valueElement = card.querySelector('.card-value');
            if (valueElement) {
                valueElement.textContent = value;
            }
        }
    }

    // Update revenue chart
    updateRevenueChart() {
        if (!this.data.revenue) return;

        const { monthlyRevenue } = this.data.revenue;
        const months = Object.keys(monthlyRevenue).sort();
        const revenue = months.map(month => monthlyRevenue[month]);

        this.createChart('revenue-chart', {
            type: 'line',
            data: {
                labels: months.map(month => {
                    const [year, monthNum] = month.split('-');
                    return new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }),
                datasets: [{
                    label: 'Monthly Revenue',
                    data: revenue,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Monthly Revenue'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R ' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // Update occupancy chart
    updateOccupancyChart() {
        if (!this.data.occupancy) return;

        const { occupancyData } = this.data.occupancy;
        const months = Object.keys(occupancyData).sort();
        const occupancyRates = months.map(month => {
            const data = occupancyData[month];
            return data.totalDays > 0 ? (data.bookedDays / data.totalDays) * 100 : 0;
        });

        this.createChart('occupancy-chart', {
            type: 'bar',
            data: {
                labels: months.map(month => {
                    const [year, monthNum] = month.split('-');
                    return new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }),
                datasets: [{
                    label: 'Occupancy Rate (%)',
                    data: occupancyRates,
                    backgroundColor: '#3B82F6',
                    borderColor: '#2563EB',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Monthly Occupancy Rate'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // Update expenses chart
    updateExpensesChart() {
        if (!this.data.expenses) return;

        const { categoryExpenses } = this.data.expenses;
        const categories = Object.keys(categoryExpenses);
        const amounts = Object.values(categoryExpenses);

        this.createChart('expenses-chart', {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: amounts,
                    backgroundColor: [
                        '#EF4444',
                        '#F59E0B',
                        '#10B981',
                        '#3B82F6',
                        '#8B5CF6',
                        '#EC4899'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Expenses by Category'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Create or update chart
    createChart(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Destroy existing chart if it exists
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        // Create new chart
        this.charts[canvasId] = new Chart(canvas, config);
    }

    // Handle date range changes
    handleDateRangeChange() {
        // Reload data with new date range
        this.loadRealData();
    }

    // Export data functionality
    exportData() {
        try {
            const dataToExport = {
                dashboard: this.data.dashboard,
                revenue: this.data.revenue,
                occupancy: this.data.occupancy,
                expenses: this.data.expenses,
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('Error exporting data. Please try again.', 'error');
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add to page
        const container = document.querySelector('.analytics-actions') || document.body;
        container.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Destroy charts when leaving page
    destroyCharts() {
        console.log('=== ANALYTICS DEBUG: destroyCharts() called ===');
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    // Initialize after authentication
    initAfterAuth() {
        console.log('=== ANALYTICS DEBUG: initAfterAuth() called ===');
        
        // Only load data if analytics page is currently active
        const analyticsPage = document.getElementById('analytics-page');
        if (analyticsPage && analyticsPage.classList.contains('active')) {
            console.log('Analytics page is active, loading data...');
            this.loadRealData();
        } else {
            console.log('Analytics page not active, skipping data load...');
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsManager;
} 