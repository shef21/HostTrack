// API Service Layer for HostTrack Frontend
class APIService {
    constructor() {
        // Determine API base URL based on environment
        this.baseURL = this.getAPIBaseURL();
        this.token = null;
        this.isAuthenticatedFlag = false;
        
        console.log('🔧 API Service initialized with base URL:', this.baseURL);
    }

    getAPIBaseURL() {
        if (window.location.hostname.includes('vercel.app') ||
            window.location.hostname.includes('hosttrack') ||
            window.location.hostname !== 'localhost') {
            
            // Production: Use relative URLs to work with existing backend
            // This will use whatever backend your HostTrack site is already configured to use
            const productionURL = '';
            
            console.log('🚀 Production environment detected, using relative URLs');
            return productionURL;
        } else {
            // Development: Use local backend
            const localURL = 'http://localhost:3001';
            console.log('🔧 Development environment detected, using:', localURL);
            return localURL;
        }
    }

    // Set authentication token and user
    setAuth(token, user) {
        console.log('🔐 === API SERVICE SET AUTH DEBUG ===');
        console.log('⏰ setAuth() called at:', new Date().toISOString());
        console.log('🔑 Token provided:', token ? 'Yes' : 'No');
        console.log('👤 User provided:', user ? 'Yes' : 'No');
        console.log('👤 User ID:', user?.id);
        console.log('📧 User email:', user?.email);
        
        this.token = token;
        this.user = user;
        
        console.log('✅ Auth data stored in API service');
        console.log('🔑 Stored token present:', !!this.token);
        console.log('👤 Stored user present:', !!this.user);
        console.log('🔐 === API SERVICE SET AUTH DEBUG END ===');
    }

    // Clear authentication
    clearAuth() {
        this.token = null;
        this.user = null;
    }

    // Make API request with authentication
    async request(endpoint, options = {}) {
        // Ensure endpoint starts with /api if not already present
        const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
        const url = `${this.baseURL}${apiEndpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers
            },
            ...options
        };

        console.log('=== API REQUEST DEBUG ===');
        console.log('Request URL:', url);
        console.log('Request method:', config.method || 'GET');
        console.log('Request headers:', config.headers);
        console.log('Request body:', config.body);
        console.log('Authentication token present:', !!this.token);
        console.log('User authenticated:', !!this.user);
        console.log('Current user ID:', this.user?.id);
        console.log('Full request config:', config);

        try {
            const response = await fetch(url, config);
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (!response.ok) {
                console.log('Request failed with status:', response.status);
                console.log('Error data:', data);
                if (response.status === 401) {
                    this.clearAuth();
                    window.location.href = '/';
                    throw new Error('Authentication failed');
                }
                // For dependency errors (409), include the full error data
                if (response.status === 409) {
                    const errorMessage = JSON.stringify(data);
                    throw new Error(errorMessage);
                }
                throw new Error(data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ===== AUTHENTICATION METHODS =====

    async register(email, password, name, phone) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name, phone })
        });
        return data;
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.setAuth(data.session.access_token, data.user);
        return data;
    }

    async getCurrentUser() {
        const data = await this.request('/auth/me');
        this.user = data.user;
        return data;
    }

    async updateProfile(profileData) {
        const data = await this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
        this.user = data.user;
        return data;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuth();
        }
    }

    // ===== PROPERTIES METHODS =====

    async getProperties() {
        console.log('=== GET PROPERTIES API CALL ===');
        console.log('Current user:', this.user);
        console.log('User ID:', this.user?.id);
        console.log('Token present:', !!this.token);
        
        const result = await this.request('/properties');
        console.log('Properties API result:', result);
        return result;
    }

    async getProperty(id) {
        return await this.request(`/properties/${id}`);
    }

    async createProperty(propertyData) {
        return await this.request('/properties', {
            method: 'POST',
            body: JSON.stringify(propertyData)
        });
    }

    async updateProperty(id, propertyData) {
        return await this.request(`/properties/${id}`, {
            method: 'PUT',
            body: JSON.stringify(propertyData)
        });
    }

    async deleteProperty(id) {
        return await this.request(`/properties/${id}`, {
            method: 'DELETE'
        });
    }

    async forceDeleteProperty(id) {
        return await this.request(`/properties/${id}/force`, {
            method: 'DELETE'
        });
    }

    async updatePropertyImages(id, images) {
        return await this.request(`/properties/${id}/images`, {
            method: 'PUT',
            body: JSON.stringify({ images })
        });
    }

    // ===== SERVICES METHODS =====

    async getServices() {
        console.log('=== GET SERVICES API CALL ===');
        console.log('Current user:', this.user);
        console.log('User ID:', this.user?.id);
        console.log('Token present:', !!this.token);
        
        const result = await this.request('/services');
        console.log('Services API result:', result);
        return result;
    }

    async getServicesByCategory(category) {
        return await this.request(`/services/category/${category}`);
    }

    async getUpcomingServices(days = 30) {
        return await this.request(`/services/upcoming/${days}`);
    }

    async createService(serviceData) {
        console.log('=== API CREATE SERVICE DEBUG ===');
        console.log('createService called with:', serviceData);
        console.log('serviceData type:', typeof serviceData);
        console.log('serviceData keys:', Object.keys(serviceData));
        console.log('JSON.stringify(serviceData):', JSON.stringify(serviceData));
        
        const result = await this.request('/services', {
            method: 'POST',
            body: JSON.stringify(serviceData)
        });
        
        console.log('createService result:', result);
        return result;
    }

    async updateService(id, serviceData) {
        return await this.request(`/services/${id}`, {
            method: 'PUT',
            body: JSON.stringify(serviceData)
        });
    }

    async deleteService(id) {
        return await this.request(`/services/${id}`, {
            method: 'DELETE'
        });
    }

    async bulkUpdateServices(serviceIds, updates) {
        return await this.request('/services/bulk/update', {
            method: 'PUT',
            body: JSON.stringify({ serviceIds, updates })
        });
    }

    // ===== BOOKINGS METHODS =====

    async getBookings(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/bookings?${params}`);
    }

    async getBookingStats(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/bookings/stats?${params}`);
    }

    async createBooking(bookingData) {
        return await this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    }

    async updateBooking(id, bookingData) {
        return await this.request(`/bookings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(bookingData)
        });
    }

    async deleteBooking(id) {
        return await this.request(`/bookings/${id}`, {
            method: 'DELETE'
        });
    }

    // ===== EXPENSES METHODS =====

    async getExpenses(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/expenses?${params}`);
    }

    async getExpenseStats(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/expenses/stats?${params}`);
    }

    async createExpense(expenseData) {
        return await this.request('/expenses', {
            method: 'POST',
            body: JSON.stringify(expenseData)
        });
    }

    async updateExpense(id, expenseData) {
        return await this.request(`/expenses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(expenseData)
        });
    }

    async deleteExpense(id) {
        return await this.request(`/expenses/${id}`, {
            method: 'DELETE'
        });
    }

    async uploadExpenseReceipt(id, receiptUrl) {
        return await this.request(`/expenses/${id}/receipt`, {
            method: 'PUT',
            body: JSON.stringify({ receipt: receiptUrl })
        });
    }

    // ===== ANALYTICS METHODS =====

    async getDashboardStats(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/analytics/dashboard?${params}`);
    }

    async getRevenueAnalytics(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/analytics/revenue?${params}`);
    }

    async getOccupancyAnalytics(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/analytics/occupancy?${params}`);
    }

    async getExpenseAnalytics(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/analytics/expenses?${params}`);
    }

    // ===== UTILITY METHODS =====

    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    getCurrentUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }

    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Initialize API service globally
window.apiService = new APIService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIService;
} 