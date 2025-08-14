// API Service Layer for HostTrack Frontend - VERSION 2.0 (CACHE BUSTED)
class APIService {
    constructor() {
        // Use your Railway backend for production
        this.baseURL = 'https://hosttrack-production.up.railway.app';
        this.token = null;
        this.user = null;
        this.isAuthenticatedFlag = false;
        
        console.log('🔧 API Service VERSION 2.0 initialized with base URL:', this.baseURL);
        console.log('🔧 This version should call /api/analytics/dashboard instead of individual endpoints');
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

    // Get user profile data from Railway backend
    async getUserProfile() {
        try {
            if (!this.user || !this.user.id) {
                console.log('No authenticated user, cannot fetch profile');
                return null;
            }

            console.log('👤 Fetching user profile from Railway backend...');
            const response = await this.request('/api/auth/me');
            console.log('✅ User profile loaded from Railway backend:', response);
            return response.user;
        } catch (error) {
            console.error('❌ Error fetching user profile from Railway backend:', error);
            return null;
        }
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
            console.log('🌐 Making API request to:', url);
            console.log('📋 Request config:', config);
            
            const response = await fetch(url, config);
            console.log('📡 Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            if (!response.ok) {
                console.error('❌ Response not OK:', response.status, response.statusText);
                // Try to get error details from response body
                try {
                    const errorBody = await response.text();
                    console.error('❌ Error response body:', errorBody);
                    throw new Error(`Request failed: ${response.status} ${response.statusText} - ${errorBody}`);
                } catch (parseError) {
                    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
                }
            }
            
            const responseData = await response.json();
            console.log('✅ Response data parsed successfully:', responseData);
            return responseData;
        } catch (error) {
            console.error('💥 API Error:', error);
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

    // Auth methods - using Railway backend
    async login(email, password) {
        try {
            console.log('🔐 Attempting login through Railway backend...');
            console.log('📧 Email:', email);
            console.log('🔑 Password provided:', password ? 'Yes' : 'No');
            
            const response = await this.request('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            console.log('✅ Login successful through Railway backend');
            console.log('📊 Response type:', typeof response);
            console.log('🔑 Response keys:', response ? Object.keys(response) : 'No response');
            console.log('👤 Response.user:', response?.user);
            console.log('🔐 Response.session:', response?.session);
            console.log('📋 Full response:', response);
            
            return response;
        } catch (error) {
            console.error('❌ Login failed through Railway backend:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            throw error;
        }
    }

    async register(email, password, name, phone) {
        try {
            console.log('📝 Attempting registration through Railway backend...');
            const response = await this.request('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password, name, phone })
            });
            
            console.log('✅ Registration successful through Railway backend:', response);
            return response;
        } catch (error) {
            console.error('❌ Registration failed through Railway backend:', error);
            throw error;
        }
    }

    async logout() {
        this.clearAuth();
    }

    // Helper method to get Supabase client with error handling
    async getSupabaseClient() {
        try {
            console.log('🔍 getSupabaseClient called');
            console.log('🔍 window.supabase:', typeof window.supabase);
            console.log('🔍 window.createClient:', typeof window.createClient);
            console.log('🔍 window.Supabase:', typeof window.Supabase);
            
            // Check if Supabase is available globally
            if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
                console.log('✅ Using window.supabase.createClient');
                return window.supabase.createClient(this.baseURL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE');
            }
            
            // Check if createClient is available globally
            if (typeof window.createClient !== 'undefined') {
                console.log('✅ Using window.createClient');
                return window.createClient(this.baseURL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE');
            }
            
            // Try to import from CDN
            try {
                console.log('🔄 Attempting CDN import...');
                const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
                console.log('✅ CDN import successful, createClient:', typeof createClient);
                return createClient(this.baseURL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE');
            } catch (importError) {
                console.error('❌ CDN import failed:', importError);
                
                // Last resort: try to create a basic client
                if (typeof window.Supabase !== 'undefined') {
                    console.log('✅ Using window.Supabase constructor');
                    return new window.Supabase(this.baseURL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE');
                }
                
                throw new Error('Supabase library not available. Please refresh the page and try again.');
            }
        } catch (error) {
            console.error('❌ Failed to load Supabase client:', error);
            throw new Error('Supabase library not available. Please refresh the page and try again.');
        }
    }

    // Data methods - using Railway backend API
    async getProperties() {
        try {
            console.log('🏠 Fetching properties from Railway backend...');
            const response = await this.request('/api/properties');
            console.log('✅ Properties loaded from Railway backend:', response);
            return response;
        } catch (error) {
            console.error('❌ Error getting properties from Railway backend:', error);
            throw error;
        }
    }

    async getServices() {
        try {
            console.log('🔧 Fetching services from Railway backend...');
            const response = await this.request('/api/services');
            console.log('✅ Services loaded from Railway backend:', response);
            return response;
        } catch (error) {
            console.error('❌ Error getting services from Railway backend:', error);
            throw error;
        }
    }

    async getBookings() {
        try {
            console.log('📅 Fetching bookings from Railway backend...');
            const response = await this.request('/api/bookings');
            console.log('✅ Bookings loaded from Railway backend:', response);
            return response;
        } catch (error) {
            console.error('❌ Error getting bookings from Railway backend:', error);
            throw error;
        }
    }

    async getDashboardStats() {
        try {
            console.log('📊 VERSION 2.0: Fetching dashboard stats from Railway backend analytics endpoint...');
            console.log('🌐 Making request to:', `${this.baseURL}/api/analytics/dashboard`);
            console.log('🔧 This should NOT call individual endpoints anymore');
            
            // Get comprehensive dashboard data from the analytics endpoint
            const dashboardData = await this.request('/api/analytics/dashboard');
            
            console.log('✅ VERSION 2.0: Dashboard stats received from analytics endpoint:', dashboardData);
            console.log('🔍 Data structure analysis:', {
                hasProperties: !!dashboardData?.properties,
                hasBookings: !!dashboardData?.bookings,
                hasOverview: !!dashboardData?.overview,
                hasRevenue: !!dashboardData?.revenue,
                hasOccupancy: !!dashboardData?.occupancy,
                propertiesKeys: dashboardData?.properties ? Object.keys(dashboardData.properties) : [],
                revenueKeys: dashboardData?.revenue ? Object.keys(dashboardData.revenue) : [],
                occupancyKeys: dashboardData?.occupancy ? Object.keys(dashboardData.occupancy) : []
            });
            return dashboardData;
        } catch (error) {
            console.error('❌ VERSION 2.0: Error getting dashboard stats from Railway backend:', error);
            // Return default stats if there's an error
            return {
                properties: { total: 0, active: 0 },
                bookings: { total: 0, confirmed: 0, pending: 0, revenue: 0 },
                services: { total: 0, active: 0 },
                overview: { totalRevenue: 0, avgBookingValue: 0, occupancyRate: 0 },
                revenue: { total: 0, monthly: {}, months: [], amounts: [] },
                occupancy: { rate: 0, weekly: [0, 0, 0, 0, 0, 0, 0] }
            };
        }
    }

    // Add missing getBookingStats method
    async getBookingStats() {
        try {
            console.log('📅 Fetching booking stats from Railway backend...');
            
            const response = await this.request('/api/bookings');
            const bookings = response || [];

            const totalBookings = bookings.length || 0;
            const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length || 0;
            const pendingBookings = bookings.filter(b => b.status === 'pending').length || 0;
            const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length || 0;
            const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

            console.log('✅ Booking stats calculated successfully');
            return {
                total: totalBookings,
                confirmed: confirmedBookings,
                pending: pendingBookings,
                cancelled: cancelledBookings,
                revenue: totalRevenue,
                avgValue: totalBookings > 0 ? totalRevenue / totalBookings : 0
            };
        } catch (error) {
            console.error('❌ Error getting booking stats from Railway backend:', error);
            return {
                total: 0,
                confirmed: 0,
                pending: 0,
                cancelled: 0,
                revenue: 0,
                avgValue: 0
            };
        }
    }

    // Advanced Analytics - using Railway backend API
    async getAdvancedAnalytics(includePredictions = false) {
        try {
            console.log('📈 Fetching advanced analytics from Railway backend...');
            
            // Get data from Railway backend API endpoints
            const [propertiesResponse, bookingsResponse, servicesResponse] = await Promise.all([
                this.request('/api/properties'),
                this.request('/api/bookings'),
                this.request('/api/services')
            ]);

            const properties = propertiesResponse || [];
            const bookings = bookingsResponse || [];
            const services = servicesResponse || [];

            // Generate insights based on actual data
            const insights = this.generateInsights(properties, bookings, services);
            const predictions = includePredictions ? this.generatePredictions(properties, bookings) : [];
            const recommendations = this.generateRecommendations(properties, bookings, services);

            console.log('✅ Advanced analytics generated successfully');
            return {
                success: true,
                data: {
                    insights,
                    predictions,
                    recommendations,
                    benchmarks: this.generateBenchmarks(properties, bookings)
                }
            };
        } catch (error) {
            console.error('❌ Error in getAdvancedAnalytics from Railway backend:', error);
            // Return default analytics data instead of throwing error
            return {
                success: true,
                data: {
                    insights: [
                        {
                            title: 'Getting Started',
                            description: 'Welcome to HostTrack! Add your first property to get started.',
                            priority: 'info',
                            icon: '🚀',
                            metrics: [{ label: 'Next Step', value: 'Add Property' }]
                        }
                    ],
                    predictions: [],
                    recommendations: [
                        {
                            title: 'Add Your First Property',
                            description: 'Start by adding a property to your portfolio',
                            priority: 'high',
                            action: 'Go to Properties page'
                        }
                    ],
                    benchmarks: {
                        avgResponseTime: 'N/A',
                        avgOccupancyRate: '0%',
                        avgRating: 'N/A',
                        totalRevenue: 'R0'
                    }
                }
            };
        }
    }

    // Helper methods for analytics
    generateInsights(properties, bookings, services) {
        const insights = [];
        
        if (properties && properties.length > 0) {
            insights.push({
                title: 'Property Portfolio',
                description: `You have ${properties.length} properties in your portfolio`,
                priority: 'info',
                icon: '🏠',
                metrics: [
                    { label: 'Total Properties', value: properties.length }
                ]
            });
        }

        if (bookings && bookings.length > 0) {
            const activeBookings = bookings.filter(b => b.status === 'active' || b.status === 'confirmed');
            insights.push({
                title: 'Active Bookings',
                description: `${activeBookings.length} out of ${bookings.length} bookings are active`,
                priority: 'success',
                icon: '📅',
                metrics: [
                    { label: 'Active', value: activeBookings.length },
                    { label: 'Total', value: bookings.length }
                ]
            });
        }

        if (services && services.length > 0) {
            insights.push({
                title: 'Service Offerings',
                description: `You offer ${services.length} different services`,
                priority: 'info',
                icon: '🔧',
                metrics: [
                    { label: 'Services', value: services.length }
                ]
            });
        }

        return insights;
    }

    generatePredictions(properties, bookings) {
        if (!properties || !bookings || properties.length === 0 || bookings.length === 0) {
            return [];
        }

        // Calculate real predictions based on actual data
        const totalBookings = bookings.length;
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
        const avgOccupancy = properties.length > 0 ? (confirmedBookings / properties.length) * 100 : 0;
        
        // Calculate revenue trend (placeholder for now - should be based on historical data)
        const recentBookings = bookings.filter(b => {
            const bookingDate = new Date(b.created_at || b.check_in_date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return bookingDate >= thirtyDaysAgo;
        });
        
        const recentRevenue = recentBookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
        const olderBookings = bookings.filter(b => !recentBookings.includes(b));
        const olderRevenue = olderBookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
        
        let revenueTrend = 'stable';
        let revenueChange = '0%';
        
        if (olderRevenue > 0) {
            const change = ((recentRevenue - olderRevenue) / olderRevenue) * 100;
            revenueChange = `${change > 0 ? '+' : ''}${Math.round(change)}%`;
            revenueTrend = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
        }

        return [
            {
                title: 'Revenue Forecast',
                description: 'Based on current booking trends',
                confidence: Math.min(85, Math.max(50, Math.round(avgOccupancy))),
                value: revenueChange,
                trend: revenueTrend
            },
            {
                title: 'Occupancy Rate',
                description: 'Expected occupancy for next month',
                confidence: Math.min(78, Math.max(40, Math.round(avgOccupancy * 0.8))),
                value: `${Math.round(avgOccupancy)}%`,
                trend: avgOccupancy > 70 ? 'up' : avgOccupancy < 30 ? 'down' : 'stable'
            }
        ];
    }

    generateRecommendations(properties, bookings, services) {
        const recommendations = [];
        
        if (properties && properties.length > 0) {
            recommendations.push({
                title: 'Optimize Pricing',
                description: 'Review and adjust property pricing based on market trends',
                priority: 'medium',
                action: 'Review pricing strategy'
            });
        }

        if (bookings && bookings.length > 0) {
            recommendations.push({
                title: 'Improve Response Time',
                description: 'Faster response times lead to higher booking rates',
                priority: 'high',
                action: 'Set up automated responses'
            });
        }

        return recommendations;
    }

    generateBenchmarks(properties, bookings) {
        if (!properties || !bookings) return null;

        // Calculate real benchmarks based on actual data
        const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
        const avgOccupancy = properties.length > 0 ? (confirmedBookings / properties.length) * 100 : 0;
        
        // Calculate average response time (placeholder - should be based on actual response time data)
        // For now, using a reasonable default based on industry standards
        const avgResponseTime = '2-4 hours'; // This should come from actual response time tracking
        
        // Calculate average rating (placeholder - should be based on actual guest ratings)
        // For now, using a reasonable default
        const avgRating = '4.5/5'; // This should come from actual guest review data

        return {
            avgResponseTime,
            avgOccupancyRate: `${Math.round(avgOccupancy)}%`,
            avgRating,
            totalRevenue: totalRevenue > 0 ? `R${totalRevenue.toLocaleString()}` : 'R0'
        };
    }

    async updateProfile(data) {
        try {
            console.log('👤 Updating profile via Railway backend...');
            const response = await this.request('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            console.log('✅ Profile updated via Railway backend:', response);
            return response.user;
        } catch (error) {
            console.error('❌ Error updating profile via Railway backend:', error);
            throw error;
        }
    }

    async createBooking(data) {
        try {
            console.log('📅 Creating booking via Railway backend...');
            const response = await this.request('/api/bookings', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            console.log('✅ Booking created via Railway backend:', response);
            return response;
        } catch (error) {
            console.error('❌ Error creating booking via Railway backend:', error);
            throw error;
        }
    }

    async updateBooking(id, data) {
        try {
            console.log('📅 Updating booking via Railway backend...');
            const response = await this.request(`/api/bookings/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            console.log('✅ Booking updated via Railway backend:', response);
            return response;
        } catch (error) {
            console.error('❌ Error updating booking via Railway backend:', error);
            throw error;
        }
    }

    async deleteBooking(id) {
        try {
            console.log('🗑️ Deleting booking via Railway backend...');
            const response = await this.request(`/api/bookings/${id}`, {
                method: 'DELETE'
            });
            console.log('✅ Booking deleted via Railway backend:', response);
            return { success: true };
        } catch (error) {
            console.error('❌ Error deleting booking via Railway backend:', error);
            throw error;
        }
    }

    async createService(data) {
        try {
            console.log('🔧 Creating service via Railway backend...');
            const response = await this.request('/api/services', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            console.log('✅ Service created via Railway backend:', response);
            return response;
        } catch (error) {
            console.error('❌ Error creating service via Railway backend:', error);
            throw error;
        }
    }

    async updateService(id, data) {
        try {
            console.log('🔧 Updating service via Railway backend...');
            const response = await this.request(`/api/services/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            console.log('✅ Service updated via Railway backend:', response);
            return response;
        } catch (error) {
            console.error('❌ Error updating service via Railway backend:', error);
            throw error;
        }
    }

    // Property methods
    async createProperty(data) {
        try {
            console.log('🏠 Creating property via Railway backend...');
            const response = await this.request('/api/properties', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            console.log('✅ Property created via Railway backend:', response);
            return response;
        } catch (error) {
            console.error('❌ Error creating property via Railway backend:', error);
            throw error;
        }
    }

    async updateProperty(id, data) {
        try {
            console.log('🏠 Updating property via Railway backend...');
            const response = await this.request(`/api/properties/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            console.log('✅ Property updated via Railway backend:', response);
            return response;
        } catch (error) {
            console.error('❌ Error updating property via Railway backend:', error);
            throw error;
        }
    }

    async deleteProperty(id) {
        try {
            console.log('🗑️ Deleting property via Railway backend...');
            const response = await this.request(`/api/properties/${id}`, {
                method: 'DELETE'
            });
            console.log('✅ Property deleted via Railway backend:', response);
            return { success: true };
        } catch (error) {
            console.error('❌ Error deleting property via Railway backend:', error);
            throw error;
        }
    }

    // Analytics methods - using Railway backend API
    async getAnalyticsDebugUserData() {
        try {
            console.log('📊 Fetching analytics debug data from Railway backend...');
            
            const [propertiesResponse, bookingsResponse, servicesResponse, expensesResponse] = await Promise.all([
                this.request('/api/properties'),
                this.request('/api/bookings'),
                this.request('/api/services'),
                this.request('/api/expenses')
            ]);

            const properties = propertiesResponse || [];
            const bookings = bookingsResponse || [];
            const services = servicesResponse || [];
            const expenses = expensesResponse || [];

            console.log('✅ Analytics debug data loaded from Railway backend');
            return {
                properties,
                bookings,
                services,
                expenses
            };
        } catch (error) {
            console.error('❌ Error in getAnalyticsDebugUserData from Railway backend:', error);
            throw error;
        }
    }

    async getAnalyticsDashboard() {
        try {
            console.log('📊 Fetching analytics dashboard from Railway backend...');
            
            const [propertiesResponse, bookingsResponse, servicesResponse] = await Promise.all([
                this.request('/api/properties'),
                this.request('/api/bookings'),
                this.request('/api/services')
            ]);

            const properties = propertiesResponse || [];
            const bookings = bookingsResponse || [];
            const services = servicesResponse || [];

            // Calculate overview metrics
            const totalRevenue = bookings.reduce((sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0);
            const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;
            const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
            const pendingBookings = bookings.filter(b => b.status === 'pending').length;

            console.log('✅ Analytics dashboard calculated successfully');
            return {
                overview: {
                    totalRevenue,
                    totalBookings: bookings.length,
                    avgBookingValue
                },
                properties: {
                    total: properties.length
                },
                bookings: {
                    confirmed: confirmedBookings,
                    pending: pendingBookings
                },
                services: {
                    total: services.length
                }
            };
        } catch (error) {
            console.error('❌ Error in getAnalyticsDashboard from Railway backend:', error);
            throw error;
        }
    }

    async getAnalyticsRevenue() {
        try {
            console.log('💰 Fetching analytics revenue from Railway backend...');
            
            const response = await this.request('/api/bookings');
            const bookings = response || [];

            // Handle empty data gracefully
            if (!bookings || bookings.length === 0) {
                return {
                    monthly: {},
                    total: 0
                };
            }

            // Group revenue by month
            const monthlyRevenue = {};
            bookings.forEach(booking => {
                if (booking.check_in_date) {
                    const month = new Date(booking.check_in_date).toISOString().slice(0, 7); // YYYY-MM
                    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (parseFloat(booking.total_amount) || 0);
                }
            });

            console.log('✅ Analytics revenue calculated successfully');
            return {
                monthly: monthlyRevenue,
                total: Object.values(monthlyRevenue).reduce((sum, revenue) => sum + revenue, 0)
            };
        } catch (error) {
            console.error('❌ Error in getAnalyticsRevenue from Railway backend:', error);
            return {
                monthly: {},
                total: 0
            };
        }
    }

    async getAnalyticsOccupancy() {
        try {
            console.log('🏠 Fetching analytics occupancy from Railway backend...');
            
            const [propertiesResponse, bookingsResponse] = await Promise.all([
                this.request('/api/properties'),
                this.request('/api/bookings')
            ]);

            const properties = propertiesResponse || [];
            const bookings = bookingsResponse || [];

            // Handle empty data gracefully
            if (properties.length === 0) {
                return {
                    current: 0,
                    total: 0,
                    occupied: 0
                };
            }

            // Calculate occupancy rates
            const totalProperties = properties.length;
            const occupiedProperties = bookings.filter(b => 
                b.status === 'confirmed' && 
                new Date(b.check_in_date) <= new Date() && 
                new Date(b.check_out_date) >= new Date()
            ).length;

            console.log('✅ Analytics occupancy calculated successfully');
            return {
                current: totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0,
                total: totalProperties,
                occupied: occupiedProperties
            };
        } catch (error) {
            console.error('❌ Error in getAnalyticsOccupancy from Railway backend:', error);
            return {
                current: 0,
                total: 0,
                occupied: 0
            };
        }
    }

    async getAnalyticsExpenses() {
        try {
            console.log('💸 Fetching analytics expenses from Railway backend...');
            
            const response = await this.request('/api/expenses');
            const expenses = response || [];

            // Handle empty data gracefully
            if (!expenses || expenses.length === 0) {
                return {
                    byCategory: {},
                    total: 0
                };
            }

            // Group expenses by category
            const expensesByCategory = {};
            expenses.forEach(expense => {
                const category = expense.category || 'Other';
                expensesByCategory[category] = (expensesByCategory[category] || 0) + (parseFloat(expense.amount) || 0);
            });

            console.log('✅ Analytics expenses calculated successfully');
            return {
                byCategory: expensesByCategory,
                total: expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
            };
        } catch (error) {
            console.error('❌ Error in getAnalyticsExpenses from Railway backend:', error);
            return {
                byCategory: {},
                total: 0
            };
        }
    }
}

// Initialize API service
window.apiService = new APIService();
