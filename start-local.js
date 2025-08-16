#!/usr/bin/env node

/**
 * Cross-Platform Local Development Startup Script
 * This script manages both backend and frontend servers for local development
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const CONFIG = {
  backend: {
    port: process.env.BACKEND_PORT || 3001,
    path: './backend',
    script: 'npm run dev'
  },
  frontend: {
    port: process.env.FRONTEND_PORT || 3000,
    path: './web',
    script: 'npm run dev'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Port checking function
function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({
      host: 'localhost',
      port: port,
      path: '/',
      method: 'GET'
    }, () => {
      req.destroy();
      resolve(false); // Port is in use
    });

    req.on('error', () => {
      resolve(true); // Port is available
    });

    req.setTimeout(1000, () => {
      req.destroy();
      resolve(true); // Port is available
    });

    req.end();
  });
}

// Kill process on port
async function killPort(port) {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (stdout) {
          const lines = stdout.split('\n');
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length > 4) {
              const pid = parts[4];
              exec(`taskkill /PID ${pid} /F`, () => {});
            }
          });
        }
        resolve();
      });
    } else {
      exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, () => {
        resolve();
      });
    }
  });
}

// Start server function
function startServer(name, config) {
  return new Promise((resolve, reject) => {
    logInfo(`Starting ${name} server on port ${config.port}...`);
    
    const server = spawn(config.script, {
      shell: true,
      cwd: config.path,
      stdio: 'pipe',
      env: { ...process.env, PORT: config.port }
    });

    // Handle output
    server.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[${name}] ${output}`);
      }
    });

    server.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[${name}] ${output}`);
      }
    });

    // Handle process exit
    server.on('close', (code) => {
      if (code !== 0) {
        logError(`${name} server exited with code ${code}`);
        reject(new Error(`${name} server failed to start`));
      }
    });

    // Wait for server to be ready
    setTimeout(async () => {
      const isReady = await checkPort(config.port);
      if (!isReady) {
        logSuccess(`${name} server is running on port ${config.port}`);
        resolve(server);
      } else {
        logWarning(`${name} server might not be ready yet, continuing...`);
        resolve(server);
      }
    }, 3000);
  });
}

// Main startup function
async function startLocal() {
  try {
    log('🚀 Starting HostTrack Local Development Environment', 'bright');
    log('', 'reset');

    // Check if .env.local exists
    if (!fs.existsSync('.env.local')) {
      logWarning('No .env.local file found. Please copy env.local.example to .env.local and configure your settings.');
      log('', 'reset');
    }

    // Clear ports if needed
    logInfo('Checking and clearing ports...');
    await killPort(CONFIG.backend.port);
    await killPort(CONFIG.frontend.port);
    
    // Wait for ports to clear
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check port availability
    const backendPortAvailable = await checkPort(CONFIG.backend.port);
    const frontendPortAvailable = await checkPort(CONFIG.frontend.port);

    if (!backendPortAvailable) {
      logError(`Backend port ${CONFIG.backend.port} is still in use`);
      process.exit(1);
    }

    if (!frontendPortAvailable) {
      logError(`Frontend port ${CONFIG.frontend.port} is still in use`);
      process.exit(1);
    }

    logSuccess('All ports are available');

    // Start servers
    const backend = await startServer('Backend', CONFIG.backend);
    const frontend = await startServer('Frontend', CONFIG.frontend);

    log('', 'reset');
    log('🎉 All servers started successfully!', 'bright');
    log(`📊 Backend: http://localhost:${CONFIG.backend.port}`, 'green');
    log(`🌐 Frontend: http://localhost:${CONFIG.frontend.port}`, 'green');
    log('', 'reset');
    log('💡 Press Ctrl+C to stop all servers', 'cyan');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      log('', 'reset');
      log('🛑 Shutting down servers...', 'yellow');
      
      backend.kill('SIGTERM');
      frontend.kill('SIGTERM');
      
      setTimeout(() => {
        backend.kill('SIGKILL');
        frontend.kill('SIGKILL');
        process.exit(0);
      }, 5000);
    });

    process.on('SIGTERM', () => {
      backend.kill('SIGTERM');
      frontend.kill('SIGTERM');
      process.exit(0);
    });

  } catch (error) {
    logError(`Failed to start servers: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  startLocal();
}

module.exports = { startLocal };
