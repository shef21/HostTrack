// ===== ANALYTICS JAVASCRIPT =====

class AnalyticsManager {
    constructor() {
        this.setupAnalyticsEventListeners();
    }

    setupAnalyticsEventListeners() {
        // Export data button
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
    }

    exportData() {
        const btn = document.getElementById('export-data-btn');
        const originalContent = btn.innerHTML;
        
        // Show loading state
        btn.innerHTML = `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style="animation: spin 1s linear infinite;">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
            Exporting...
        `;
        btn.disabled = true;

        // Simulate export
        setTimeout(() => {
            // Reset button
            btn.innerHTML = originalContent;
            btn.disabled = false;
            
            // Show success message
            this.showNotification('Data exported successfully!', 'success');
        }, 2000);
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

// Initialize analytics manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsManager = new AnalyticsManager();
}); 