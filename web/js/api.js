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
        // Use real Supabase auth method with proper headers
        const response = await fetch(`${this.baseURL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            throw new Error('Login failed');
        }
        
        const data = await response.json();
        return {
            user: data.user,
            session: { access_token: data.access_token }
        };
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
