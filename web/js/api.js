// API Service Layer for HostTrack Frontend
class APIService {
    constructor() {
        // Use your working Supabase backend
        this.baseURL = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
        this.token = null;
        this.user = null;
        this.isAuthenticatedFlag = false;
        
        console.log('🔧 API Service initialized with base URL:', this.baseURL);
    }

    // Set authentication token and user
    setAuth(token, user) {
        this.token = token;
        this.user = user;
        this.isAuthenticatedFlag = !!token;
    }

    // Clear authentication
    clearAuth() {
        this.token = null;
        this.user = null;
        this.isAuthenticatedFlag = false;
    }

    // Check if authenticated
    isAuthenticated() {
        return this.isAuthenticatedFlag;
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Get token
    getToken() {
        return this.token;
    }

    // Make API request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                throw new Error(`Request failed: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Health check
    async healthCheck() {
        try {
            await fetch(`${this.baseURL}/health`);
            return true;
        } catch {
            return false;
        }
    }

    // Auth methods
    async login(email, password) {
        return this.request('/auth/v1/token?grant_type=password', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(email, password, name, phone) {
        return this.request('/auth/v1/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, user_metadata: { name, phone } })
        });
    }

    async logout() {
        this.clearAuth();
    }

    // Data methods
    async getProperties() {
        return this.request('/rest/v1/properties?select=*');
    }

    async getServices() {
        return this.request('/rest/v1/services?select=*');
    }

    async getBookings() {
        return this.request('/rest/v1/bookings?select=*');
    }

    async getDashboardStats() {
        return this.request('/rest/v1/dashboard_stats?select=*');
    }

    async updateProfile(data) {
        return this.request('/rest/v1/profiles', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async createBooking(data) {
        return this.request('/rest/v1/bookings', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateBooking(id, data) {
        return this.request(`/rest/v1/bookings?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async deleteBooking(id) {
        return this.request(`/rest/v1/bookings?id=eq.${id}`, {
            method: 'DELETE'
        });
    }

    async createService(data) {
        return this.request('/rest/v1/services', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateService(id, data) {
        return this.request(`/rest/v1/services?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }
}

// Initialize API service
window.apiService = new APIService();
