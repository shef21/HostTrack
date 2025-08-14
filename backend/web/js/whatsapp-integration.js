// WhatsApp Integration for HostTrack
// This is a frontend simulation - actual implementation would be backend

class WhatsAppIntegration {
    constructor() {
        this.conversations = new Map();
        this.escalatedRequests = [];
        this.ownerNotifications = [];
    }

    // Simulate receiving a WhatsApp message
    async receiveMessage(clientPhone, message, timestamp = new Date()) {
        console.log(`📱 WhatsApp message from ${clientPhone}: ${message}`);
        
        // Get or create conversation
        let conversation = this.conversations.get(clientPhone);
        if (!conversation) {
            conversation = {
                clientPhone,
                history: [],
                createdAt: timestamp,
                lastActivity: timestamp
            };
            this.conversations.set(clientPhone, conversation);
        }

        // Add message to history
        conversation.history.push({
            type: 'client',
            message,
            timestamp
        });
        conversation.lastActivity = timestamp;

        // Process with AI
        const aiResponse = await this.processWithAI(message, conversation);
        
        // Check if escalation is needed
        if (aiResponse.needsEscalation) {
            await this.escalateToOwner(clientPhone, message, conversation);
        }

        // Send response back to client
        await this.sendResponse(clientPhone, aiResponse.message);
        
        return aiResponse;
    }

    // Process message with AI (using existing Nathi logic)
    async processWithAI(message, conversation) {
        const lowerMessage = message.toLowerCase();
        
        // Check for escalation triggers
        if (this.shouldEscalate(message)) {
            return {
                message: "I've forwarded your request to our team. They'll get back to you shortly!",
                needsEscalation: true,
                urgency: this.assessUrgency(message)
            };
        }

        // Handle common inquiries
        if (lowerMessage.includes('booking') || lowerMessage.includes('reserve')) {
            return {
                message: "Great! I can help with your booking. What dates are you looking for?",
                needsEscalation: false
            };
        }

        if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('rate')) {
            return {
                message: "Our rates vary by season. What dates are you interested in? I can provide current pricing.",
                needsEscalation: false
            };
        }

        if (lowerMessage.includes('check-in') || lowerMessage.includes('arrival')) {
            return {
                message: "Check-in is at 3 PM. I'll send you detailed instructions and key codes closer to your arrival date.",
                needsEscalation: false
            };
        }

        if (lowerMessage.includes('wifi') || lowerMessage.includes('internet')) {
            return {
                message: "WiFi details: Network: HostTrack_Guest, Password: Welcome2024!",
                needsEscalation: false
            };
        }

        if (lowerMessage.includes('amenities') || lowerMessage.includes('facilities')) {
            return {
                message: "Our property includes: WiFi, parking, kitchen, laundry, and stunning views. What specific amenities are you looking for?",
                needsEscalation: false
            };
        }

        // Default response
        return {
            message: "Thanks for your message! I'm here to help with bookings, pricing, check-in details, and any other questions about your stay.",
            needsEscalation: false
        };
    }

    // Determine if message should be escalated
    shouldEscalate(message) {
        const escalationKeywords = [
            'complaint', 'problem', 'issue', 'broken', 'not working',
            'refund', 'cancel', 'dispute', 'unhappy', 'dissatisfied',
            'emergency', 'urgent', 'immediate', 'asap',
            'legal', 'lawyer', 'sue', 'compensation',
            'special', 'custom', 'unique', 'specific request'
        ];

        const lowerMessage = message.toLowerCase();
        return escalationKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    // Assess urgency of escalated request
    assessUrgency(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('asap')) {
            return 'high';
        }
        
        if (lowerMessage.includes('complaint') || lowerMessage.includes('problem')) {
            return 'medium';
        }
        
        return 'low';
    }

    // Escalate request to owner
    async escalateToOwner(clientPhone, message, conversation) {
        const escalatedRequest = {
            id: Date.now(),
            clientPhone,
            message,
            conversation: conversation.history,
            urgency: this.assessUrgency(message),
            status: 'pending',
            createdAt: new Date(),
            ownerResponse: null
        };

        this.escalatedRequests.push(escalatedRequest);
        this.ownerNotifications.push({
            type: 'escalation',
            request: escalatedRequest,
            timestamp: new Date()
        });

        console.log(`🚨 Escalated request from ${clientPhone}: ${message}`);
        
        // In real implementation, this would trigger dashboard notification
        this.updateOwnerDashboard();
    }

    // Send response back to client
    async sendResponse(clientPhone, message) {
        console.log(`📤 WhatsApp response to ${clientPhone}: ${message}`);
        
        // Add to conversation history
        const conversation = this.conversations.get(clientPhone);
        if (conversation) {
            conversation.history.push({
                type: 'ai',
                message,
                timestamp: new Date()
            });
        }

        // In real implementation, this would use WhatsApp Business API
        return { success: true, message };
    }

    // Owner responds to escalated request
    async ownerRespond(clientPhone, response) {
        console.log(`👤 Owner response to ${clientPhone}: ${response}`);
        
        // Find and update escalated request
        const request = this.escalatedRequests.find(r => r.clientPhone === clientPhone && r.status === 'pending');
        if (request) {
            request.status = 'resolved';
            request.ownerResponse = response;
            request.resolvedAt = new Date();
        }

        // Send response to client
        await this.sendResponse(clientPhone, response);
        
        // Update dashboard
        this.updateOwnerDashboard();
    }

    // Get escalated requests for owner dashboard
    getEscalatedRequests() {
        return this.escalatedRequests
            .filter(r => r.status === 'pending')
            .sort((a, b) => {
                // Sort by urgency first, then by creation time
                const urgencyOrder = { high: 3, medium: 2, low: 1 };
                return urgencyOrder[b.urgency] - urgencyOrder[a.urgency] || 
                       new Date(a.createdAt) - new Date(b.createdAt);
            });
    }

    // Get conversation history
    getConversationHistory(clientPhone) {
        return this.conversations.get(clientPhone)?.history || [];
    }

    // Update owner dashboard (in real implementation, this would trigger UI updates)
    updateOwnerDashboard() {
        const pendingRequests = this.getEscalatedRequests();
        console.log(`📊 Dashboard updated: ${pendingRequests.length} pending requests`);
        
        // Emit event for dashboard update
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('whatsapp-update', {
                detail: {
                    escalatedRequests: pendingRequests,
                    notifications: this.ownerNotifications
                }
            }));
        }
    }

    // Get analytics data
    getAnalytics() {
        const totalConversations = this.conversations.size;
        const totalMessages = Array.from(this.conversations.values())
            .reduce((sum, conv) => sum + conv.history.length, 0);
        const escalatedCount = this.escalatedRequests.length;
        const resolvedCount = this.escalatedRequests.filter(r => r.status === 'resolved').length;

        return {
            totalConversations,
            totalMessages,
            escalatedRequests: escalatedCount,
            resolvedRequests: resolvedCount,
            resolutionRate: escalatedCount > 0 ? (resolvedCount / escalatedCount * 100).toFixed(1) : 0
        };
    }
}

// Initialize WhatsApp integration
if (typeof window !== 'undefined') {
    window.whatsappIntegration = new WhatsAppIntegration();
    
    // Listen for dashboard updates
    window.addEventListener('whatsapp-update', (event) => {
        console.log('WhatsApp dashboard update:', event.detail);
        // Update UI components here
    });
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WhatsAppIntegration;
} 