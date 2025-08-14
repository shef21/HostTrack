const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
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
app.use('/api/ai-chat', require('./routes/ai-chat'));

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
  console.log(`🤖 AI Chat endpoints: http://localhost:${PORT}/api/ai-chat`);
  console.log(`🌐 Frontend files served from: ${path.join(__dirname, 'web')}`);
});