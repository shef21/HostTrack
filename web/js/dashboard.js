// ===== DASHBOARD JAVASCRIPT =====

class DashboardManager {
    constructor() {
        this.charts = {};
        this.refreshInterval = null;
        this.isRefreshing = false;
        this.realtimeSubscriptions = [];
        this.setupDashboardEventListeners();
        this.initCharts();
        this.setupRealtimeUpdates();
    }

    setupDashboardEventListeners() {
        // Refresh dashboard button
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }

        // Auto-refresh toggle
        const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
        if (autoRefreshToggle) {
            autoRefreshToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.startAutoRefresh();
                } else {
                    this.stopAutoRefresh();
                }
            });
        }

        // Date range filters
        const dateRangeSelect = document.getElementById('date-range-select');
        if (dateRangeSelect) {
            dateRangeSelect.addEventListener('change', (e) => {
                this.updateDashboardWithDateRange(e.target.value);
            });
        }

        // Custom date range inputs
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        if (startDateInput && endDateInput) {
            startDateInput.addEventListener('change', () => this.handleCustomDateChange());
            endDateInput.addEventListener('change', () => this.handleCustomDateChange());
        }

        // Export functionality
        const exportPdfBtn = document.getElementById('export-pdf');
        const exportCsvBtn = document.getElementById('export-csv');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => this.exportDashboard('pdf'));
        }
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => this.exportDashboard('csv'));
        }
    }

    handleCustomDateChange() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        if (startDate && endDate) {
            this.updateDashboardWithCustomDateRange(startDate, endDate);
        }
    }

    updateDashboardWithCustomDateRange(startDate, endDate) {
        if (window.hostTrackApp) {
            window.hostTrackApp.loadDashboardData({ 
                dateRange: 'custom',
                startDate: startDate,
                endDate: endDate
            });
        }
    }

    setupRealtimeUpdates() {
        if (!window.realtimeService) {
            console.warn('Real-time service not available');
            return;
        }

        // Subscribe to real-time updates
        this.realtimeSubscriptions.push(
            window.realtimeService.subscribe('connection', (data) => {
                this.updateRealtimeStatus(data.status);
            })
        );

        this.realtimeSubscriptions.push(
            window.realtimeService.subscribe('new_booking', (data) => {
                this.handleNewBooking(data);
            })
        );

        this.realtimeSubscriptions.push(
            window.realtimeService.subscribe('revenue_update', (data) => {
                this.handleRevenueUpdate(data);
            })
        );

        this.realtimeSubscriptions.push(
            window.realtimeService.subscribe('occupancy_update', (data) => {
                this.handleOccupancyUpdate(data);
            })
        );

        // Initialize real-time service after authentication
        window.realtimeService.initializeAfterAuth();
    }

    updateRealtimeStatus(status) {
        const indicator = document.getElementById('realtime-status-indicator');
        const statusText = document.getElementById('realtime-status-text');
        
        if (indicator && statusText) {
            indicator.className = `status-indicator ${status}`;
            
            switch (status) {
                case 'connected':
                    statusText.textContent = 'Live';
                    break;
                case 'disconnected':
                    statusText.textContent = 'Offline';
                    break;
                case 'connecting':
                    statusText.textContent = 'Connecting...';
                    break;
                case 'failed':
                    statusText.textContent = 'Failed';
                    break;
                default:
                    statusText.textContent = 'Unknown';
            }
        }
    }

    handleNewBooking(data) {
        // Update bookings count
        const bookingsElement = document.getElementById('total-bookings');
        if (bookingsElement) {
            const currentCount = parseInt(bookingsElement.textContent) || 0;
            bookingsElement.textContent = currentCount + 1;
            
            // Add visual indicator
            this.highlightElement(bookingsElement);
        }

        // Update upcoming bookings list if available
        this.updateUpcomingBookingsList(data.booking);
    }

    handleRevenueUpdate(data) {
        // Update revenue display
        const revenueElement = document.getElementById('total-revenue');
        if (revenueElement && data.revenue) {
            revenueElement.textContent = `R${data.revenue.total.toLocaleString()}`;
            this.highlightElement(revenueElement);
        }

        // Update revenue chart if available
        if (this.charts.revenue && data.revenue.chartData) {
            this.updateRevenueChartRealtime(data.revenue.chartData);
        }
    }

    handleOccupancyUpdate(data) {
        // Update occupancy rate
        const occupancyElement = document.getElementById('occupancy-rate');
        if (occupancyElement && data.occupancy) {
            occupancyElement.textContent = `${data.occupancy.rate}%`;
            this.highlightElement(occupancyElement);
        }

        // Update occupancy chart if available
        if (this.charts.occupancy && data.occupancy.chartData) {
            this.updateOccupancyChartRealtime(data.occupancy.chartData);
        }
    }

    highlightElement(element) {
        element.style.animation = 'pulse 0.5s ease-in-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }

    updateRevenueChartRealtime(chartData) {
        try {
            if (this.charts.revenue) {
                this.charts.revenue.data = chartData;
                this.charts.revenue.update('none'); // Update without animation for real-time
            }
        } catch (error) {
            console.error('Error updating revenue chart:', error);
        }
    }

    updateOccupancyChartRealtime(chartData) {
        try {
            if (this.charts.occupancy) {
                this.charts.occupancy.data = chartData;
                this.charts.occupancy.update('none'); // Update without animation for real-time
            }
        } catch (error) {
            console.error('Error updating occupancy chart:', error);
        }
    }

    updateUpcomingBookingsList(booking) {
        const upcomingList = document.getElementById('upcoming-bookings-list');
        if (upcomingList && booking) {
            // Add new booking to the top of the list
            const bookingElement = this.createBookingElement(booking);
            if (upcomingList.firstChild) {
                upcomingList.insertBefore(bookingElement, upcomingList.firstChild);
            } else {
                upcomingList.appendChild(bookingElement);
            }

            // Limit list to 5 items
            while (upcomingList.children.length > 5) {
                upcomingList.removeChild(upcomingList.lastChild);
            }
        }
    }

    createBookingElement(booking) {
        const element = document.createElement('div');
        element.className = 'booking-item new-booking';
        element.innerHTML = `
            <div class="booking-info">
                <div class="booking-property">${booking.property_name || 'Property'}</div>
                <div class="booking-dates">${booking.check_in} - ${booking.check_out}</div>
                <div class="booking-guest">${booking.guest_name || 'Guest'}</div>
            </div>
            <div class="booking-amount">R${(booking.price || 0).toLocaleString()}</div>
        `;
        
        // Remove new-booking class after animation
        setTimeout(() => {
            element.classList.remove('new-booking');
        }, 2000);
        
        return element;
    }

    exportDashboard(format) {
        try {
            switch (format) {
                case 'pdf':
                    this.exportToPDF();
                    break;
                case 'csv':
                    this.exportToCSV();
                    break;
                default:
                    console.error('Unsupported export format:', format);
            }
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Export failed', 'error');
        }
    }

    exportToPDF() {
        // For now, we'll create a simple HTML export that can be printed to PDF
        const dashboardData = this.getDashboardDataForExport();
        const htmlContent = this.generatePDFHTML(dashboardData);
        
        // Create a new window with the content
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load then print
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
        
        this.showNotification('PDF export ready for printing', 'success');
    }

    exportToCSV() {
        const dashboardData = this.getDashboardDataForExport();
        const csvContent = this.generateCSV(dashboardData);
        
        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('CSV export downloaded', 'success');
    }

    getDashboardDataForExport() {
        // Collect current dashboard data
        const data = {
            timestamp: new Date().toISOString(),
            metrics: {
                totalRevenue: document.getElementById('total-revenue')?.textContent || 'R0',
                totalProperties: document.getElementById('total-properties')?.textContent || '0',
                totalBookings: document.getElementById('total-bookings')?.textContent || '0',
                occupancyRate: document.getElementById('occupancy-rate')?.textContent || '0%',
                avgBookingValue: document.getElementById('avg-booking-value')?.textContent || 'R0',
                growthRate: document.getElementById('growth-rate')?.textContent || '0%'
            },
            charts: {
                revenue: this.charts.revenue?.data || null,
                performance: this.charts.performance?.data || null,
                occupancy: this.charts.occupancy?.data || null
            }
        };
        
        return data;
    }

    generatePDFHTML(data) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Dashboard Export</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
                    .metric { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                    .metric-value { font-size: 24px; font-weight: bold; color: #10B981; }
                    .metric-label { margin-top: 5px; color: #666; }
                    .timestamp { text-align: center; color: #999; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>HostTrack Dashboard Report</h1>
                    <p>Generated on ${new Date(data.timestamp).toLocaleString()}</p>
                </div>
                
                <div class="metrics">
                    <div class="metric">
                        <div class="metric-value">${data.metrics.totalRevenue}</div>
                        <div class="metric-label">Total Revenue</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${data.metrics.totalProperties}</div>
                        <div class="metric-label">Properties</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${data.metrics.totalBookings}</div>
                        <div class="metric-label">Bookings</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${data.metrics.occupancyRate}</div>
                        <div class="metric-label">Occupancy Rate</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${data.metrics.avgBookingValue}</div>
                        <div class="metric-label">Avg. Booking</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${data.metrics.growthRate}</div>
                        <div class="metric-label">Growth Rate</div>
                    </div>
                </div>
                
                <div class="timestamp">
                    <p>Report generated by HostTrack Dashboard</p>
                </div>
            </body>
            </html>
        `;
    }

    generateCSV(data) {
        const rows = [
            ['Metric', 'Value'],
            ['Total Revenue', data.metrics.totalRevenue],
            ['Total Properties', data.metrics.totalProperties],
            ['Total Bookings', data.metrics.totalBookings],
            ['Occupancy Rate', data.metrics.occupancyRate],
            ['Average Booking Value', data.metrics.avgBookingValue],
            ['Growth Rate', data.metrics.growthRate],
            [''],
            ['Generated', new Date(data.timestamp).toLocaleString()],
            ['Report', 'HostTrack Dashboard Export']
        ];
        
        return rows.map(row => row.join(',')).join('\n');
    }

    initCharts() {
        // Initialize charts when dashboard is ready
        try {
            this.createRevenueChart();
            this.createPerformanceChart();
            this.createOccupancyChart();
        } catch (error) {
            console.error('Error initializing charts:', error);
            this.showNotification('Error initializing charts', 'error');
        }
    }

    createRevenueChart() {
        const ctx = document.getElementById('revenue-chart');
        const loadingElement = document.getElementById('revenue-chart-loading');
        if (!ctx) return;

        // Initial data structure
        const data = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Revenue',
                data: [0, 0, 0, 0, 0, 0],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `R${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return `R${value.toLocaleString()}`;
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        };

        if (window.chartsManager) {
            this.charts.revenue = window.chartsManager.createChart(ctx, 'line', data, options);
            // Hide loading and show chart
            if (loadingElement) loadingElement.style.display = 'none';
            ctx.style.display = 'block';
        }
    }

    createPerformanceChart() {
        const ctx = document.getElementById('performance-chart');
        const loadingElement = document.getElementById('performance-chart-loading');
        if (!ctx) return;

        const data = {
            labels: ['Property 1', 'Property 2', 'Property 3'],
            datasets: [{
                label: 'Occupancy Rate',
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)'
                ],
                borderWidth: 1
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y}% occupancy`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return `${value}%`;
                        }
                    }
                }
            }
        };

        if (window.chartsManager) {
            this.charts.performance = window.chartsManager.createChart(ctx, 'bar', data, options);
            // Hide loading and show chart
            if (loadingElement) loadingElement.style.display = 'none';
            ctx.style.display = 'block';
        }
    }

    createOccupancyChart() {
        const ctx = document.getElementById('occupancy-chart');
        const loadingElement = document.getElementById('occupancy-chart-loading');
        if (!ctx) return;

        const data = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'This Week',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return `${value}%`;
                        }
                    }
                }
            }
        };

        if (window.chartsManager) {
            this.charts.occupancy = window.chartsManager.createChart(ctx, 'bar', data, options);
            // Hide loading and show chart
            if (loadingElement) loadingElement.style.display = 'none';
            ctx.style.display = 'block';
        }
    }

    updateCharts(dashboardData) {
        console.log('📊 updateCharts called with data:', dashboardData);
        
        // Validate input data
        if (!dashboardData || typeof dashboardData !== 'object') {
            console.warn('Invalid dashboard data provided to updateCharts');
            return;
        }

        // Transform our data structure to match chart expectations
        const transformedData = this.transformDataForCharts(dashboardData);
        console.log('🔄 Transformed data for charts:', transformedData);

        // Update revenue chart with monthly data
        if (this.charts.revenue && transformedData.revenue) {
            try {
                const revenueData = {
                    labels: transformedData.revenue.months || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue',
                        data: transformedData.revenue.amounts || [0, 0, 0, 0, 0, 0],
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                };
                this.charts.revenue.data = revenueData;
                this.charts.revenue.update();
                console.log('✅ Revenue chart updated');
            } catch (error) {
                console.error('Error updating revenue chart:', error);
            }
        }

        // Update performance chart with property data
        if (this.charts.performance && transformedData.properties) {
            try {
                const performanceData = {
                    labels: transformedData.properties.names || ['Property 1', 'Property 2', 'Property 3'],
                    datasets: [{
                        label: 'Occupancy Rate',
                        data: transformedData.properties.occupancy || [0, 0, 0],
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(245, 158, 11, 0.8)'
                        ],
                        borderColor: [
                            'rgba(59, 130, 246, 1)',
                            'rgba(16, 185, 129, 1)',
                            'rgba(245, 158, 11, 1)'
                        ],
                        borderWidth: 1
                    }]
                };
                this.charts.performance.data = performanceData;
                this.charts.performance.update();
                console.log('✅ Performance chart updated');
            } catch (error) {
                console.error('Error updating performance chart:', error);
            }
        }

        // Update occupancy chart with weekly data
        if (this.charts.occupancy && transformedData.occupancy) {
            try {
                const occupancyData = {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'This Week',
                        data: transformedData.occupancy.weekly || [0, 0, 0, 0, 0, 0, 0],
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    }]
                };
                this.charts.occupancy.data = occupancyData;
                this.charts.occupancy.update();
                console.log('✅ Occupancy chart updated');
            } catch (error) {
                console.error('Error updating occupancy chart:', error);
            }
        }
    }

    transformDataForCharts(dashboardData) {
        console.log('🔄 Transforming data for charts...');
        
        // Create mock monthly revenue data based on current revenue
        const currentRevenue = dashboardData.overview?.totalRevenue || 0;
        const monthlyRevenue = Array(6).fill(0).map(() => Math.floor(Math.random() * (currentRevenue + 1000)));
        
        // Create property performance data
        const propertyNames = ['Main Property', 'Guest House', 'Vacation Rental'];
        const propertyOccupancy = [dashboardData.overview?.occupancyRate || 0, 85, 70];
        
        // Create weekly occupancy data
        const weeklyOccupancy = Array(7).fill(0).map(() => Math.floor(Math.random() * 100));
        
        return {
            revenue: {
                months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                amounts: monthlyRevenue
            },
            properties: {
                names: propertyNames,
                occupancy: propertyOccupancy
            },
            occupancy: {
                weekly: weeklyOccupancy
            }
        };
    }

    refreshDashboard() {
        // Rate limiting: prevent multiple rapid refreshes
        if (this.isRefreshing) {
            this.showNotification('Dashboard refresh already in progress', 'info');
            return;
        }

        this.isRefreshing = true;
        const btn = document.getElementById('refresh-dashboard');
        const originalContent = btn.innerHTML;
        
        // Show loading state
        btn.innerHTML = `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style="animation: spin 1s linear infinite;">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
            Refreshing...
        `;
        btn.disabled = true;

        // Reload dashboard data
        if (window.hostTrackApp) {
            window.hostTrackApp.loadDashboardData();
        }
        
        // Reset button after a short delay
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.disabled = false;
            this.isRefreshing = false;
            
            // Show success message
            this.showNotification('Dashboard refreshed successfully!', 'success');
        }, 1500);
    }

    startAutoRefresh() {
        if (this.refreshInterval) {
            this.stopAutoRefresh();
        }
        
        this.refreshInterval = setInterval(() => {
            this.refreshDashboard();
        }, 300000); // Refresh every 5 minutes
        
        this.showNotification('Auto-refresh enabled (every 5 minutes)', 'success');
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            this.showNotification('Auto-refresh disabled', 'info');
        }
    }

    updateDashboardWithDateRange(range) {
        // Show/hide custom date inputs
        const customDateRange = document.getElementById('custom-date-range');
        if (customDateRange) {
            if (range === 'custom') {
                customDateRange.style.display = 'flex';
                // Set default dates (last 30 days)
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                
                document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
                document.getElementById('end-date').value = endDate.toISOString().split('T')[0];
            } else {
                customDateRange.style.display = 'none';
            }
        }

        // Update dashboard based on selected date range
        if (window.hostTrackApp) {
            window.hostTrackApp.loadDashboardData({ dateRange: range });
        }
    }

    updateEnhancedMetrics(data) {
        console.log('🔧 DashboardManager.updateEnhancedMetrics called with data:', data);
        
        // Update total properties with growth indicator
        const propertiesElement = document.getElementById('total-properties');
        console.log('🏠 Properties element found:', !!propertiesElement);
        if (propertiesElement && data.properties) {
            const currentTotal = data.properties.total || 0;
            const previousTotal = data.properties.previousTotal || 0;
            const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1) : 0;
            
            propertiesElement.textContent = currentTotal;
            console.log('✅ Properties updated to:', currentTotal);
            
            // Update growth indicator
            const growthElement = propertiesElement.parentElement.querySelector('.metric-change');
            if (growthElement) {
                const changeClass = growth >= 0 ? 'positive' : 'negative';
                growthElement.className = `metric-change ${changeClass}`;
                growthElement.textContent = `${growth >= 0 ? '+' : ''}${growth}% this month`;
            }
        }
        
        // Update total bookings with growth indicator
        const bookingsElement = document.getElementById('total-bookings');
        console.log('📅 Bookings element found:', !!bookingsElement);
        if (bookingsElement && data.bookings) {
            const currentTotal = data.bookings.total || 0;
            const previousTotal = data.bookings.previousTotal || 0;
            const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1) : 0;
            
            bookingsElement.textContent = currentTotal;
            console.log('✅ Bookings updated to:', currentTotal);
            
            // Update growth indicator
            const growthElement = bookingsElement.parentElement.querySelector('.metric-change');
            if (growthElement) {
                const changeClass = growth >= 0 ? 'positive' : 'negative';
                growthElement.className = `metric-change ${changeClass}`;
                growthElement.textContent = `${growth >= 0 ? '+' : ''}${growth}% this month`;
            }
        }
        
        // Update total revenue with growth indicator
        const revenueElement = document.getElementById('total-revenue');
        console.log('💰 Revenue element found:', !!revenueElement);
        if (revenueElement && data.overview) {
            const currentRevenue = data.overview.totalRevenue || 0;
            const previousRevenue = data.overview.previousRevenue || 0;
            const growth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : 0;
            
            revenueElement.textContent = `R${currentRevenue.toLocaleString()}`;
            console.log('✅ Revenue updated to:', currentRevenue);
            
            // Update growth indicator
            const growthElement = revenueElement.parentElement.parentElement.querySelector('.revenue-change');
            if (growthElement) {
                const changeClass = growth >= 0 ? 'positive' : 'negative';
                growthElement.className = `revenue-change ${changeClass}`;
                growthElement.textContent = `${growth >= 0 ? '+' : ''}${growth}% from last month`;
            }
        }
        
        // Update occupancy rate with growth indicator
        const occupancyElement = document.getElementById('occupancy-rate');
        console.log('🏨 Occupancy element found:', !!occupancyElement);
        if (occupancyElement && data.overview) {
            const currentRate = data.overview.occupancyRate || 0;
            const previousRate = data.overview.previousOccupancyRate || 0;
            const growth = previousRate > 0 ? ((currentRate - previousRate) / previousRate * 100).toFixed(1) : 0;
            
            occupancyElement.textContent = `${currentRate}%`;
            console.log('✅ Occupancy updated to:', currentRate + '%');
            
            // Update growth indicator
            const growthElement = occupancyElement.parentElement.querySelector('.metric-change');
            if (growthElement) {
                const changeClass = growth >= 0 ? 'positive' : 'negative';
                growthElement.className = `metric-change ${changeClass}`;
                growthElement.textContent = `${growth >= 0 ? '+' : ''}${growth}% this month`;
            }
        }

        console.log('🎯 Dashboard update complete');
        
        // Update charts with new data
        this.updateCharts(data);
        
        // Update additional metrics
        this.updateAdditionalMetrics(data);
    }

    updateAdditionalMetrics(data) {
        // Update average booking value
        const avgBookingElement = document.getElementById('avg-booking-value');
        if (avgBookingElement && data.overview) {
            const avgValue = data.overview.avgBookingValue || 0;
            avgBookingElement.textContent = `R${avgValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        }
        
        // Update growth rate (using revenue growth as default)
        const growthElement = document.getElementById('growth-rate');
        if (growthElement && data.revenue) {
            const currentRevenue = data.revenue.total || 0;
            const previousRevenue = data.revenue.previousTotal || 0;
            const growth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : 0;
            
            growthElement.textContent = `${growth >= 0 ? '+' : ''}${growth}%`;
            
            // Update growth indicator color
            const changeElement = growthElement.parentElement.querySelector('.metric-change');
            if (changeElement) {
                const changeClass = growth >= 0 ? 'positive' : 'negative';
                changeElement.className = `metric-change ${changeClass}`;
            }
        }
    }

    showNotification(message, type) {
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">×</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#DC2626' : type === 'info' ? '#3B82F6' : '#059669'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;

        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);

        // Add to page
        document.body.appendChild(notification);
    }

    destroy() {
        // Clean up charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        // Stop auto-refresh
        this.stopAutoRefresh();
        
        // Clean up real-time subscriptions
        this.realtimeSubscriptions.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.realtimeSubscriptions = [];
        
        // Clear charts object
        this.charts = {};
    }
}

// DashboardManager is initialized by app.js when needed