const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// CORS configuration for production
const corsOptions = {
  origin: [
    'https://host-track.vercel.app',  // Production Vercel frontend
    'http://localhost:3000',          // Local development frontend
    'http://localhost:5000'           // Alternative local port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Basic middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'web')));

// Simple test endpoint
app.get('/health', (req, res) => {
  console.log('Health endpoint called');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Server is running!'
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ 
    message: 'Backend is working!',
    supabaseUrl: process.env.SUPABASE_URL ? 'Configured' : 'Missing',
    supabaseKey: process.env.SUPABASE_ANON_KEY ? 'Configured' : 'Missing'
  });
});

// Function to get relevant context from Supabase
async function getRelevantContext(query, userId) {
  try {
    const contextParts = [];
    
    // Get real Cape Town competitor data for market insights
    const { data: competitors, error: competitorsError } = await supabase
      .from('cape_town_competitors')
      .select('*');
    
    if (!competitorsError && competitors && competitors.length > 0) {
      contextParts.push("🏙️ Cape Town Market Data (Live):");
      
      // Calculate market statistics
      const prices = competitors.filter(comp => comp.current_price).map(comp => comp.current_price);
      const ratings = competitors.filter(comp => comp.rating).map(comp => comp.rating);
      const areas = competitors.filter(comp => comp.area).map(comp => comp.area);
      
      if (prices.length > 0) {
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        contextParts.push(`- Average Price: R${Math.round(avgPrice)}/night`);
        contextParts.push(`- Price Range: R${minPrice} - R${maxPrice}`);
      }
      
      if (ratings.length > 0) {
        const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        contextParts.push(`- Average Rating: ${avgRating.toFixed(1)}/5`);
      }
      
      // Show top properties by area
      const areaStats = {};
      competitors.forEach(comp => {
        const area = comp.area || 'Unknown';
        if (!areaStats[area]) {
          areaStats[area] = [];
        }
        areaStats[area].push(comp);
      });
      
      contextParts.push("\n📍 Area Breakdown:");
      Object.entries(areaStats).forEach(([area, props]) => {
        if (props.length > 0) {
          const areaPrices = props.filter(p => p.current_price).map(p => p.current_price);
          if (areaPrices.length > 0) {
            const avgAreaPrice = areaPrices.reduce((sum, price) => sum + price, 0) / areaPrices.length;
            contextParts.push(`- ${area}: R${Math.round(avgAreaPrice)}/night (${props.length} properties)`);
          }
        }
      });
      
      // Show top performing properties
      const topProperties = competitors
        .filter(comp => comp.rating)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);
      
      if (topProperties.length > 0) {
        contextParts.push("\n⭐ Top Performing Properties:");
        topProperties.forEach(prop => {
          contextParts.push(`- ${prop.title} in ${prop.area}: R${prop.current_price}/night, ${prop.rating}/5 (${prop.review_count} reviews)`);
        });
      }
    }
    
    // Get user profile information
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!profileError && profile) {
        contextParts.push(`\n👤 User Profile:`);
        contextParts.push(`- Name: ${profile.name || 'Unknown'}`);
        contextParts.push(`- Currency: ${profile.settings?.currency || 'ZAR'}`);
        contextParts.push(`- Timezone: ${profile.settings?.timezone || 'Africa/Johannesburg'}`);
      }
    } catch (error) {
      // Skip if profiles table doesn't exist or user not found
    }
    
    // Get user's properties from Host Track (if any)
    try {
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');
      
      if (!propertiesError && properties && properties.length > 0) {
        contextParts.push("\n🏠 Your Properties:");
        properties.forEach(prop => {
          contextParts.push(`- ${prop.name}: ${prop.property_type} with ${prop.bedrooms} bedrooms`);
        });
      }
    } catch (error) {
      // Skip if properties table doesn't exist
    }
    
    return contextParts.join('\n');
    
  } catch (error) {
    console.error('Error getting context:', error);
    return '';
  }
}

// AI Chat endpoints
app.post('/api/chat/', async (req, res) => {
  try {
    const { message, conversation_id, user_id } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        response: 'Sorry, AI services are temporarily unavailable. Please try again later.'
      });
    }

    // Import OpenAI dynamically
    const { OpenAI } = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Get relevant context from Supabase
    const context = await getRelevantContext(message, user_id);

    // Prepare the system prompt for property intelligence with real data
    const systemPrompt = `You are Nathi, an AI Property Intelligence assistant specialized in real estate investment, short-term rental optimization, and property portfolio management. 

You help users with:
- Property investment analysis and ROI calculations
- Market trends and pricing strategies
- Airbnb and short-term rental optimization
- Portfolio management and diversification
- Real estate market insights for South Africa, particularly Cape Town

${context ? `\nCurrent market data and user context:\n${context}\n` : ''}

Always provide helpful, accurate, and actionable advice based on the provided context. Be conversational but professional. If you need more information to give a good answer, ask clarifying questions.`;

    // Call OpenAI API with context
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;

    const response = {
      response: aiResponse,
      conversation_id: conversation_id || `conv_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Chat endpoint error:', error);
    
    // Fallback response if OpenAI fails
    const fallbackResponse = {
      response: "I'm having trouble connecting to my AI services right now. Please try again in a moment, or contact support if the issue persists.",
      conversation_id: conversation_id || `conv_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(fallbackResponse);
  }
});

app.get('/api/chat/conversations/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  res.json({ 
    conversation_id: conversationId,
    messages: [],
    message: 'Conversation history not implemented yet'
  });
});

// Debug endpoint to check file structure
app.get('/debug/files', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const webPath = path.join(__dirname, '../web');
    const jsPath = path.join(webPath, 'js');
    const rootPath = path.dirname(__dirname);
    
    const webExists = fs.existsSync(webPath);
    const jsExists = fs.existsSync(jsPath);
    const rootExists = fs.existsSync(rootPath);
    
    let webFiles = [];
    let jsFiles = [];
    let rootFiles = [];
    
    if (webExists) {
      webFiles = fs.readdirSync(webPath);
    }
    
    if (jsExists) {
      jsFiles = fs.readdirSync(jsPath);
    }
    
    if (rootExists) {
      rootFiles = fs.readdirSync(rootPath);
    }
    
    res.json({
      webPath,
      webExists,
      webFiles,
      jsPath,
      jsExists,
      jsFiles,
      rootPath,
      rootExists,
      rootFiles,
      currentDir: __dirname,
      parentDir: path.dirname(__dirname)
    });
  } catch (error) {
    res.json({
      error: error.message,
      webPath: path.join(__dirname, '../web'),
      currentDir: __dirname
    });
  }
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/services', require('./routes/services'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/realtime', require('./routes/realtime'));
app.use('/api/test', require('./routes/test'));
app.use('/api/advanced-analytics', require('./routes/advancedAnalytics'));

// Serve frontend routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web/homepage.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'web/app.html'));
});

// Catch-all route for frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'web/index.html'));
});

// Use different port for backend to avoid conflicts with frontend
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`🏠 Properties endpoints: http://localhost:${PORT}/api/properties`);
  console.log(`🔧 Services endpoints: http://localhost:${PORT}/api/services`);
  console.log(`📅 Bookings endpoints: http://localhost:${PORT}/api/bookings`);
  console.log(`💰 Expenses endpoints: http://localhost:${PORT}/api/expenses`);
  console.log(`📊 Analytics endpoints: http://localhost:${PORT}/api/analytics`);
  console.log(`🤖 AI Chat with real-time data: http://localhost:${PORT}/api/chat`);
  console.log(`🌐 Frontend files served from: ${path.join(__dirname, 'web')}`);
});