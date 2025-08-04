// ===== AUTHENTICATION JAVASCRIPT =====

class AuthManager {
    constructor() {
        this.setupAuthEventListeners();
    }

    setupAuthEventListeners() {
        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchAuthTab(e.target.dataset.tab);
            });
        });

        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    }

    switchAuthTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.auth-tab').forEach(t => {
            t.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.add('hidden');
        });
        document.getElementById(`${tab}-form`).classList.remove('hidden');
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        // Show loading state
        const submitBtn = document.querySelector('#login-form button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing in...';
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await this.simulateApiCall(1000);

            // Mock authentication - in real app, this would be an API call
            const mockUsers = [
                { email: 'demo@hosttrack.co.za', password: 'demo123', name: 'Demo User' },
                { email: 'admin@hosttrack.co.za', password: 'admin123', name: 'Admin User' },
                { email: 'test@hosttrack.co.za', password: 'test123', name: 'Test User' }
            ];

            const user = mockUsers.find(u => u.email === email && u.password === password);

            if (user) {
                // Store user data
                const userData = {
                    id: Date.now(),
                    name: user.name,
                    email: user.email,
                    plan: 'pro'
                };

                localStorage.setItem('hosttrack_user', JSON.stringify(userData));
                
                // Show success and redirect
                this.showSuccess('Login successful!');
                setTimeout(() => {
                    window.hostTrackApp.currentUser = userData;
                    window.hostTrackApp.showApp();
                }, 1000);
            } else {
                this.showError('Invalid email or password');
            }
        } catch (error) {
            this.showError('Login failed. Please try again.');
        } finally {
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleRegister() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const plan = document.getElementById('register-plan').value;

        if (!name || !email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        // Show loading state
        const submitBtn = document.querySelector('#register-form button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating account...';
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await this.simulateApiCall(1500);

            // Check if email already exists (mock)
            const existingUser = localStorage.getItem('hosttrack_user');
            if (existingUser && JSON.parse(existingUser).email === email) {
                this.showError('Email already registered');
                return;
            }

            // Create new user
            const userData = {
                id: Date.now(),
                name: name,
                email: email,
                plan: plan
            };

            localStorage.setItem('hosttrack_user', JSON.stringify(userData));
            
            // Show success and redirect
            this.showSuccess('Account created successfully!');
            setTimeout(() => {
                window.hostTrackApp.currentUser = userData;
                window.hostTrackApp.showApp();
            }, 1000);

        } catch (error) {
            this.showError('Registration failed. Please try again.');
        } finally {
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    simulateApiCall(delay) {
        return new Promise((resolve) => {
            setTimeout(resolve, delay);
        });
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        // Create notification element
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

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;
        document.head.appendChild(style);

        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
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

    // Demo login function for quick access
    demoLogin() {
        document.getElementById('login-email').value = 'demo@hosttrack.co.za';
        document.getElementById('login-password').value = 'demo123';
        this.handleLogin();
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
    
    // Add demo login button for testing
    const authContainer = document.querySelector('.auth-container');
    if (authContainer) {
        const demoBtn = document.createElement('button');
        demoBtn.textContent = 'Try Demo';
        demoBtn.className = 'btn btn-secondary btn-full';
        demoBtn.style.marginTop = '16px';
        demoBtn.addEventListener('click', () => {
            window.authManager.demoLogin();
        });
        authContainer.appendChild(demoBtn);
    }
}); 