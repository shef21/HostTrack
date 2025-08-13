const express = require('express');
const { createUserClient } = require('../config/supabase');
const authenticateUser = require('../middleware/auth');
const router = express.Router();

// Test endpoint to verify Supabase connection
router.get('/', async (req, res) => {
  try {
    res.json({
      message: 'Backend is working!',
      supabaseUrl: process.env.SUPABASE_URL ? 'Configured' : 'Not configured',
      supabaseKey: process.env.SUPABASE_ANON_KEY ? 'Configured' : 'Not configured'
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'Test failed' });
  }
});

// Test authentication context
router.get('/auth-context', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({
        message: 'No token provided - testing without authentication',
        jwt_claims: null,
        auth_uid: null
      });
    }
    
    const token = authHeader.split(' ')[1];
    const userClient = createUserClient(token);
    
    // Test query to check auth context
    const { data, error } = await userClient
      .from('profiles')
      .select('id, name')
      .limit(1);
    
    res.json({
      message: 'Authentication context test',
      has_token: !!token,
      token_length: token ? token.length : 0,
      query_result: data,
      query_error: error,
      note: 'If you see data, auth context is working. If empty array, RLS is working correctly.'
    });
    
  } catch (error) {
    console.error('Auth context test error:', error);
    res.status(500).json({ error: 'Auth context test failed', details: error.message });
  }
});

// Test RLS with authenticated user
router.get('/admin-test', authenticateUser, async (req, res) => {
  try {
    const userClient = createUserClient(req.headers.authorization?.split(' ')[1]);
    const { data, error } = await userClient
      .from('profiles')
      .select('id, name')
      .limit(5);
    
    res.json({
      message: 'Authenticated user test (respects RLS)',
      user_id: req.user.id,
      data_count: data ? data.length : 0,
      data: data,
      error: error
    });
    
  } catch (error) {
    console.error('Authenticated test error:', error);
    res.status(500).json({ error: 'Authenticated test failed', details: error.message });
  }
});

module.exports = router; 