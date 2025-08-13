const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authenticateUser = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Dashboard overview data
router.get('/dashboard', analyticsController.getDashboardData);

// Revenue analytics
router.get('/revenue', analyticsController.getRevenueAnalytics);

// Occupancy analytics
router.get('/occupancy', analyticsController.getOccupancyAnalytics);

// Expenses analytics
router.get('/expenses', analyticsController.getExpensesAnalytics);

// Debug endpoint to list all user data
router.get('/debug/user-data', analyticsController.listAllUserData);

module.exports = router; 