# 🔧 Backend AI Chat Setup Guide

## 🚀 **Environment Configuration**

To enable the AI chat backend, you need to set up environment variables:

### **1. Create `.env` file in backend directory**

```bash
cd backend
touch .env
```

### **2. Add the following environment variables:**

```env
# Supabase Configuration (you already have these)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# AI Chat Configuration (NEW - you need this)
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development
```

### **3. Get Your Gemini API Key:**

1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file

## 🔐 **Security Features**

### **What's Now Secure:**
- ✅ **API Key Hidden**: Users never see your Gemini API key
- ✅ **Authentication Required**: Only logged-in users can access AI chat
- ✅ **Rate Limiting**: 15 requests per minute per user
- ✅ **User Isolation**: Each user's requests are tracked separately
- ✅ **Backend Validation**: All requests go through your secure backend

### **What Users Experience:**
- 🔑 **No API Key Input**: Users just chat, no setup required
- 🚀 **Instant Access**: Works immediately after login
- 📱 **Mobile Ready**: Responsive design for all devices
- 💬 **Professional Chat**: Enterprise-grade interface

## 🚀 **Starting the Backend**

### **1. Install Dependencies:**
```bash
cd backend
npm install
```

### **2. Set Environment Variables:**
- Copy your Gemini API key to `.env` file
- Ensure Supabase credentials are set

### **3. Start the Server:**
```bash
npm start
# or
node server.js
```

### **4. Verify AI Chat Endpoints:**
- Health check: `http://localhost:3001/api/ai-chat/health`
- Chat endpoint: `http://localhost:3001/api/ai-chat/chat`
- Status endpoint: `http://localhost:3001/api/ai-chat/status`

## 🧪 **Testing the Integration**

### **1. Backend Health Check:**
```bash
curl http://localhost:3001/api/ai-chat/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "AI Chat Backend",
  "timestamp": "2024-01-XX...",
  "geminiConfigured": true
}
```

### **2. Test Chat (requires auth):**
```bash
curl -X POST http://localhost:3001/api/ai-chat/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{"message": "How can I improve my property bookings?"}'
```

## 🔍 **Troubleshooting**

### **Common Issues:**

**"GEMINI_API_KEY not configured"**
- Check your `.env` file exists
- Verify the API key is set correctly
- Restart the backend server

**"User not authenticated"**
- Ensure user is logged in
- Check auth token is valid
- Verify auth middleware is working

**"Rate limit exceeded"**
- Wait for the rate limit window to reset
- Check if multiple users are hitting limits
- Adjust rate limiting in `ai-chat.js` if needed

### **Debug Mode:**
Check backend console for:
- API request logs
- Rate limiting information
- Gemini API responses
- Error details

## 📊 **Monitoring & Analytics**

### **What's Tracked:**
- User chat requests
- Response times
- Rate limit usage
- Error rates
- API usage patterns

### **Logs to Watch:**
```bash
# Backend console shows:
AI Chat - User: user123, Message: How can I improve my property...
Rate limit exceeded for user: user123
Gemini API error: 429, Quota exceeded
```

## 🎯 **Next Steps**

### **Phase 3A Complete:**
- ✅ Secure backend AI chat proxy
- ✅ User authentication integration
- ✅ Rate limiting and monitoring
- ✅ Professional frontend interface

### **Ready for Phase 3B:**
- Advanced analytics dashboard
- Custom widget builder
- AI-powered insights
- Performance optimization

## 🌟 **Benefits Achieved**

1. **Security**: API key never exposed to users
2. **Scalability**: Single API key for unlimited users
3. **Cost Control**: Centralized usage monitoring
4. **User Experience**: No setup required, instant access
5. **Professional**: Enterprise-grade security and performance

---

**Your AI chat is now production-ready with enterprise security!** 🚀
