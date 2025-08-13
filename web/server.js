const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('combined'));

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
    console.log(`🌐 Frontend server running on http://localhost:${PORT}`);
    console.log(`📁 Serving static files from: ${__dirname}`);
    console.log(`🔗 Backend API should be running on: http://localhost:3001`);
}); 