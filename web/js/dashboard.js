// ===== DASHBOARD JAVASCRIPT =====

class DashboardManager {
    constructor() {
        this.setupDashboardEventListeners();
    }

    setupDashboardEventListeners() {
        // Refresh dashboard button
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }
    }

    refreshDashboard() {
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

        // Simulate refresh
        setTimeout(() => {
            // Reload dashboard data
            if (window.hostTrackApp) {
                window.hostTrackApp.loadDashboardData();
            }
            
            // Reset button
            btn.innerHTML = originalContent;
            btn.disabled = false;
            
            // Show success message
            this.showNotification('Dashboard refreshed successfully!', 'success');
        }, 1500);
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
            background: ${type === 'error' ? '#DC2626' : '#059669'};
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
}

// Initialize dashboard manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
}); 