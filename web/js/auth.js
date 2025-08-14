// ===== AUTHENTICATION JAVASCRIPT =====

class AuthManager {
    constructor() {
        this.isLoggingIn = false; // Add login state lock
        
        console.log('🔧 === AUTH MANAGER CONSTRUCTOR ===');
        console.log('🔍 Checking form elements...');
        console.log('📝 Login form exists:', !!document.getElementById('login-form'));
        console.log('📝 Login email input exists:', !!document.getElementById('login-email'));
        console.log('📝 Login password input exists:', !!document.getElementById('login-password'));
        console.log('📝 Login submit button exists:', !!document.querySelector('#login-form button[type="submit"]'));
        
        this.setupAuthEventListeners();
        this.checkAuthStatus();
    }

    setupAuthEventListeners() {
        console.log('🔧 === SETTING UP AUTH EVENT LISTENERS ===');
        
        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchAuthTab(e.target.dataset.tab);
            });
        });

        // Login form
        const loginForm = document.getElementById('login-form');
        console.log('🔍 Login form found:', !!loginForm);
        if (loginForm) {
            console.log('✅ Adding submit event listener to login form');
            loginForm.addEventListener('submit', (e) => {
                console.log('🎯 LOGIN FORM SUBMIT EVENT TRIGGERED!');
                e.preventDefault();
                this.handleLogin();
            });
            console.log('✅ Login form event listener attached');
        } else {
            console.error('❌ Login form not found!');
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        console.log('🔍 Register form found:', !!registerForm);
        if (registerForm) {
            console.log('✅ Adding submit event listener to register form');
            registerForm.addEventListener('submit', (e) => {
                console.log('🎯 REGISTER FORM SUBMIT EVENT TRIGGERED!');
                e.preventDefault();
                this.handleRegister();
            });
            console.log('✅ Register form event listener attached');
        } else {
            console.error('❌ Register form not found!');
        }
        
        console.log('🔧 === AUTH EVENT LISTENERS SETUP COMPLETE ===');
    }

    checkAuthStatus() {
        // Don't check auth status if we're in the middle of logging in
        if (this.isLoggingIn) {
            console.log('Login in progress, skipping auth status check');
            return;
        }
        
        // Check if user is already authenticated
        if (apiService.isAuthenticated()) {
            const user = apiService.getCurrentUser();
            if (window.hostTrackApp) {
                window.hostTrackApp.currentUser = user;
                window.hostTrackApp.showApp();
            }
        } else {
            // Show auth screen if not authenticated
            if (window.hostTrackApp) {
                window.hostTrackApp.showAuth();
            }
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
        // Prevent multiple simultaneous login attempts
        if (this.isLoggingIn) {
            console.log('🚫 Login already in progress, ignoring duplicate attempt');
            return;
        }

        this.isLoggingIn = true; // Lock login state
        
        console.log('🔐 === FRONTEND LOGIN DEBUG START ===');
        console.log('⏰ Login attempt timestamp:', new Date().toISOString());
        
        // Show loading state on button
        const submitBtn = document.querySelector('#login-form button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing in...';
        submitBtn.disabled = true;
        
        try {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            console.log('📧 Email entered:', email);
            console.log('🔑 Password entered:', password ? 'Yes' : 'No');
            
            if (!email || !password) {
                console.log('❌ Missing email or password');
                this.showError('Please enter both email and password');
                return;
            }

            console.log('✅ Form validation passed');
            
            // Check backend availability first
            console.log('🔍 Checking backend availability...');
            const backendAvailable = await this.checkBackendAvailability();
            console.log('🌐 Backend available:', backendAvailable);
            
            if (!backendAvailable) {
                console.log('❌ Backend not available');
                this.showError('Backend server is not available. Please try again later.');
                return;
            }

            // Make login API call
            console.log('📡 Making login API call...');
            const response = await this.makeLoginCall(email, password);
            
            // Debug: Log the full response structure
            console.log('📥 === LOGIN RESPONSE DEBUG ===');
            console.log('📊 Response type:', typeof response);
            console.log('🔑 Response keys:', response ? Object.keys(response) : 'No response');
            console.log('👤 Response.user:', response?.user);
            console.log('🔐 Response.session:', response?.session);
            console.log('✅ Response.success:', response?.success);
            console.log('📋 Full response:', response);
            console.log('📥 === LOGIN RESPONSE DEBUG END ===');
            
            // Check if login was successful (response exists and has user data)
            if (response && (response.user || response.session)) {
                console.log('✅ Login successful, calling handleLoginSuccess...');
                this.handleLoginSuccess(response);
            } else {
                console.error('❌ Login failed - invalid response structure:', response);
                this.showError('Login failed - invalid response from server');
            }
        } catch (error) {
            console.error('💥 Login error:', error);
            this.showError('An error occurred during login. Please try again.');
        } finally {
            this.isLoggingIn = false; // Unlock login state
            
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            console.log('🔐 === FRONTEND LOGIN DEBUG END ===');
        }
    }

    async checkBackendAvailability() {
        try {
            console.log('Checking backend availability...');
            const isBackendAvailable = await apiService.healthCheck();
            console.log('Backend available:', isBackendAvailable);
            return isBackendAvailable;
        } catch (error) {
            console.error('Backend availability check failed:', error);
            return false;
        }
    }

    async makeLoginCall(email, password) {
        try {
            console.log('Making login API call...');
            const response = await apiService.login(email, password);
            console.log('Login response:', response);
            return response;
        } catch (error) {
            console.error('Login API call failed:', error);
            throw error;
        }
    }

    async handleLoginSuccess(response) {
        console.log('🎉 === HANDLE LOGIN SUCCESS DEBUG START ===');
        console.log('📥 Response received:', response);
        
        try {
            // Store user data properly
            if (response.user && response.session) {
                console.log('💾 Storing user data in API service...');
                console.log('👤 User data to store:', response.user);
                console.log('🔑 Session token to store:', response.session.access_token ? 'Yes' : 'No');
                
                // Update API service
                apiService.setAuth(response.session.access_token, response.user);
                
                console.log('✅ User data stored in API service');
                console.log('👤 API service user ID:', apiService.user?.id);
                console.log('🔑 API service token present:', !!apiService.token);
            } else {
                console.log('⚠️ Missing user or session data in response');
                console.log('👤 Response.user exists:', !!response.user);
                console.log('🔑 Response.session exists:', !!response.session);
            }
            
            // Show success message
            console.log('💬 Showing success message...');
            this.showSuccess('Login successful! Redirecting to dashboard...');
            
            // DON'T automatically reload data after login - this causes duplicate API calls
            // Data will be loaded when user navigates to specific pages
            console.log('ℹ️ Skipping automatic data reload - will load when navigating to pages');
            
            // Hide loading indicator if app is available
            if (window.hostTrackApp) {
                console.log('🎯 hostTrackApp found, proceeding with redirect...');
                console.log('👤 Current app user:', window.hostTrackApp.currentUser);
                
                window.hostTrackApp.hideLoadingIndicator();
                console.log('✅ Loading indicator hidden');
                
                // Redirect to dashboard
                console.log('🔄 Calling showApp() to redirect to dashboard...');
                await window.hostTrackApp.showApp();
                console.log('✅ showApp() called successfully');
            } else {
                console.error('❌ hostTrackApp not available for redirect');
                // Fallback: try to show app directly
                console.log('🔄 Attempting fallback redirect...');
                setTimeout(async () => {
                    if (window.hostTrackApp) {
                        console.log('✅ hostTrackApp found in fallback, calling showApp()...');
                        await window.hostTrackApp.showApp();
                    } else {
                        console.error('❌ Still cannot find hostTrackApp for redirect');
                    }
                }, 1000);
            }
            
        } catch (error) {
            console.error('💥 Error handling login success:', error);
            this.showError('Login successful but error occurred while loading data');
        }
        
        console.log('🎉 === HANDLE LOGIN SUCCESS DEBUG END ===');
    }

    async handleRegister() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const phone = document.getElementById('register-phone').value;

        if (!name || !email || !password) {
            this.showError('Please fill in all required fields');
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
            // Check if backend is available first
            const isBackendAvailable = await apiService.healthCheck();
            if (!isBackendAvailable) {
                throw new Error('Backend server is not available. Please check Railway deployment.');
            }

            // Real API call
            const response = await apiService.register(email, password, name, phone);
            
            // Show success message with email confirmation instructions
            this.showSuccess('Account created successfully! Please check your email and click the confirmation link before logging in.');
            
            // Clear the form
            document.getElementById('register-form').reset();
            
            // Switch to login tab after a delay
            setTimeout(() => {
                this.switchAuthTab('login');
                document.getElementById('login-email').value = email;
                this.showSuccess('Please check your email for confirmation, then log in with your credentials.');
            }, 3000);
            
        } catch (error) {
            console.error('Registration error:', error);
            
            // Provide more specific error messages for common issues
            if (error.message.includes('Backend server')) {
                this.showError(error.message);
            } else if (error.message.includes('already exists') || error.message.includes('already registered')) {
                this.showError('An account with this email already exists. Please try logging in instead.');
            } else if (error.message.includes('password')) {
                this.showError('Password must be at least 6 characters long.');
            } else if (error.message.includes('email')) {
                this.showError('Please enter a valid email address.');
            } else {
                this.showError(error.message || 'Registration failed. Please try again.');
            }
        } finally {
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async logout() {
        try {
            await apiService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local state
            window.hostTrackApp.currentUser = null;
            window.hostTrackApp.showAuth();
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existingNotification = document.querySelector('.auth-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.textContent = message;

        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            ${type === 'error' ? 'background-color: #ef4444;' : 'background-color: #10b981;'}
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        // Add to page
        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }


}

// AuthManager is initialized by app.js when needed

// Add global function to check authentication status
window.checkAuthStatus = () => {
    console.log('=== AUTH STATUS CHECK ===');
    console.log('Current user in app:', window.hostTrackApp?.currentUser);
    console.log('API service user:', apiService.user);
    console.log('API service token:', apiService.token ? 'Present' : 'None');
    console.log('========================');
    
    return { user: apiService.user, token: apiService.token };
};

// Add global function to clear authentication
window.clearAuth = () => {
    apiService.clearAuth();
    window.hostTrackApp.currentUser = null;
    window.hostTrackApp.showAuth();
    console.log('Authentication cleared');
};