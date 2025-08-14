// ===== REALTIME SERVICE FOR DASHBOARD UPDATES =====

class RealtimeService {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.isConnected = false;
        this.subscribers = new Map();
        this.heartbeatInterval = null;
        this.initialized = false;
        this.setupEventListeners();
        
        // Don't auto-connect - wait for authentication
        console.log('🔄 Real-time: Service initialized, waiting for authentication');
    }

    // Initialize after user authentication
    initializeAfterAuth() {
        if (this.initialized) {
            console.log('🔄 Real-time: Already initialized');
            return;
        }
        
        if (window.apiService && window.apiService.isAuthenticated()) {
            console.log('🔄 Real-time: User authenticated, initializing connection...');
            this.initialized = true;
            this.connect();
        } else {
            console.log('🔄 Real-time: User not authenticated yet, will initialize later');
        }
    }

    setupEventListeners() {
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseUpdates();
            } else {
                this.resumeUpdates();
            }
        });

        // Listen for app state changes
        window.addEventListener('beforeunload', () => {
            this.disconnect();
        });
    }

    async connect() {
        if (this.isConnected) {
            console.log('🔄 Real-time: Already connected');
            return;
        }

        try {
            console.log('🔄 Real-time: Attempting to connect...');
            
            // Use Supabase real-time instead of localhost SSE
            if (!window.apiService || !window.apiService.isAuthenticated()) {
                console.log('🔄 Real-time: User not authenticated, skipping connection');
                return;
            }

            // Create Supabase client for real-time
            const supabase = await window.apiService.getSupabaseClient();

            // Subscribe to real-time changes
            this.setupSupabaseRealtime(supabase);
            
        } catch (error) {
            console.error('🔄 Real-time: Connection failed:', error);
            this.fallbackToPolling();
        }
    }

    setupSupabaseRealtime(supabase) {
        try {
            console.log('🔄 Real-time: Setting up Supabase real-time subscriptions...');
            
            // Subscribe to properties table changes
            this.propertiesSubscription = supabase
                .channel('properties-changes')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'properties' },
                    (payload) => {
                        console.log('🔄 Real-time: Properties change:', payload);
                        this.handleRealtimeUpdate({
                            type: 'property_update',
                            data: payload
                        });
                    }
                )
                .subscribe();

            // Subscribe to bookings table changes
            this.bookingsSubscription = supabase
                .channel('bookings-changes')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'bookings' },
                    (payload) => {
                        console.log('🔄 Real-time: Bookings change:', payload);
                        this.handleRealtimeUpdate({
                            type: 'booking_update',
                            data: payload
                        });
                    }
                )
                .subscribe();

            // Subscribe to services table changes
            this.servicesSubscription = supabase
                .channel('services-changes')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'services' },
                    (payload) => {
                        console.log('🔄 Real-time: Services change:', payload);
                        this.handleRealtimeUpdate({
                            type: 'service_update',
                            data: payload
                        });
                    }
                )
                .subscribe();

            this.isConnected = true;
            this.notifySubscribers('connection', { status: 'connected' });
            console.log('🔄 Real-time: Supabase real-time subscriptions active');
            
        } catch (error) {
            console.error('🔄 Real-time: Failed to setup Supabase real-time:', error);
            this.fallbackToPolling();
        }
    }

    fallbackToPolling() {
        console.log('🔄 Using polling fallback for real-time updates');
        this.startPolling();
    }

    startPolling() {
        // Poll every 30 seconds for updates
        this.pollingInterval = setInterval(() => {
            this.pollForUpdates();
        }, 30000);
    }

    async pollForUpdates() {
        try {
            if (!window.apiService || !window.apiService.isAuthenticated()) {
                return;
            }

            // Check for new data
            const updates = await this.checkForUpdates();
            if (updates && updates.hasChanges) {
                this.handleRealtimeUpdate(updates);
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }

    async checkForUpdates() {
        try {
            // Get last update timestamp from localStorage
            const lastUpdate = localStorage.getItem('hosttrack_last_update') || '0';
            const currentTime = Date.now();

            // Check if enough time has passed since last update
            if (currentTime - parseInt(lastUpdate) < 30000) {
                return null;
            }

            // For production, we'll use a lightweight check via Supabase
            // This is a fallback when real-time isn't working
            if (window.apiService && window.apiService.isAuthenticated()) {
                            // Check if there are any recent changes by looking at the last few records
            const supabase = await window.apiService.getSupabaseClient();

                // Simple check - get count of recent records
                const { count: recentCount } = await supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', new Date(Date.now() - 30000).toISOString());

                if (recentCount > 0) {
                    localStorage.setItem('hosttrack_last_update', currentTime.toString());
                    return { hasChanges: true, type: 'polling_update', count: recentCount };
                }
            }

            return null;
        } catch (error) {
            console.error('Error checking for updates:', error);
            return null;
        }
    }

    handleRealtimeUpdate(data) {
        console.log('🔄 Real-time update received:', data);
        
        // Notify subscribers based on update type
        switch (data.type) {
            case 'new_booking':
                this.notifySubscribers('new_booking', data);
                this.showNotification('New booking received!', 'info');
                break;
            case 'booking_update':
                this.notifySubscribers('booking_update', data);
                break;
            case 'new_property':
                this.notifySubscribers('new_property', data);
                this.showNotification('New property added!', 'success');
                break;
            case 'revenue_update':
                this.notifySubscribers('revenue_update', data);
                break;
            case 'occupancy_update':
                this.notifySubscribers('occupancy_update', data);
                break;
            default:
                this.notifySubscribers('general_update', data);
        }

        // Update dashboard if it's currently visible
        if (document.getElementById('dashboard-page')?.classList.contains('active')) {
            this.updateDashboardRealtime(data);
        }
    }

    updateDashboardRealtime(data) {
        // Update specific dashboard elements based on data type
        if (data.type === 'revenue_update' && data.revenue) {
            this.updateRevenueDisplay(data.revenue);
        }
        
        if (data.type === 'occupancy_update' && data.occupancy) {
            this.updateOccupancyDisplay(data.occupancy);
        }
        
        if (data.type === 'new_booking' && data.booking) {
            this.updateBookingsDisplay(data.booking);
        }
    }

    updateRevenueDisplay(revenueData) {
        const revenueElement = document.getElementById('total-revenue');
        if (revenueElement && revenueData.total) {
            revenueElement.textContent = `R${revenueData.total.toLocaleString()}`;
            
            // Add visual indicator for update
            revenueElement.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                revenueElement.style.animation = '';
            }, 500);
        }
    }

    updateOccupancyDisplay(occupancyData) {
        const occupancyElement = document.getElementById('occupancy-rate');
        if (occupancyElement && occupancyData.rate !== undefined) {
            occupancyElement.textContent = `${occupancyData.rate}%`;
            
            // Add visual indicator for update
            occupancyElement.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                occupancyElement.style.animation = '';
            }, 500);
        }
    }

    updateBookingsDisplay(bookingData) {
        const bookingsElement = document.getElementById('total-bookings');
        if (bookingsElement) {
            const currentCount = parseInt(bookingsElement.textContent) || 0;
            const newCount = currentCount + 1;
            bookingsElement.textContent = newCount;
            
            // Add visual indicator for update
            bookingsElement.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                bookingsElement.style.animation = '';
            }, 500);
        }
    }

    subscribe(eventType, callback) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, []);
        }
        this.subscribers.get(eventType).push(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.subscribers.get(eventType);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    notifySubscribers(eventType, data) {
        const callbacks = this.subscribers.get(eventType);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in subscriber callback:', error);
                }
            });
        }
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.sendHeartbeat();
            }
        }, 30000); // Send heartbeat every 30 seconds
    }

    sendHeartbeat() {
        // Send a lightweight ping to keep connection alive
        if (this.socket && this.socket.readyState === EventSource.OPEN) {
            // SSE doesn't support client-to-server messages
            // This is just for connection monitoring
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('❌ Max reconnection attempts reached');
            this.notifySubscribers('connection', { 
                status: 'failed', 
                message: 'Connection failed after multiple attempts' 
            });
        }
    }

    pauseUpdates() {
        console.log('⏸️ Pausing real-time updates (page hidden)');
        // Reduce polling frequency when page is hidden
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = setInterval(() => {
                this.pollForUpdates();
            }, 60000); // Poll every minute when hidden
        }
    }

    resumeUpdates() {
        console.log('▶️ Resuming real-time updates (page visible)');
        // Resume normal polling frequency
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = setInterval(() => {
                this.pollForUpdates();
            }, 30000); // Poll every 30 seconds when visible
        }
    }

    disconnect() {
        console.log('🔄 Real-time: Disconnecting...');
        
        // Clean up Supabase subscriptions
        if (this.propertiesSubscription) {
            this.propertiesSubscription.unsubscribe();
            this.propertiesSubscription = null;
        }
        
        if (this.bookingsSubscription) {
            this.bookingsSubscription.unsubscribe();
            this.bookingsSubscription = null;
        }
        
        if (this.servicesSubscription) {
            this.servicesSubscription.unsubscribe();
            this.servicesSubscription = null;
        }
        
        // Clean up old SSE connection if it exists
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        // Clean up polling
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        
        this.isConnected = false;
        this.notifySubscribers('connection', { status: 'disconnected' });
        console.log('🔄 Real-time: Disconnected');
    }

    showNotification(message, type) {
        // Create a subtle notification for real-time updates
        const notification = document.createElement('div');
        notification.className = `realtime-notification realtime-${type}`;
        notification.innerHTML = `
            <div class="realtime-content">
                <span class="realtime-message">${message}</span>
                <button class="realtime-close">×</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'error' ? '#DC2626' : type === 'info' ? '#3B82F6' : '#059669'};
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            max-width: 250px;
            animation: slideUp 0.3s ease;
            font-size: 12px;
        `;

        // Add close functionality
        const closeBtn = notification.querySelector('.realtime-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Add to page
        document.body.appendChild(notification);
    }
}

// Initialize real-time service globally
window.realtimeService = new RealtimeService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeService;
}
