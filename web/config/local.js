/**
 * Local Development Configuration
 * This file contains settings specific to local development environment
 */

module.exports = {
  // Server Configuration
  server: {
    port: process.env.FRONTEND_PORT || 3000,
    host: 'localhost'
  },

  // API Configuration
  api: {
    baseUrl: process.env.BACKEND_URL || 'http://localhost:3001',
    timeout: 10000,
    retries: 3
  },

  // Development Features
  development: {
    enableHotReload: true,
    enableDebugMode: process.env.DEBUG === 'true',
    enableConsoleLogging: true
  },

  // Static File Configuration
  static: {
    cacheControl: 'no-cache',
    enableCompression: false
  }
};
