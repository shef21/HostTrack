const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
// Use different port for frontend to avoid conflicts with backend
const PORT = process.env.FRONTEND_PORT || process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('combined'));

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    logLevel: 'debug'
}));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve homepage.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'homepage.html'));
});

// Serve app.html for authenticated routes
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.html'));
});

// Serve other static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 Frontend server running on port ${PORT}`);
    console.log(`📁 Serving static files from: ${__dirname}`);
    console.log(`🔗 Backend API should be running on: ${process.env.BACKEND_PORT || 3001}`);
}); 