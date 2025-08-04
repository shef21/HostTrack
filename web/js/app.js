// ===== MAIN APP JAVASCRIPT =====

class HostTrackApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
        this.loadSampleData();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateToPage(page);
            });
        });

        // User menu
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', () => {
                userDropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.add('hidden');
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal(btn.closest('.modal').id);
            });
        });

        // Modal overlay
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeAllModals();
                }
            });
        }

        // Add property button
        const addPropertyBtn = document.getElementById('add-property-btn');
        if (addPropertyBtn) {
            addPropertyBtn.addEventListener('click', () => {
                this.openModal('add-property-modal');
            });
        }

        // Add booking button
        const addBookingBtn = document.getElementById('add-booking-btn');
        if (addBookingBtn) {
            addBookingBtn.addEventListener('click', () => {
                this.openModal('add-booking-modal');
            });
        }

        // Form submissions
        this.setupFormSubmissions();
    }

    setupFormSubmissions() {
        // Add property form
        const addPropertyForm = document.getElementById('add-property-form');
        if (addPropertyForm) {
            addPropertyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addProperty();
            });
        }

        // Add booking form
        const addBookingForm = document.getElementById('add-booking-form');
        if (addBookingForm) {
            addBookingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addBooking();
            });
        }

        // Cancel buttons
        document.getElementById('cancel-property')?.addEventListener('click', () => {
            this.closeModal('add-property-modal');
        });

        document.getElementById('cancel-booking')?.addEventListener('click', () => {
            this.closeModal('add-booking-modal');
        });
    }

    checkAuth() {
        // Check if user is logged in (stored in localStorage)
        const user = localStorage.getItem('hosttrack_user');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.showApp();
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }

    showApp() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        
        this.updateUserInfo();
        this.navigateToPage('dashboard');
    }

    updateUserInfo() {
        if (this.currentUser) {
            const initials = this.currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
            document.getElementById('user-initials').textContent = initials;
            document.getElementById('user-name').textContent = this.currentUser.name;
            document.getElementById('user-email').textContent = this.currentUser.email;
        }
    }

    navigateToPage(page) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Update page content
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(`${page}-page`).classList.add('active');

        // Update page title
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            const titles = {
                dashboard: 'Dashboard',
                properties: 'Properties',
                bookings: 'Bookings',
                analytics: 'Analytics'
            };
            pageTitle.textContent = titles[page] || 'Dashboard';
        }

        this.currentPage = page;
        this.loadPageData(page);
    }

    loadPageData(page) {
        switch (page) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'properties':
                this.loadPropertiesData();
                break;
            case 'bookings':
                this.loadBookingsData();
                break;
            case 'analytics':
                this.loadAnalyticsData();
                break;
        }
    }

    loadSampleData() {
        // Sample data for demonstration
        this.sampleData = {
            properties: [
                {
                    id: 1,
                    name: 'Luxury Cape Town Apartment',
                    location: 'Cape Town, Western Cape',
                    platforms: ['Airbnb', 'Booking.com'],
                    occupancy_rate: 85.5,
                    monthly_revenue: 28500,
                    image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3',
                    is_featured: true,
                    sync_status: 'synced',
                    last_sync: '2 hours ago'
                },
                {
                    id: 2,
                    name: 'Cozy Stellenbosch Cottage',
                    location: 'Stellenbosch, Western Cape',
                    platforms: ['Airbnb', 'Manual'],
                    occupancy_rate: 72.3,
                    monthly_revenue: 18750,
                    image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3',
                    is_featured: false,
                    sync_status: 'synced',
                    last_sync: '1 day ago'
                },
                {
                    id: 3,
                    name: 'Modern Johannesburg Loft',
                    location: 'Johannesburg, Gauteng',
                    platforms: ['Booking.com'],
                    occupancy_rate: 45.8,
                    monthly_revenue: 12300,
                    image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3',
                    is_featured: false,
                    sync_status: 'needs_sync',
                    last_sync: '1 week ago'
                }
            ],
            bookings: [
                {
                    id: 1,
                    guest_name: 'Sarah Johnson',
                    property_name: 'Luxury Cape Town Apartment',
                    check_in: '2024-08-15',
                    check_out: '2024-08-20',
                    platform: 'Airbnb',
                    price: 2500,
                    status: 'Confirmed'
                },
                {
                    id: 2,
                    guest_name: 'Michael Chen',
                    property_name: 'Cozy Stellenbosch Cottage',
                    check_in: '2024-08-22',
                    check_out: '2024-08-25',
                    platform: 'Booking.com',
                    price: 1800,
                    status: 'Pending'
                },
                {
                    id: 3,
                    guest_name: 'Emma Williams',
                    property_name: 'Modern Johannesburg Loft',
                    check_in: '2024-07-10',
                    check_out: '2024-07-15',
                    platform: 'Manual',
                    price: 1200,
                    status: 'Confirmed'
                }
            ]
        };
    }

    loadDashboardData() {
        this.renderUpcomingBookings();
        this.renderMetrics();
        this.initializeCharts();
    }

    loadPropertiesData() {
        this.renderProperties();
    }

    loadBookingsData() {
        this.renderBookingsTable();
    }

    loadAnalyticsData() {
        this.renderPropertyPerformance();
        this.initializeAnalyticsCharts();
    }

    renderUpcomingBookings() {
        const container = document.getElementById('upcoming-bookings');
        if (!container) return;

        const upcomingBookings = this.sampleData.bookings.slice(0, 3);
        
        container.innerHTML = upcomingBookings.map(booking => `
            <div class="booking-item">
                <div class="booking-info">
                    <div class="booking-guest">${booking.guest_name}</div>
                    <div class="booking-details">${booking.property_name} • ${this.formatDate(booking.check_in)}</div>
                </div>
                <span class="booking-status ${booking.status.toLowerCase()}">${booking.status}</span>
            </div>
        `).join('');
    }

    renderMetrics() {
        const totalProperties = this.sampleData.properties.length;
        const totalBookings = this.sampleData.bookings.length;
        const avgOccupancy = this.sampleData.properties.reduce((sum, p) => sum + p.occupancy_rate, 0) / totalProperties;
        const totalRevenue = this.sampleData.properties.reduce((sum, p) => sum + p.monthly_revenue, 0);
        const avgDailyRevenue = Math.round(totalRevenue / 30);

        // Update metric values
        const metricValues = document.querySelectorAll('.metric-value');
        if (metricValues.length >= 4) {
            metricValues[0].textContent = totalProperties;
            metricValues[1].textContent = `${avgOccupancy.toFixed(1)}%`;
            metricValues[2].textContent = totalBookings;
            metricValues[3].textContent = `R${avgDailyRevenue.toLocaleString()}`;
        }
    }

    renderProperties() {
        const container = document.getElementById('properties-grid');
        if (!container) return;

        container.innerHTML = this.sampleData.properties.map(property => `
            <div class="property-card">
                <div class="property-image">
                    <img src="${property.image_url}" alt="${property.name}" onerror="this.style.display='none'">
                    ${property.is_featured ? '<div class="property-badge">Featured</div>' : ''}
                </div>
                <div class="property-content">
                    <h3 class="property-title">${property.name}</h3>
                    <p class="property-location">${property.location}</p>
                    <div class="property-stats">
                        <div class="property-stat">
                            <span class="property-stat-value">${property.occupancy_rate}%</span>
                            <span class="property-stat-label">Occupancy</span>
                        </div>
                        <div class="property-stat">
                            <span class="property-stat-value">R${property.monthly_revenue.toLocaleString()}</span>
                            <span class="property-stat-label">Monthly Revenue</span>
                        </div>
                    </div>
                    <div class="property-platforms">
                        ${property.platforms.map(platform => `<span class="platform-tag">${platform}</span>`).join('')}
                    </div>
                    <div class="property-actions">
                        <button class="btn btn-secondary">Edit</button>
                        <button class="btn btn-text">View Details</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderBookingsTable() {
        const tbody = document.getElementById('bookings-tbody');
        if (!tbody) return;

        tbody.innerHTML = this.sampleData.bookings.map(booking => `
            <tr>
                <td class="booking-guest-cell">${booking.guest_name}</td>
                <td class="booking-property-cell">${booking.property_name}</td>
                <td class="booking-date-cell">${this.formatDate(booking.check_in)}</td>
                <td class="booking-date-cell">${this.formatDate(booking.check_out)}</td>
                <td class="booking-platform-cell">${booking.platform}</td>
                <td class="booking-price-cell">R${booking.price.toLocaleString()}</td>
                <td><span class="booking-status ${booking.status.toLowerCase()}">${booking.status}</span></td>
                <td class="booking-actions-cell">
                    <button class="btn-icon" title="Edit">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                    </button>
                    <button class="btn-icon" title="Delete">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderPropertyPerformance() {
        const container = document.getElementById('property-performance');
        if (!container) return;

        container.innerHTML = this.sampleData.properties.map(property => `
            <div class="performance-item">
                <div class="performance-info">
                    <div class="performance-name">${property.name}</div>
                    <div class="performance-location">${property.location}</div>
                </div>
                <div class="performance-stats">
                    <div class="performance-revenue">R${property.monthly_revenue.toLocaleString()}</div>
                    <div class="performance-occupancy">${property.occupancy_rate}% occupancy</div>
                </div>
                <span class="performance-trend ${property.occupancy_rate > 70 ? 'up' : 'down'}">
                    ${property.occupancy_rate > 70 ? '↗' : '↘'}
                </span>
            </div>
        `).join('');
    }

    initializeCharts() {
        // Revenue chart
        const revenueCtx = document.getElementById('revenue-chart');
        if (revenueCtx) {
            new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue',
                        data: [15000, 18500, 22000, 19500, 25000, 28000],
                        borderColor: '#2563EB',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
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
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        // Platform chart
        const platformCtx = document.getElementById('platform-chart');
        if (platformCtx) {
            new Chart(platformCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Airbnb', 'Booking.com', 'Manual'],
                    datasets: [{
                        data: [52.3, 32.6, 15.1],
                        backgroundColor: ['#2563EB', '#059669', '#D97706'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    initializeAnalyticsCharts() {
        const trendsCtx = document.getElementById('revenue-trends-chart');
        if (trendsCtx) {
            new Chart(trendsCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue',
                        data: [15000, 18500, 22000, 19500, 25000, 28000],
                        backgroundColor: '#2563EB',
                        borderRadius: 4
                    }]
                },
                options: {
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
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    }

    addProperty() {
        const form = document.getElementById('add-property-form');
        const formData = new FormData(form);
        
        const property = {
            id: this.sampleData.properties.length + 1,
            name: formData.get('property-name') || document.getElementById('property-name').value,
            location: formData.get('property-location') || document.getElementById('property-location').value,
            platforms: Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value),
            occupancy_rate: 0,
            monthly_revenue: 0,
            image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3',
            is_featured: false,
            sync_status: 'needs_sync',
            last_sync: 'Just now'
        };

        this.sampleData.properties.push(property);
        this.closeModal('add-property-modal');
        form.reset();
        
        if (this.currentPage === 'properties') {
            this.renderProperties();
        }
        if (this.currentPage === 'dashboard') {
            this.renderMetrics();
        }
    }

    addBooking() {
        const form = document.getElementById('add-booking-form');
        
        const booking = {
            id: this.sampleData.bookings.length + 1,
            guest_name: document.getElementById('booking-guest').value,
            property_name: document.getElementById('booking-property').value,
            check_in: document.getElementById('booking-checkin').value,
            check_out: document.getElementById('booking-checkout').value,
            platform: document.getElementById('booking-platform').value,
            price: parseFloat(document.getElementById('booking-price').value),
            status: 'Confirmed'
        };

        this.sampleData.bookings.push(booking);
        this.closeModal('add-booking-modal');
        form.reset();
        
        if (this.currentPage === 'bookings') {
            this.renderBookingsTable();
        }
        if (this.currentPage === 'dashboard') {
            this.renderUpcomingBookings();
            this.renderMetrics();
        }
    }

    openModal(modalId) {
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.getElementById(modalId).classList.remove('hidden');
    }

    closeModal(modalId) {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.getElementById(modalId).classList.add('hidden');
    }

    closeAllModals() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    logout() {
        localStorage.removeItem('hosttrack_user');
        this.currentUser = null;
        this.showAuth();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hostTrackApp = new HostTrackApp();
}); 