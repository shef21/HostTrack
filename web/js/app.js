// ===== MAIN APPLICATION JAVASCRIPT =====

// Global initialization flag to prevent multiple initializations
window.appInitialized = false;

class HostTrackApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.user = null;
        this.dataLoaded = false;
        this.loadingData = false; // Add flag to prevent infinite loops
        
        // Initialize only once
        if (!window.appInitialized) {
            this.init();
        }
    }

    async init() {
        if (window.appInitialized) {
            console.log('App already initialized, skipping...');
            return;
        }
        
        console.log('Initializing HostTrackApp...');
        
        try {
            // Clear any cached sample data from localStorage
            this.clearCachedData();
            
            // Set up event listeners first
            this.setupEventListeners();
            
            // Initialize managers only once
            this.initializeManagers();
            
            // Check authentication and show appropriate screen
            const authResult = await this.checkAuth();
            console.log('Auth check result:', authResult);
            
            window.appInitialized = true;
            console.log('HostTrackApp initialized successfully');
        } catch (error) {
            console.error('Error initializing HostTrackApp:', error);
            // Show auth screen on error
            this.showAuth();
        }
    }

    // Clear any cached sample data from localStorage
    clearCachedData() {
        try {
            console.log('Clearing cached data from localStorage...');
            const keysToRemove = [
                'hosttrack_properties',
                'hosttrack_services', 
                'hosttrack_bookings',
                'hosttrack_expenses',
                'hosttrack_analytics'
            ];
            
            keysToRemove.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log(`Removed cached data: ${key}`);
                }
            });
            
            console.log('Cached data cleared successfully');
        } catch (error) {
            console.error('Error clearing cached data:', error);
        }
    }

    initializeManagers() {
        // Initialize managers only once
        if (!window.propertiesManager) {
            window.propertiesManager = new PropertiesManager();
        }
        if (!window.servicesManager) {
            window.servicesManager = new ServicesManager();
        }
        // Initialize AuthManager for handling login/register forms
        if (!window.authManager) {
            window.authManager = new AuthManager();
        }
        // Initialize ChartsManager for dashboard charts
        if (!window.chartsManager) {
            window.chartsManager = new ChartsManager();
        }
        // Phase3DashboardManager will be initialized after user authentication
    }

    setupEventListeners() {
        // Mobile navigation toggle
        const mobileNavToggle = document.getElementById('mobile-nav-toggle');
        const mainNav = document.getElementById('main-nav');
        
        if (mobileNavToggle && mainNav) {
            mobileNavToggle.addEventListener('click', () => {
                mainNav.classList.toggle('mobile-open');
                // Change icon based on state
                mobileNavToggle.textContent = mainNav.classList.contains('mobile-open') ? '✕' : '☰';
            });
            
            // Close mobile nav when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileNavToggle.contains(e.target) && !mainNav.contains(e.target)) {
                    mainNav.classList.remove('mobile-open');
                    mobileNavToggle.textContent = '☰';
                }
            });
        }
        
        // Navigation event listeners
        const navLinks = document.querySelectorAll('.nav-button[data-page]');
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = link.getAttribute('data-page');
                    this.navigateToPage(page);
                });
            });

            // User menu toggle
        const userMenuButton = document.querySelector('.user-menu-button');
        if (userMenuButton) {
            userMenuButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('User menu button clicked!');
                this.toggleUserMenu();
            });
            console.log('User menu button event listener attached');
        } else {
            console.warn('User menu button not found during setup');
        }

            // Close modals when clicking outside
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    this.closeModal(e.target.closest('.modal').id);
                }
            });
            
        // Close user menu when clicking outside
        document.addEventListener('click', (e) => {
            const userMenu = document.querySelector('.user-menu');
            const userMenuButton = document.querySelector('.user-menu-button');
            
            if (userMenu && !userMenu.classList.contains('hidden') && 
                !userMenu.contains(e.target) && 
                !userMenuButton.contains(e.target)) {
                userMenu.classList.add('hidden');
            }
        });

        // Profile form submission
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile();
            });
        }
    }

    async checkAuth() {
        try {
            console.log('Checking authentication with backend...');
            
            // Always try to get current user from backend
            try {
                const response = await apiService.getCurrentUser();
                console.log('Authentication successful:', response);
                this.user = response.user;
                
                // User authenticated successfully
                
                this.showApp();
                this.updateUserInfo();
                return true;
            } catch (authError) {
                console.log('No valid session found');
                
                this.showAuth();
                return false;
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.showAuth();
            return false;
        }
    }

    navigateToPage(page) {
        if (this.currentPage === page) return;
        
        console.log(`Navigating to page: ${page}`);
        this.currentPage = page;
        
        // Update active navigation
        document.querySelectorAll('.nav-button').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
        
        // Show/hide page content using CSS classes
        document.querySelectorAll('.page').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${page}-page`)?.classList.add('active');
        
        // Load page-specific data
        this.loadPageData();
    }

    loadPageData() {
        console.log(`Loading data for page: ${this.currentPage}`);
        
        // Only load data for the specific page being navigated to
        // Don't load data for other pages during navigation
        switch (this.currentPage) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'properties':
                this.loadPropertiesData();
                break;
            case 'services':
                this.loadServicesData();
                break;
            case 'bookings':
                this.loadBookingsData();
                break;
            case 'expenses':
                this.loadExpensesData();
                break;
            case 'analytics':
                this.loadAnalyticsData();
                break;
            default:
                console.log(`Unknown page: ${this.currentPage}, skipping data load`);
        }
    }

    loadDashboardData() {
        console.log('=== APP DEBUG: loadDashboardData() called ===');
        
        // Initialize dashboard manager if needed
        if (!window.dashboardManager) {
            window.dashboardManager = new DashboardManager();
        }
        
        // Load dashboard data from API
        if (window.apiService && window.apiService.isAuthenticated()) {
            console.log('Loading dashboard data from API...');
            this.loadDashboardMetrics();
        } else {
            console.log('User not authenticated, skipping dashboard data load');
        }
    }

    async loadDashboardMetrics() {
        try {
            console.log('Fetching dashboard metrics...');
            
            // Get dashboard stats from API
            const dashboardData = await window.apiService.getDashboardStats();
            console.log('Dashboard data received:', dashboardData);
            
            // Update dashboard UI with real data
            this.updateDashboardUI(dashboardData);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Show error state but don't crash
            this.showDashboardError();
        }
    }

    updateDashboardUI(data) {
        // Use the enhanced dashboard manager to update metrics and charts
        if (window.dashboardManager && window.dashboardManager.updateEnhancedMetrics) {
            window.dashboardManager.updateEnhancedMetrics(data);
        } else {
            // Fallback to basic updates if dashboard manager isn't available
            this.updateBasicDashboardUI(data);
        }
    }

    updateBasicDashboardUI(data) {
        // Update total properties
        const propertiesElement = document.getElementById('total-properties');
        if (propertiesElement && data.properties) {
            propertiesElement.textContent = data.properties.total || 0;
        }
        
        // Update total bookings
        const bookingsElement = document.getElementById('total-bookings');
        if (bookingsElement && data.bookings) {
            bookingsElement.textContent = data.bookings.total || 0;
        }
        
        // Update total revenue
        const revenueElement = document.getElementById('total-revenue');
        if (revenueElement && data.overview) {
            revenueElement.textContent = `R${(data.overview.totalRevenue || 0).toLocaleString()}`;
        }
        
        // Update occupancy rate
        const occupancyElement = document.getElementById('occupancy-rate');
        if (occupancyElement && data.overview) {
            const rate = data.overview.occupancyRate || 0;
            occupancyElement.textContent = `${rate}%`;
        }
    }

    showDashboardError() {
        console.log('Showing dashboard error state');
        // Don't crash the app, just show a subtle error indicator
        const dashboard = document.querySelector('.dashboard-content');
        if (dashboard) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'dashboard-error';
            errorDiv.innerHTML = `
                <div class="error-message">
                    <span>⚠️ Dashboard data temporarily unavailable</span>
                    <button onclick="window.hostTrackApp.loadDashboardData()">Retry</button>
                </div>
            `;
            errorDiv.style.cssText = `
                background: #FEF2F2;
                border: 1px solid #FECACA;
                color: #DC2626;
                padding: 12px;
                border-radius: 8px;
                margin: 16px 0;
                text-align: center;
            `;
            
            // Insert at the top of dashboard
            dashboard.insertBefore(errorDiv, dashboard.firstChild);
        }
    }

    loadPropertiesData() {
        // Initialize PropertiesManager if it doesn't exist
        if (!window.propertiesManager) {
            window.propertiesManager = new PropertiesManager();
        }
        // Initialize the properties manager
        window.propertiesManager.init();
        
        // Load properties data when navigating to properties page
        if (window.propertiesManager && window.apiService && window.apiService.isAuthenticated()) {
            console.log('Loading properties data for properties page...');
            window.propertiesManager.loadPropertiesData(true);
        } else {
            console.log('Properties manager initialized, data will load on navigation');
        }
    }

    loadServicesData() {
        console.log('Loading services data...');
        console.log('ServicesManager class available:', typeof ServicesManager);
        
        // Initialize ServicesManager if it doesn't exist
        if (!window.servicesManager) {
            console.log('Creating new ServicesManager instance...');
            window.servicesManager = new ServicesManager();
        }
        
        // Initialize the services manager
        console.log('Initializing services manager...');
        window.servicesManager.init();
        
        // Load services data when navigating to services page
        if (window.servicesManager && window.apiService && window.apiService.isAuthenticated()) {
            console.log('Loading services data for services page...');
            window.servicesManager.onPageLoad();
        } else {
            console.log('Services manager initialized, data will load on navigation');
        }
    }

    loadBookingsData() {
        console.log('Loading bookings data...');
        console.log('BookingsManager class available:', typeof BookingsManager);
        
        // Initialize BookingsManager if it doesn't exist
        if (!window.bookingsManager) {
            console.log('Creating new BookingsManager instance...');
            window.bookingsManager = new BookingsManager();
        }
        
        // Only initialize if not already initialized and not currently initializing
        if (window.bookingsManager && !window.bookingsManager.initialized && !window.bookingsManager.initializing) {
            console.log('Initializing BookingsManager...');
            window.bookingsManager.init();
        } else if (window.bookingsManager && window.bookingsManager.initialized) {
            console.log('BookingsManager already initialized, skipping...');
        } else if (window.bookingsManager && window.bookingsManager.initializing) {
            console.log('BookingsManager currently initializing, skipping...');
        }
        
        // Load bookings data when navigating to bookings page
        if (window.bookingsManager && window.apiService && window.apiService.isAuthenticated()) {
            console.log('Loading bookings data for bookings page...');
            window.bookingsManager.loadBookingsData(true);
        } else {
            console.log('BookingsManager ready, data will load on navigation');
        }
    }

    loadExpensesData() {
        // Initialize expenses manager if needed
        if (!window.expensesManager) {
            window.expensesManager = new ExpensesManager();
        }
        
        // Load expenses data when navigating to expenses page
        if (window.expensesManager && window.apiService && window.apiService.isAuthenticated()) {
            console.log('Loading expenses data for expenses page...');
            window.expensesManager.loadExpensesData(true);
        } else {
            console.log('Expenses manager initialized, data will load on navigation');
        }
    }

    loadAnalyticsData() {
        console.log('=== APP DEBUG: loadAnalyticsData() called ===');
        
        // Initialize analytics manager if needed
        if (!window.analyticsManager) {
            console.log('Creating new AnalyticsManager instance...');
            window.analyticsManager = new AnalyticsManager();
        }
        
        // Call onPageLoad to ensure proper initialization and data loading
        if (window.analyticsManager) {
            console.log('Calling analytics manager onPageLoad...');
            window.analyticsManager.onPageLoad();
        }
        
        console.log('Analytics manager initialized. Real data will load automatically.');
    }

    updateUserInfo() {
        console.log('=== UPDATE USER INFO DEBUG ===');
        
        // Get user data from the app instance
        let userData = this.user;
        
        // If no user data in app instance, try to get from API service
        if (!userData && apiService.user) {
            userData = apiService.user;
            this.user = userData; // Update the instance variable
            console.log('Retrieved user data from API service:', userData);
        }
        
        console.log('Final user data:', userData);
        console.log('User name:', userData?.name);
        console.log('User email:', userData?.email);
        
        if (!userData) {
            console.log('No user data available from any source');
            return;
        }
        
        const userNameElement = document.querySelector('.user-name');
        const userAvatarElement = document.querySelector('.user-avatar');
        
        console.log('userNameElement found:', !!userNameElement);
        console.log('userAvatarElement found:', !!userAvatarElement);
        
        if (userNameElement) {
            const displayName = userData.name || userData.email || 'User';
            console.log('Setting user name to:', displayName);
            userNameElement.textContent = displayName;
        }
        
        if (userAvatarElement) {
            const initials = this.getInitials(userData.name || userData.email);
            console.log('Setting user initials to:', initials);
            userAvatarElement.textContent = initials;
        }
    }

    getInitials(name) {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    toggleUserMenu() {
        console.log('=== TOGGLE USER MENU DEBUG ===');
        const userMenu = document.querySelector('.user-menu');
        const userMenuButton = document.querySelector('.user-menu-button');
        
        console.log('User menu element found:', !!userMenu);
        console.log('User menu button found:', !!userMenuButton);
        
        if (userMenu) {
            const isHidden = userMenu.classList.contains('hidden');
            console.log('Menu is currently hidden:', isHidden);
            console.log('Menu element:', userMenu);
            console.log('Menu classes:', userMenu.className);
            
            // Toggle the menu
            userMenu.classList.toggle('hidden');
            
            // Add visual feedback to button if needed
            if (userMenuButton) {
                userMenuButton.classList.toggle('active');
            }
            
            const isHiddenAfter = userMenu.classList.contains('hidden');
            console.log('Menu hidden after toggle:', isHiddenAfter);
            console.log('Menu classes after toggle:', userMenu.className);
        } else {
            console.error('User menu element not found');
        }
    }

    openProfileModal() {
        this.populateProfileForm();
        this.openModal('profile-modal');
    }

    populateProfileForm() {
        if (!this.user) return;
        
        const nameInput = document.getElementById('profile-name');
        const emailInput = document.getElementById('profile-email');
        const phoneInput = document.getElementById('profile-phone');
        
        if (nameInput) nameInput.value = this.user.name || '';
        if (emailInput) emailInput.value = this.user.email || '';
        if (phoneInput) phoneInput.value = this.user.phone || '';
    }

    async updateProfile() {
        if (!this.user) return;
        
        const nameInput = document.getElementById('profile-name');
        const phoneInput = document.getElementById('profile-phone');
        
        const updatedData = {
            name: nameInput?.value || this.user.name,
            phone: phoneInput?.value || this.user.phone
        };
        
        try {
            const response = await apiService.updateProfile(updatedData);
            this.user = response.user;
            
            // Profile updated successfully
            
            // Update UI
            this.updateUserInfo();
            this.closeModal('profile-modal');
            
            // Show success message
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            // Removed overflow hidden to prevent scroll issues
            console.log('Modal opened:', modalId);
        } else {
            console.error('Modal not found:', modalId);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            // Removed overflow restoration since we're not setting it anymore
            console.log('Modal closed:', modalId);
        } else {
            console.error('Modal not found:', modalId);
        }
    }

    logout() {
        apiService.clearAuth();
        this.user = null;
        this.updateUserInfo();
        this.showAuth();
    }

    showApp() {
        console.log('🏠 === SHOW APP DEBUG START ===');
        console.log('⏰ showApp() called at:', new Date().toISOString());
        console.log('👤 Current user:', this.user);
        console.log('📊 Data loaded flag:', this.dataLoaded);
        console.log('🔄 Loading data flag:', this.loadingData);
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            console.log('✅ Found loading screen, hiding it...');
            loadingScreen.style.display = 'none';
            console.log('✅ Loading screen hidden');
        } else {
            console.log('⚠️ Loading screen not found');
        }
        
        // Hide auth screen
        const authScreen = document.getElementById('auth-screen');
        if (authScreen) {
            console.log('✅ Found auth screen, hiding it...');
            authScreen.style.display = 'none';
            authScreen.classList.add('hidden');
            console.log('✅ Auth screen hidden');
        } else {
            console.log('⚠️ Auth screen not found');
        }
        
        // Show main app
        const app = document.getElementById('app');
        if (app) {
            console.log('✅ Found main app container, showing it...');
            app.style.display = 'flex';
            app.classList.remove('hidden');
            app.style.visibility = 'visible';
            console.log('✅ Main app container shown');
        } else {
            console.error('❌ Main app container not found!');
        }
        
        // Update user information immediately
        console.log('👤 Updating user information...');
        this.updateUserInfo();
        console.log('✅ User information updated');
        
        // Load initial data only if not already loaded and not currently loading
        if (!this.dataLoaded && !this.loadingData) {
            console.log('📊 === LOADING INITIAL DATA ===');
            console.log('🔄 Setting loading data flag to true...');
            this.loadingData = true;
            
            // Only load dashboard data initially, let other managers handle their own data
            console.log('📈 Loading dashboard data...');
            this.loadDashboardData();
            
            // Initialize Phase3DashboardManager after user authentication
            if (!window.phase3Dashboard) {
                console.log('🚀 Initializing Phase3DashboardManager after authentication...');
                window.phase3Dashboard = new Phase3DashboardManager();
                console.log('✅ Phase3DashboardManager initialized:', window.phase3Dashboard);
            }
            
            this.dataLoaded = true;
            this.loadingData = false;
            console.log('✅ Initial data loading completed');
        } else {
            console.log('ℹ️ Skipping initial data load:');
            console.log('   - Data already loaded:', this.dataLoaded);
            console.log('   - Currently loading:', this.loadingData);
        }
        
        console.log('🏠 App should now be visible');
        console.log('🏠 === SHOW APP DEBUG END ===');
    }

    showLoadingIndicator(message = 'Loading your data...') {
        // Create or update loading indicator
        let loadingIndicator = document.getElementById('data-loading-indicator');
        if (!loadingIndicator) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'data-loading-indicator';
            loadingIndicator.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px 30px;
                border-radius: 10px;
                z-index: 10000;
                font-size: 16px;
                font-weight: 500;
            `;
            document.body.appendChild(loadingIndicator);
        }
        loadingIndicator.textContent = message;
        loadingIndicator.style.display = 'block';
    }

    hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('data-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }

    // Global function to refresh all property dropdowns across the application
    async refreshAllPropertyDropdowns() {
        console.log('🔄 Refreshing all property dropdowns...');
        
        try {
            // Refresh services form property dropdown
            if (window.servicesManager) {
                await window.servicesManager.refreshPropertyDropdown();
            }
            
            // Refresh bookings form property dropdown
            if (window.bookingsManager) {
                await window.bookingsManager.refreshPropertyDropdown();
            }
            
            // Refresh any other forms that have property dropdowns
            // (expenses, analytics, etc. when they're implemented)
            
            console.log('✅ All property dropdowns refreshed successfully');
        } catch (error) {
            console.error('❌ Error refreshing property dropdowns:', error);
        }
    }

    showAuth() {
        console.log('Showing auth screen...');
        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Hide main app
        const app = document.getElementById('app');
        if (app) {
            app.style.display = 'none';
            app.classList.add('hidden');
        }
        
        // Show auth screen
        const authScreen = document.getElementById('auth-screen');
        if (authScreen) {
            authScreen.style.display = 'block';
            authScreen.classList.remove('hidden');
        }
    }

    getAuthToken() {
        // Try to get token from API service first
        if (window.apiService && window.apiService.token) {
            console.log('🔍 App: Found token in API service');
            return window.apiService.token;
        }
        
        // Fallback to user session if available
        if (this.user && this.user.session && this.user.session.access_token) {
            console.log('🔍 App: Found token in user session');
            return this.user.session.access_token;
        }
        
        console.log('🔍 App: No token found');
        return null;
    }
}

// Global functions for HTML onclick handlers
window.hostTrackApp = null;
window.openModal = (modalId) => window.hostTrackApp?.openModal(modalId);
window.closeModal = (modalId) => window.hostTrackApp?.closeModal(modalId);
window.toggleUserMenu = () => window.hostTrackApp?.toggleUserMenu();
window.logout = () => window.hostTrackApp?.logout();
window.openProfileModal = () => window.hostTrackApp?.openProfileModal();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    if (!window.hostTrackApp) {
        window.hostTrackApp = new HostTrackApp();
    }
    
    // Fallback: If app doesn't initialize properly, show auth screen after 2 seconds
    setTimeout(() => {
        const app = document.getElementById('app');
        const authScreen = document.getElementById('auth-screen');
        
        if (app && authScreen) {
            const appVisible = !app.classList.contains('hidden') && app.style.display !== 'none';
            const authVisible = !authScreen.classList.contains('hidden') && authScreen.style.display !== 'none';
            
            console.log('Fallback check - App visible:', appVisible, 'Auth visible:', authVisible);
            
            if (!appVisible && !authVisible) {
                console.log('Neither app nor auth visible, showing auth screen');
                window.hostTrackApp?.showAuth();
            }
        }
    }, 2000);
});

// Force update user info (for debugging)
window.forceUpdateUserInfo = () => {
    console.log('=== FORCE UPDATE USER INFO ===');
    console.log('Current user data:', window.hostTrackApp?.user);
    console.log('API service user:', apiService.user);
    console.log('API service token:', apiService.token ? 'Present' : 'None');
    
    if (window.hostTrackApp) {
        window.hostTrackApp.updateUserInfo();
    }
};

// Debug function to check data ownership
window.debugDataOwnership = async () => {
    console.log('=== DEBUG DATA OWNERSHIP ===');
    console.log('Current user:', apiService.user);
    console.log('User ID:', apiService.user?.id);
    
    try {
        // Check properties ownership
        console.log('Checking properties ownership...');
        const propertiesResponse = await apiService.getProperties();
        console.log('Properties response:', propertiesResponse);
        console.log('Properties count:', propertiesResponse.length || 0);
        
        if (propertiesResponse.length > 0) {
            console.log('Properties owner IDs:', propertiesResponse.map(p => p.owner_id));
        }
        
        // Check services ownership
        console.log('Checking services ownership...');
        const servicesResponse = await apiService.getServices();
        console.log('Services response:', servicesResponse);
        console.log('Services count:', servicesResponse.length || 0);
        
        if (servicesResponse.length > 0) {
            console.log('Services owner IDs:', servicesResponse.map(s => s.owner_id));
        }
        
        console.log('=== DATA OWNERSHIP CHECK COMPLETE ===');
    } catch (error) {
        console.error('Error checking data ownership:', error);
    }
};

// Force reload all data
window.forceReloadAllData = async () => {
    console.log('=== FORCE RELOAD ALL DATA ===');
    
    // Prevent multiple simultaneous reloads
    if (window.hostTrackApp && window.hostTrackApp.loadingData) {
        console.log('Data loading already in progress, skipping...');
        return;
    }
    
    if (window.hostTrackApp) {
        window.hostTrackApp.loadingData = true;
    }
    
    try {
        // Reload properties (only if not already loading)
        if (window.propertiesManager && !window.propertiesManager.initializing) {
            console.log('Force reloading properties...');
            window.propertiesManager.dataLoaded = false;
            await window.propertiesManager.loadPropertiesData(true);
        } else {
            console.log('Properties manager already loading, skipping...');
        }
        
        // Reload services (only if not already loading)
        if (window.servicesManager && !window.servicesManager.initializing) {
            console.log('Force reloading services...');
            window.servicesManager.dataLoaded = false;
            await window.servicesManager.loadServicesData(true);
        } else {
            console.log('Services manager already loading, skipping...');
        }
        
        // Reload bookings (only if not already loading)
        if (window.bookingsManager && !window.bookingsManager.initializing) {
            console.log('Force reloading bookings...');
            window.bookingsManager.initialized = false;
            await window.bookingsManager.init();
        } else {
            console.log('Bookings manager already loading, skipping...');
        }
        
        console.log('All data reloaded successfully');
    } catch (error) {
        console.error('Error reloading data:', error);
    } finally {
        if (window.hostTrackApp) {
            window.hostTrackApp.loadingData = false;
        }
    }
};

// Check current authentication status
window.checkAuthStatus = () => {
    console.log('=== AUTHENTICATION STATUS ===');
    console.log('API Service authenticated:', apiService.isAuthenticated());
    console.log('Current user:', apiService.getCurrentUser());
    console.log('User ID:', apiService.getCurrentUser()?.id);
    console.log('Token present:', !!apiService.getToken());
    console.log('App user:', window.hostTrackApp?.currentUser);
    console.log('=============================');
    
    return {
        authenticated: apiService.isAuthenticated(),
        user: apiService.getCurrentUser(),
        token: apiService.getToken()
    };
};

// Check loading status of all managers
window.checkLoadingStatus = () => {
    console.log('=== LOADING STATUS CHECK ===');
    console.log('App loading data:', window.hostTrackApp?.loadingData);
    console.log('App data loaded:', window.hostTrackApp?.dataLoaded);
    
    if (window.propertiesManager) {
        console.log('Properties manager:');
        console.log('- Initialized:', window.propertiesManager.initialized);
        console.log('- Initializing:', window.propertiesManager.initializing);
        console.log('- Data loaded:', window.propertiesManager.dataLoaded);
    }
    
    if (window.servicesManager) {
        console.log('Services manager:');
        console.log('- Initialized:', window.servicesManager.initialized);
        console.log('- Initializing:', window.servicesManager.initializing);
        console.log('- Data loaded:', window.servicesManager.dataLoaded);
    }
    
    if (window.bookingsManager) {
        console.log('Bookings manager:');
        console.log('- Initialized:', window.bookingsManager.initialized);
        console.log('- Initializing:', window.bookingsManager.initializing);
    }
    
    console.log('=============================');
};

// Manual data reload with loading indicator
window.reloadDataWithIndicator = async () => {
    console.log('=== MANUAL DATA RELOAD ===');
    
    if (!window.hostTrackApp) {
        console.error('App not initialized');
        return;
    }
    
    // Check if already loading
    if (window.hostTrackApp.loadingData) {
        console.log('Data loading already in progress, skipping manual reload');
        return;
    }
    
    try {
        window.hostTrackApp.showLoadingIndicator('Reloading your data...');
        
        await window.forceReloadAllData();
        
        window.hostTrackApp.hideLoadingIndicator();
        console.log('Manual data reload completed');
    } catch (error) {
        console.error('Manual data reload failed:', error);
        window.hostTrackApp.hideLoadingIndicator();
    }
};

// Force show app (for debugging)
window.forceShowApp = () => {
    const app = document.getElementById('app');
    const authScreen = document.getElementById('auth-screen');
    
    if (app) {
        app.style.display = 'flex';
        app.classList.remove('hidden');
        app.style.visibility = 'visible';
    }
    
    if (authScreen) {
        authScreen.style.display = 'none';
        authScreen.classList.add('hidden');
    }
    
    console.log('App forced to show');
};

// Test user menu functionality
window.testUserMenu = () => {
    console.log('=== TEST USER MENU ===');
    const userMenu = document.querySelector('.user-menu');
    const userMenuButton = document.querySelector('.user-menu-button');
    
    console.log('User menu element:', userMenu);
    console.log('User menu button:', userMenuButton);
    console.log('User menu hidden:', userMenu?.classList.contains('hidden'));
    
    if (userMenu) {
        userMenu.classList.toggle('hidden');
        console.log('User menu hidden after toggle:', userMenu.classList.contains('hidden'));
    }
}; 