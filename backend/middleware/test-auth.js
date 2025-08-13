/**
 * Test Authentication Middleware
 * For development and testing purposes only
 * In production, use proper JWT authentication
 */

function testAuthMiddleware(req, res, next) {
    // For testing, we'll use a simple user ID from query params or headers
    // In production, this would verify JWT tokens
    
    // Check if user ID is provided in query params (for testing)
    const testUserId = req.query.test_user_id || req.headers['x-test-user-id'];
    
    if (testUserId) {
        req.user = { id: parseInt(testUserId) };
        next();
    } else {
        // For testing without user ID, use default user ID 1
        req.user = { id: 1 };
        next();
    }
}

module.exports = testAuthMiddleware;
