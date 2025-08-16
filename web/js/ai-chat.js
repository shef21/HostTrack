/**
 * Nathi Chat Integration for HostTrack Dashboard
 * Works with the integrated Nathi chat interface in the dashboard
 */

// Rate Limiter Class
class RateLimiter {
    constructor(maxRequests, timeWindow) {
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
        this.requests = [];
    }

    canMakeRequest() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.timeWindow);
        
        if (this.requests.length < this.maxRequests) {
            this.requests.push(now);
            return true;
        }
        return false;
    }

    getTimeUntilReset() {
        if (this.requests.length === 0) return 0;
        const oldestRequest = Math.min(...this.requests);
        return Math.max(0, oldestRequest + this.timeWindow - Date.now());
    }
}

class AIChatIntegration {
    constructor() {
        try {
            this.isLoading = false;
            this.conversationHistory = [];
            this.maxHistoryLength = 10;
            this.lastUserMessage = '';
            this.lastAIResponse = '';
            this.conversationTopics = new Set();
            
            // API configuration - Use Supabase instead of localhost backend
            this.apiBaseUrl = ''; // No localhost backend needed
            
            this.rateLimiter = new RateLimiter(15, 60000); // 15 requests per minute
            
            this.init();
        } catch (error) {
            console.error('🔍 AI Chat: Constructor error:', error);
            throw error;
        }
    }

    init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.setupIntegration();
                });
            } else {
                this.setupIntegration();
            }
        } catch (error) {
            console.error('🔍 AI Chat: Init method error:', error);
            throw error;
        }
    }

    setupIntegration() {
        // Clean up any duplicate elements first
        this.cleanupDuplicateElements();
        
        // Check if integrated chat exists
        const integratedChat = document.querySelector('.ai-assistant-section');
        if (!integratedChat) {
            console.warn('🔍 AI Chat: Integrated chat interface not found in dashboard');
            return;
        }

        // Setup event handlers
        this.bindEvents();
        
        // Check authentication status
        this.checkAuthStatus();
        
        // Set up periodic cleanup to catch any new duplicates
        this.startPeriodicCleanup();
    }

    startPeriodicCleanup() {
        // Run cleanup once after 5 seconds, then every 30 seconds
        setTimeout(() => {
            this.cleanupDuplicateElements();
            
            // Set up periodic cleanup every 30 seconds
            setInterval(() => {
                this.cleanupDuplicateElements();
            }, 30000); // Every 30 seconds
        }, 5000);
    }

    cleanupDuplicateElements() {
        // Remove any old floating chat widgets
        const oldWidgets = document.querySelectorAll('#ai-chat-widget, .ai-chat-widget');
        oldWidgets.forEach(widget => widget.remove());
        
        // Remove any duplicate AI assistant sections
        const allSections = document.querySelectorAll('.ai-assistant-section');
        if (allSections.length > 1) {
            for (let i = 1; i < allSections.length; i++) {
                allSections[i].remove();
            }
        }
        
        // Remove any AI chat sections created by phase3Dashboard
        const phase3AIChat = document.getElementById('ai-chat-section');
        if (phase3AIChat) {
            phase3AIChat.remove();
        }
        
        // Remove any other AI-related duplicate elements
        const duplicateElements = document.querySelectorAll('[id*="ai-chat"], [class*="ai-chat"]');
        duplicateElements.forEach((el) => {
            if (el.closest('.ai-assistant-section')) {
                // Keep elements within the main AI assistant section
                return;
            }
            if (el.id === 'ai-chat-section' || el.className.includes('ai-chat-section')) {
                el.remove();
            }
        });
    }

    bindEvents() {
        // Send message button
        const sendButton = document.getElementById('ai-chat-send');
        if (sendButton) {
            sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        // Input field events
        const input = document.getElementById('ai-chat-input');
        if (input) {
            // Enter key to send
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Auto-resize textarea
            input.addEventListener('input', (e) => {
                this.autoResizeTextarea(e.target);
            });
        }

        // Quick action buttons
        this.bindQuickActions();
    }

    bindQuickActions() {
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = button.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    async handleQuickAction(action) {
        // Get some basic context for more personalized responses
        let context = '';
        try {
            if (window.apiService && window.apiService.isAuthenticated()) {
                // Try to get basic property info for context
                const propertiesResponse = await window.apiService.getProperties();
                if (propertiesResponse && propertiesResponse.length > 0) {
                    const propertyCount = propertiesResponse.length;
                    const firstProperty = propertiesResponse[0];
                    context = `I can see you have ${propertyCount} property(ies), including ${firstProperty.name} in ${firstProperty.location}. `;
                }
            }
        } catch (error) {
            console.log('Could not fetch property context for quick action:', error);
        }
        
        // Add topic to conversation topics
        const actionTopics = {
            'analyze-performance': 'analytics',
            'optimize-pricing': 'revenue',
            'booking-insights': 'bookings',
            'property-tips': 'properties',
            'trend-analysis': 'analytics',
            'revenue-forecast': 'analytics',
            'occupancy-prediction': 'analytics',
            'expense-forecast': 'analytics',
            'smart-pricing': 'revenue',
            'marketing-strategy': 'analytics',
            'property-improvements': 'properties',
            'investment-opportunities': 'analytics',
            'competitor-analysis': 'analytics',
            'market-trends': 'analytics',
            'competitive-advantages': 'analytics',
            'market-opportunities': 'analytics'
        };
        
        const topic = actionTopics[action] || 'general';
        this.conversationTopics.add(topic);
        
        const actionMessages = {
            'analyze-performance': `${context}Let's dive into your property performance! 📊 I can now analyze your 6-month trends, seasonal patterns, and provide predictive insights. What specific metrics would you like to explore?`,
            'optimize-pricing': `${context}Great choice! 🎯 I can now analyze your historical pricing patterns, seasonal trends, and provide data-driven pricing recommendations. Let's find that sweet spot! 💰`,
            'booking-insights': `${context}Perfect! 🔍 I can now uncover 6-month booking patterns, identify peak seasons, and provide occupancy optimization strategies. Let's boost your revenue! 📈`,
            'property-tips': `${context}Excellent! 🌟 I've got enhanced property management insights including trend analysis, seasonal optimization, and performance benchmarking. Let's make your properties shine! ✨`,
            'trend-analysis': `${context}🚀 **NEW FEATURE**: Let me analyze your 6-month performance trends! I can now identify revenue patterns, seasonal peaks, occupancy trends, and provide predictive insights. What would you like to know about your property trends?`,
            'revenue-forecast': `${context}🔮 **PREDICTIVE ANALYTICS**: Let me forecast your revenue for the next 3-6 months! I can now predict future earnings based on your trends, seasonal patterns, and market dynamics. What would you like to know about your revenue forecast?`,
            'occupancy-prediction': `${context}📅 **OCCUPANCY FORECASTING**: Let me predict your future occupancy rates! I can now forecast booking patterns, identify peak seasons, and help you optimize your calendar strategy. What would you like to know about your occupancy predictions?`,
            'expense-forecast': `${context}💰 **EXPENSE FORECASTING**: Let me predict your future costs and identify optimization opportunities! I can now forecast expenses, identify cost trends, and suggest budget optimization strategies. What would you like to know about your expense forecast?`,
            'smart-pricing': `${context}💰 **SMART PRICING ENGINE**: Let me analyze your pricing strategy and provide data-driven recommendations! I can now suggest optimal rates based on trends, seasonal patterns, and market demand. What would you like to know about pricing optimization?`,
            'marketing-strategy': `${context}📢 **MARKETING STRATEGY**: Let me recommend the best marketing approaches for your properties! I can now suggest strategies based on occupancy trends, seasonal patterns, and target audience analysis. What would you like to know about marketing optimization?`,
            'property-improvements': `${context}🏠 **PROPERTY IMPROVEMENTS**: Let me calculate ROI for property upgrades and renovations! I can now analyze which improvements will give you the best return on investment. What would you like to know about property improvements?`,
            'investment-opportunities': `${context}🚀 **INVESTMENT OPPORTUNITIES**: Let me identify the best investment opportunities for your portfolio! I can now analyze market trends, seasonal patterns, and growth potential. What would you like to know about investment opportunities?`,
            'competitor-analysis': `${context}🏆 **COMPETITOR ANALYSIS**: Let me analyze your competitive position in the market! I can now provide insights on competitor pricing, market share, and positioning strategies. What would you like to know about your market position?`,
            'market-trends': `${context}📈 **MARKET TRENDS**: Let me analyze broader market trends and demand patterns! I can now identify market opportunities, seasonal demand variations, and growth potential. What would you like to know about market trends?`,
            'competitive-advantages': `${context}⭐ **COMPETITIVE ADVANTAGES**: Let me identify your unique competitive advantages! I can now analyze location benefits, property features, and market positioning strengths. What would you like to know about your competitive edge?`,
            'market-opportunities': `${context}🎯 **MARKET OPPORTUNITIES**: Let me identify the best market opportunities for growth! I can now analyze demand gaps, market saturation, and expansion potential. What would you like to know about market opportunities?`
        };

        const message = actionMessages[action] || 'I\'m here to help! What would you like to know about?';
        
        // Add AI response
        this.addMessage('ai', message);
        
        // Update status
        this.updateStatus('Ready');
        
        // Scroll to bottom
        const messagesContainer = document.getElementById('ai-chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Focus input for follow-up questions
        setTimeout(() => {
            this.focusInput();
        }, 100);
    }

    async sendMessage() {
        const input = document.getElementById('ai-chat-input');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        try {
            // Check authentication
            console.log('🔍 AI Chat: sendMessage - Checking authentication...');
            const token = this.getAuthToken();
            
            if (!token || token === 'placeholder-token') {
                console.log('🔍 AI Chat: sendMessage - No valid token, showing error message');
                this.addMessage('user', message);
                this.addMessage('ai', 'Please log in to use Nathi. You need to be authenticated to access this feature.');
                input.value = '';
                return;
            }
            
            console.log('🔍 AI Chat: sendMessage - Token validation passed, proceeding with message');
        } catch (error) {
            console.error('🔍 AI Chat: sendMessage - Authentication check failed:', error);
            this.addMessage('user', message);
            this.addMessage('ai', 'Authentication required. Please log in to use Nathi.');
            input.value = '';
            return;
        }

        if (!this.rateLimiter.canMakeRequest()) {
            this.addMessage('user', message);
            this.addMessage('ai', 'Oops! 😅 I\'m a bit swamped right now. Give me just a moment to catch up, and then I\'ll be happy to help you! ⏰');
            input.value = '';
            return;
        }

        // Add user message
        this.addMessage('user', message);
        input.value = '';
        this.autoResizeTextarea(input);

        // Show typing indicator
        this.showTyping(true);

        try {
            const response = await this.getAIResponse(message);
            this.addMessage('ai', response);
        } catch (error) {
            console.error('AI Chat Error:', error);
            this.addMessage('ai', `Sorry, I encountered an error: ${error.message}`);
        } finally {
            this.showTyping(false);
        }
    }

    async getAIResponse(userMessage) {
        try {
            // Get authentication token
            const token = this.getAuthToken();
            
            // Prepare enhanced context for the AI
            const topic = this.detectTopic(userMessage);
            const conversationContext = this.getConversationContext();
            
            // Debug logging
            console.log('🔍 AI Chat: Topic detected:', topic);
            console.log('🔍 AI Chat: Conversation context:', conversationContext);
            console.log('🔍 AI Chat: Conversation topics:', Array.from(this.conversationTopics));
            
            // Call our backend AI chat endpoint
            const authHeader = `Bearer ${token}`;
            
            const response = await fetch(`${this.apiBaseUrl}/api/ai-chat/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify({ 
                    message: userMessage,
                    topic: topic,
                    conversationContext: conversationContext,
                    conversationTopics: Array.from(this.conversationTopics)
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                
                if (response.status === 429) {
                    throw new Error(errorData.message || 'Rate limit exceeded. Please wait a moment.');
                } else if (response.status === 401) {
                    throw new Error('Hey there! 👋 I\'d love to chat with you, but I need you to log in first. Once you\'re signed in, I\'ll be here ready to help! 🔐');
                } else {
                    throw new Error(errorData.message || `Request failed: ${response.status}`);
                }
            }

            const data = await response.json();
            
            if (data.success && data.response) {
                return data.response;
            } else {
                throw new Error('Invalid response from AI service');
            }
        } catch (error) {
            console.error('AI Chat Error:', error);
            throw error;
        }
    }

    getAuthToken() {
        try {
            // Method 1: Check if we have a global auth token
            if (window.hostTrackApp && window.hostTrackApp.getAuthToken) {
                return window.hostTrackApp.getAuthToken();
            }
            
            // Method 2: Check if API service has the token
            if (window.apiService && window.apiService.token) {
                console.log('🔍 AI Chat: Found token in API service');
                return window.apiService.token;
            }
            
            // Method 3: Check localStorage as fallback
            const token = localStorage.getItem('authToken');
            if (token) {
                console.log('🔍 AI Chat: Found token in localStorage');
                return token;
            }
            
            console.log('🔍 AI Chat: No authentication token found');
            return null;
        } catch (error) {
            console.error('🔍 AI Chat: Error getting auth token:', error);
            return null;
        }
    }

    addMessage(type, content) {
        // Prevent duplicate messages (unless disabled for testing)
        if (!this.duplicatePreventionDisabled && this.isDuplicateMessage(content, type)) {
            console.log('🔍 AI Chat: Duplicate message detected, skipping:', content.substring(0, 50));
            return;
        }
        
        // Prevent repetitive introductory messages (unless disabled for testing)
        if (!this.duplicatePreventionDisabled && this.shouldPreventRepetition(content, type)) {
            console.log('🔍 AI Chat: Repetitive message detected, skipping:', content.substring(0, 50));
            return;
        }
        
        // Log successful message addition
        console.log(`🔍 AI Chat: Adding ${type} message:`, content.substring(0, 100));
        
        const messagesContainer = document.getElementById('ai-chat-messages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-chat-message ${type}-message`;
        
        const timestamp = this.formatTimestamp(new Date());
        
        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="ai-chat-avatar">👤</div>
                <div class="ai-chat-content">
                    <div class="message-header">
                        <span class="sender-name">You</span>
                        <span class="message-time">${timestamp}</span>
                    </div>
                    <div class="message-text">${this.escapeHtml(content)}</div>
                </div>
            `;
            
            // Update last user message and detect topic
            this.lastUserMessage = content;
            const topic = this.detectTopic(content);
            this.conversationTopics.add(topic);
            
        } else {
            messageDiv.innerHTML = `
                <div class="ai-chat-avatar">👩‍💼</div>
                <div class="ai-chat-content">
                    <div class="message-header">
                        <span class="sender-name">Nathi</span>
                        <span class="message-time">${timestamp}</span>
                    </div>
                    <div class="message-text">${this.formatAIResponse(content)}</div>
                </div>
            `;
            
            // Update last AI response
            this.lastAIResponse = content;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Add to conversation history
        this.conversationHistory.push({ type, content, timestamp: Date.now() });
        
        // Keep history manageable
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
    }

    formatTimestamp(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    formatAIResponse(content) {
        // Convert markdown-like formatting to HTML
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showTyping(show) {
        const typing = document.getElementById('ai-chat-typing');
        if (typing) {
            if (show) {
                typing.classList.remove('hidden');
                this.updateStatus('Nathi is thinking... 🤔');
            } else {
                typing.classList.add('hidden');
                this.updateStatus('Ready to chat! 😊');
            }
        }
    }

    updateStatus(status) {
        const statusElement = document.getElementById('ai-chat-status-text');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    focusInput() {
        const input = document.getElementById('ai-chat-input');
        if (input) {
            input.focus();
        }
    }

    clearInput() {
        const input = document.getElementById('ai-chat-input');
        if (input) {
            input.value = '';
            input.style.height = 'auto';
        }
    }

    clearConversation() {
        // Clear conversation history
        this.conversationHistory = [];
        this.lastUserMessage = '';
        this.lastAIResponse = '';
        this.conversationTopics.clear();
        
        // Clear messages from UI
        const messagesContainer = document.getElementById('ai-chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        
        console.log('🔍 AI Chat: Conversation cleared');
    }

    resetConversationState() {
        this.lastUserMessage = '';
        this.lastAIResponse = '';
        this.conversationTopics.clear();
        console.log('🔍 AI Chat: Conversation state reset');
    }

    // Temporary method to disable duplicate prevention for testing
    disableDuplicatePrevention() {
        console.log('🔍 AI Chat: Duplicate prevention disabled for testing');
        this.duplicatePreventionDisabled = true;
    }

    // Re-enable duplicate prevention
    enableDuplicatePrevention() {
        console.log('🔍 AI Chat: Duplicate prevention re-enabled');
        this.duplicatePreventionDisabled = false;
    }

    // Test topic detection
    testTopicDetection(message) {
        const topic = this.detectTopic(message);
        console.log(`🔍 AI Chat: Message: "${message}"`);
        console.log(`🔍 AI Chat: Detected topic: ${topic}`);
        return topic;
    }

    // Show what context would be sent to AI
    showAIContext(message) {
        const topic = this.detectTopic(message);
        const conversationContext = this.getConversationContext();
        const conversationTopics = Array.from(this.conversationTopics);
        
        console.log('🔍 AI Chat: === AI Context Debug ===');
        console.log('🔍 AI Chat: User message:', message);
        console.log('🔍 AI Chat: Detected topic:', topic);
        console.log('🔍 AI Chat: Conversation context:', conversationContext);
        console.log('🔍 AI Chat: Conversation topics:', conversationTopics);
        console.log('🔍 AI Chat: ========================');
        
        return { topic, conversationContext, conversationTopics };
    }

    async checkAuthStatus() {
        try {
            // Wait for main app to be initialized
            let attempts = 0;
            const maxAttempts = 10;
            
            while (attempts < maxAttempts) {
                if (window.hostTrackApp && window.hostTrackApp.getAuthToken) {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
            
            if (attempts >= maxAttempts) {
                this.updateStatus('Ready to chat! 😊');
                return;
            }
            
            const token = this.getAuthToken();
            
            if (token && token !== 'placeholder-token') {
                this.updateStatus('Ready to chat! 😊');
                console.log('🔍 AI Chat: User authenticated, Nathi ready');
            } else {
                // Show Ready status by default, authentication will be checked when user tries to send a message
                this.updateStatus('Ready to chat! 😊');
                console.log('🔍 AI Chat: User not authenticated, but showing Ready status');
            }
        } catch (error) {
            this.updateStatus('Ready to chat! 😊');
            console.log('🔍 AI Chat: Authentication check failed, showing Ready status:', error.message);
        }
    }

    // Add topic detection methods
    detectTopic(message) {
        const lowerMessage = message.toLowerCase();
        
        // Check for service-specific patterns first (highest priority)
        const servicePatterns = [
            'service', 'services', 'maintenance', 'cleaning', 'repair', 'upkeep', 'maintain',
            'pending service', 'service status', 'maintenance schedule', 'cleaning service',
            'repair service', 'upkeep service', 'service due', 'next service'
        ];
        
        if (servicePatterns.some(pattern => lowerMessage.includes(pattern))) {
            return 'services';
        }
        
        // Check for other topics
        const topics = {
            'properties': ['property', 'house', 'apartment', 'listing', 'accommodation', 'rental', 'real estate', 'property management', 'property performance', 'property details'],
            'bookings': ['booking', 'reservation', 'guest', 'check-in', 'check-out', 'calendar', 'guest booking', 'reservation system', 'occupancy', 'occupancy rate'],
            'revenue': ['revenue', 'income', 'money', 'profit', 'pricing', 'cost', 'earnings', 'financial', 'budget', 'profit margin'],
            'analytics': ['analytics', 'performance', 'metrics', 'data', 'statistics', 'report', 'dashboard', 'insights']
        };
        
        // Check for exact topic matches
        for (const [topic, keywords] of Object.entries(topics)) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                return topic;
            }
        }
        
        // If no specific topic found, return general
        return 'general';
    }

    isDuplicateMessage(message, type) {
        if (type === 'user') {
            // For user messages, only block if it's the exact same message
            return this.lastUserMessage === message;
        } else if (type === 'ai') {
            // For AI messages, only block if it's the exact same response
            // Allow similar responses as they might be legitimate follow-ups
            return this.lastAIResponse === message;
        }
        return false;
    }

    shouldPreventRepetition(message, type) {
        if (type === 'ai') {
            // Only block very specific repetitive introductory patterns
            // Don't block legitimate AI responses that might contain similar phrases
            const repetitivePatterns = [
                "I'm from hosttrack",
                "I'm Nathi, your friendly property management buddy",
                "I'm Nathi, and I'd love to dive into your property performance",
                "I'm Nathi, and I'm excited to help you nail your pricing strategy",
                "I'm Nathi, and I can help you uncover patterns"
            ];
            
            // Check if the ENTIRE message is just a repetitive pattern
            const lowerMessage = message.toLowerCase();
            return repetitivePatterns.some(pattern => 
                lowerMessage === pattern.toLowerCase() || 
                lowerMessage.trim() === pattern.toLowerCase().trim()
            );
        }
        return false;
    }

    getConversationContext() {
        if (this.conversationHistory.length === 0) return '';
        
        const recentMessages = this.conversationHistory.slice(-3);
        const context = recentMessages.map(msg => `${msg.type}: ${msg.content}`).join(' | ');
        return `Recent conversation context: ${context}`;
    }
}

// Initialize Nathi Chat Integration when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🤖 Nathi Chat: DOM ready, initializing integration...');
    
    try {
        window.aiChat = new AIChatIntegration();
        console.log('🤖 Nathi Chat: Integration initialized successfully');
    } catch (error) {
        console.error('🤖 Nathi Chat: Failed to initialize integration:', error);
    }
});

// Fallback initialization
setTimeout(() => {
    if (!window.aiChat) {
        try {
            window.aiChat = new AIChatIntegration();
        } catch (error) {
            console.error('🤖 Nathi Chat: Fallback initialization failed:', error);
        }
    }
}, 1000);
