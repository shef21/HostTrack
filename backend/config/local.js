/**
 * Local Development Configuration
 * This file contains settings specific to local development environment
 */

module.exports = {
  // Server Configuration
  server: {
    port: process.env.BACKEND_PORT || 3001,
    host: 'localhost',
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    }
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    supabase: {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY
    }
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
    bcryptRounds: 10
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    enableConsole: true,
    enableFile: false
  },

  // Development Features
  development: {
    enableDebugEndpoints: process.env.DEBUG === 'true',
    enableMockData: false,
    enableHotReload: true
  }
};
