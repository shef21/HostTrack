const { supabaseAuth } = require('../config/supabase');

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('Auth header:', authHeader ? authHeader.substring(0, 20) + '...' : 'No header');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header found');
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Token extracted:', token.substring(0, 20) + '...');
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    
    if (error || !user) {
      console.log('Token validation failed:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    console.log('Token validated for user:', user.id);
    
    // Add user and token to request object
    req.user = {
      ...user,
      token: token
    };
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = authenticateUser; 