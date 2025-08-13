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

    connect() {
        try {
            // Only connect if user is authenticated
            if (!window.apiService || !window.apiService.isAuthenticated()) {
                console.log('🔄 Real-time: User not authenticated, skipping connection');
                return;
            }
            
            console.log('🔄 Real-time: Attempting to connect...');
            // For now, we'll use Server-Sent Events (SSE) as a fallback
            // In production, you'd use WebSocket or Socket.io
            this.setupSSEConnection();
        } catch (error) {
            console.error('Failed to establish real-time connection:', error);
            this.fallbackToPolling();
        }
    }

    setupSSEConnection() {
        try {
            // Check if user is authenticated before attempting connection
            if (!window.apiService || !window.apiService.isAuthenticated()) {
                console.log('🔄 Real-time: User not authenticated, using polling fallback');
                this.fallbackToPolling();
                return;
            }
            
            const eventSource = new EventSource('http://localhost:3001/api/realtime/events');
            
            eventSource.onopen = () => {
                console.log('✅ SSE connection established');
                this.isConnected = true;
                this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
                this.startHeartbeat();
                this.notifySubscribers('connection', { status: 'connected' });
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleRealtimeUpdate(data);
                } catch (error) {
                    console.error('Error parsing SSE data:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('SSE connection error:', error);
                this.isConnected = false;
                this.notifySubscribers('connection', { status: 'disconnected' });
                
                // Only attempt reconnection if we haven't exceeded max attempts
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.scheduleReconnect();
                } else {
                    console.log('🔄 Real-time: Max reconnection attempts reached, using polling fallback');
                    this.fallbackToPolling();
                }
            };

            this.socket = eventSource;
        } catch (error) {
            console.error('SSE not supported, falling back to polling:', error);
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

            // Make a lightweight API call to check for updates
            const response = await fetch('http://localhost:3001/api/realtime/check-updates', {
                headers: {
                    'Authorization': `Bearer ${window.apiService.getToken()}`,
                    'Last-Update': lastUpdate
                }
            });

            if (response.ok) {
                const updates = await response.json();
                localStorage.setItem('hosttrack_last_update', currentTime.toString());
                return updates;
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
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        
        this.isConnected = false;
        console.log('🔌 Real-time service disconnected');
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
