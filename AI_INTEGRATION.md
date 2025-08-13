# 🤖 AI Chat Integration Guide

This guide shows you how to connect your HostTrack chat widget to real AI services for enhanced customer communication.

## 🚀 Quick Integration Options

### **Option 1: OpenAI GPT (Recommended)**

1. **Get API Key**:
   - Sign up at [platform.openai.com](https://platform.openai.com)
   - Create an API key in your dashboard
   - Add billing information

2. **Update Chat Manager**:
   Replace the `getAIResponse` method in `web/js/chat.js`:

```javascript
async getAIResponse(userMessage) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer YOUR_OPENAI_API_KEY`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful property management assistant for HostTrack. 
                        Help users with property management, bookings, revenue tracking, 
                        and general support. Be friendly and professional.`
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('AI API Error:', error);
        return this.getDefaultResponse();
    }
}
```

### **Option 2: Anthropic Claude**

```javascript
async getAIResponse(userMessage) {
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'YOUR_ANTHROPIC_API_KEY',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 500,
                messages: [
                    {
                        role: 'user',
                        content: `You are a property management assistant. Help with: ${userMessage}`
                    }
                ]
            })
        });

        const data = await response.json();
        return data.content[0].text;
    } catch (error) {
        console.error('AI API Error:', error);
        return this.getDefaultResponse();
    }
}
```

### **Option 3: Google Gemini**

```javascript
async getAIResponse(userMessage) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_GEMINI_API_KEY`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a property management assistant. Help with: ${userMessage}`
                    }]
                }]
            })
        });

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('AI API Error:', error);
        return this.getDefaultResponse();
    }
}
```

## 🔧 Advanced Features

### **Context-Aware Responses**

Add property data context to your AI prompts:

```javascript
async getAIResponse(userMessage) {
    // Get current user's property data
    const userProperties = await this.getUserProperties();
    const userBookings = await this.getUserBookings();
    
    const context = `
        User has ${userProperties.length} properties:
        ${userProperties.map(p => `- ${p.name}: ${p.location}`).join('\n')}
        
        Recent bookings: ${userBookings.length} this month
        
        User question: ${userMessage}
    `;

    // Send to AI with context
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a property management assistant. Use the provided context to give personalized responses.'
                },
                {
                    role: 'user',
                    content: context
                }
            ]
        })
    });

    const data = await response.json();
    return data.choices[0].message.content;
}
```

### **Multi-Language Support**

```javascript
async getAIResponse(userMessage) {
    // Detect language
    const language = this.detectLanguage(userMessage);
    
    const systemPrompt = language === 'es' 
        ? 'Eres un asistente de gestión de propiedades. Responde en español.'
        : 'You are a property management assistant. Respond in English.';

    // Send to AI with language context
    // ... API call with language-specific prompt
}
```

### **File Upload Support**

```javascript
async handleFileUpload(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'assistants');

    // Upload to OpenAI
    const uploadResponse = await fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
    });

    const fileData = await uploadResponse.json();
    
    // Use file in conversation
    this.addFileToContext(fileData.id);
}
```

## 🔒 Security Best Practices

### **API Key Management**

1. **Environment Variables**:
   ```javascript
   // Use environment variables in production
   const apiKey = process.env.OPENAI_API_KEY || 'your-dev-key';
   ```

2. **Backend Proxy** (Recommended):
   ```javascript
   // Instead of calling AI API directly from frontend
   async getAIResponse(userMessage) {
       const response = await fetch('/api/chat', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ message: userMessage })
       });
       return response.json();
   }
   ```

3. **Rate Limiting**:
   ```javascript
   class RateLimiter {
       constructor(maxRequests = 10, timeWindow = 60000) {
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
   }
   ```

## 📊 Analytics & Monitoring

### **Track Chat Usage**

```javascript
class ChatAnalytics {
    trackMessage(userMessage, aiResponse, responseTime) {
        // Send to analytics service
        analytics.track('chat_message', {
            message_length: userMessage.length,
            response_time: responseTime,
            user_id: this.getCurrentUserId(),
            timestamp: new Date().toISOString()
        });
    }

    trackSatisfaction(messageId, rating) {
        analytics.track('chat_satisfaction', {
            message_id: messageId,
            rating: rating,
            user_id: this.getCurrentUserId()
        });
    }
}
```

### **Error Handling**

```javascript
async getAIResponse(userMessage) {
    try {
        const startTime = Date.now();
        const response = await this.callAIAPI(userMessage);
        const responseTime = Date.now() - startTime;

        // Track successful response
        this.analytics.trackMessage(userMessage, response, responseTime);
        
        return response;
    } catch (error) {
        // Log error
        console.error('AI Chat Error:', error);
        
        // Track error
        this.analytics.trackError(error);
        
        // Fallback to default response
        return this.getDefaultResponse();
    }
}
```

## 🎯 Customization Options

### **Branded Responses**

```javascript
const brandPersonality = {
    tone: 'professional yet friendly',
    style: 'helpful and informative',
    expertise: 'property management and hospitality',
    language: 'clear and concise'
};

// Include in AI system prompt
const systemPrompt = `You are a ${brandPersonality.tone} property management assistant. 
Your style is ${brandPersonality.style} and you specialize in ${brandPersonality.expertise}. 
Use ${brandPersonality.language} language.`;
```

### **Industry-Specific Knowledge**

```javascript
const propertyManagementContext = `
    Key areas of expertise:
    - Short-term rental management
    - Booking platform integration (Airbnb, Booking.com)
    - Revenue optimization and pricing strategies
    - Guest communication and satisfaction
    - Property maintenance and housekeeping
    - Legal compliance and regulations
    - Financial reporting and analytics
`;
```

## 🚀 Deployment Checklist

- [ ] **API Key Security**: Store keys securely (environment variables or backend)
- [ ] **Rate Limiting**: Implement request limits to control costs
- [ ] **Error Handling**: Graceful fallbacks for API failures
- [ ] **Monitoring**: Track usage, errors, and user satisfaction
- [ ] **Testing**: Test with various user scenarios
- [ ] **Documentation**: Update user guides with AI features
- [ ] **Backup**: Keep fallback responses for offline scenarios

## 💰 Cost Optimization

### **Token Management**

```javascript
class TokenManager {
    constructor(maxTokens = 1000) {
        this.maxTokens = maxTokens;
        this.conversationHistory = [];
    }

    addToHistory(message) {
        this.conversationHistory.push(message);
        
        // Keep only recent messages to control token usage
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }
    }

    getOptimizedPrompt(userMessage) {
        const recentContext = this.conversationHistory.slice(-3);
        return {
            system: 'You are a property management assistant.',
            messages: [
                ...recentContext,
                { role: 'user', content: userMessage }
            ]
        };
    }
}
```

### **Caching Responses**

```javascript
class ResponseCache {
    constructor() {
        this.cache = new Map();
        this.ttl = 3600000; // 1 hour
    }

    get(key) {
        const item = this.cache.get(key);
        if (item && Date.now() - item.timestamp < this.ttl) {
            return item.response;
        }
        return null;
    }

    set(key, response) {
        this.cache.set(key, {
            response,
            timestamp: Date.now()
        });
    }
}
```

---

**Your AI chat is now ready for production!** 🎉

Choose the integration option that best fits your needs and budget. Start with OpenAI for the best results, then optimize based on your usage patterns. 