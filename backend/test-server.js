/**
 * Test Server for HostTrack CSV Import Backend
 * This is a development server for testing the API endpoints
 */

const express = require('express');
const cors = require('cors');
const propertiesRoutes = require('./routes/properties');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'HostTrack CSV Import Backend'
    });
});

// API routes
app.use('/api/properties', propertiesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 HostTrack CSV Import Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🏠 Properties API: http://localhost:${PORT}/api/properties`);
    console.log(`🔍 Duplicate check: http://localhost:${PORT}/api/properties/check-duplicate`);
    console.log(`🌐 CORS enabled for: http://localhost:8000`);
});

module.exports = app;
