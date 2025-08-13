const express = require('express');
const router = express.Router();
const advancedAnalyticsController = require('../controllers/advancedAnalyticsController');
const authenticateToken = require('../middleware/auth');

// Advanced analytics endpoints
router.get('/advanced', authenticateToken, advancedAnalyticsController.getAdvancedAnalytics);
router.get('/comparative', authenticateToken, advancedAnalyticsController.getComparativeAnalytics);
router.get('/anomalies', authenticateToken, advancedAnalyticsController.getAnomalyDetection);
router.get('/trends', authenticateToken, advancedAnalyticsController.getTrendAnalysis);

module.exports = router;
