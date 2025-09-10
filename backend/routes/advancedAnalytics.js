const express = require('express');
const router = express.Router();
const advancedAnalyticsController = require('../controllers/advancedAnalyticsController');
const authenticateToken = require('../middleware/auth');

// Advanced analytics endpoints
router.get('/advanced', authenticateToken, advancedAnalyticsController.getAdvancedAnalytics);
router.get('/comparative', authenticateToken, advancedAnalyticsController.getComparativeAnalytics);
router.get('/anomalies', authenticateToken, advancedAnalyticsController.getAnomalyDetection);
router.get('/trends', authenticateToken, advancedAnalyticsController.getTrendAnalysis);

// AI Chat endpoint - temporary solution until the AI chat route is fixed
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // For now, return a simple response
    const response = {
      success: true,
      response: `I'm sorry, but the AI chat service is currently being upgraded. Your message was: "${message}". Please try again later when the service is fully restored.`,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Sorry, I encountered an error. Please try again.'
    });
  }
});

module.exports = router;
