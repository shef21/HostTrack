#!/usr/bin/env node

/**
 * Local Setup Test Script
 * This script tests the local development environment configuration
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test functions
async function testEnvironmentFile() {
  logInfo('Testing environment configuration...');
  
  if (fs.existsSync('.env.local')) {
    logSuccess('.env.local file exists');
    
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET'];
    const missingVars = [];
    
    requiredVars.forEach(varName => {
      if (!envContent.includes(varName) || envContent.includes(`${varName}=your_local_`)) {
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length === 0) {
      logSuccess('All required environment variables are configured');
    } else {
      logWarning(`Missing or incomplete environment variables: ${missingVars.join(', ')}`);
    }
  } else {
    logError('.env.local file not found. Please copy env.local.example to .env.local and configure it.');
    return false;
  }
  
  return true;
}

async function testDependencies() {
  logInfo('Testing dependencies...');
  
  const packageFiles = ['package.json', 'backend/package.json', 'web/package.json'];
  const missingFiles = [];
  
  packageFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logSuccess(`${file} exists`);
    } else {
      missingFiles.push(file);
      logError(`${file} missing`);
    }
  });
  
  if (missingFiles.length > 0) {
    logWarning('Some package files are missing. Run: npm run install:all');
    return false;
  }
  
  return true;
}

async function testPortAvailability() {
  logInfo('Testing port availability...');
  
  const ports = [3000, 3001];
  const availablePorts = [];
  
  for (const port of ports) {
    try {
      const isAvailable = await new Promise((resolve) => {
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
      
      if (isAvailable) {
        logSuccess(`Port ${port} is available`);
        availablePorts.push(port);
      } else {
        logWarning(`Port ${port} is in use`);
      }
    } catch (error) {
      logError(`Error checking port ${port}: ${error.message}`);
    }
  }
  
  return availablePorts.length === ports.length;
}

async function testFileStructure() {
  logInfo('Testing file structure...');
  
  const requiredFiles = [
    'start-local.js',
    'LOCAL_SETUP.md',
    'backend/config/local.js',
    'web/config/local.js'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logSuccess(`${file} exists`);
    } else {
      logError(`${file} missing`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

async function testScripts() {
  logInfo('Testing npm scripts...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts || {};
    
    const requiredScripts = ['dev', 'dev:backend', 'dev:frontend', 'install:all'];
    const missingScripts = [];
    
    requiredScripts.forEach(script => {
      if (scripts[script]) {
        logSuccess(`Script '${script}' exists`);
      } else {
        missingScripts.push(script);
        logError(`Script '${script}' missing`);
      }
    });
    
    if (missingScripts.length > 0) {
      logWarning('Some required scripts are missing from package.json');
      return false;
    }
    
    return true;
  } catch (error) {
    logError(`Error reading package.json: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  log('🧪 Running Local Setup Tests', 'blue');
  log('', 'reset');
  
  const tests = [
    { name: 'Environment Configuration', fn: testEnvironmentFile },
    { name: 'Dependencies', fn: testDependencies },
    { name: 'File Structure', fn: testFileStructure },
    { name: 'NPM Scripts', fn: testScripts },
    { name: 'Port Availability', fn: testPortAvailability }
  ];
  
  const results = [];
  
  for (const test of tests) {
    log(`\nRunning: ${test.name}`, 'blue');
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      logError(`Test failed with error: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  log('\n📊 Test Results Summary', 'blue');
  log('', 'reset');
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}: PASSED`);
    } else {
      logError(`${result.name}: FAILED`);
    }
  });
  
  log('', 'reset');
  log(`Overall: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'red');
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Your local environment is ready.', 'green');
    log('Run "npm run dev" to start development servers.', 'blue');
  } else {
    log('\n⚠️  Some tests failed. Please fix the issues above before proceeding.', 'yellow');
    log('Refer to LOCAL_SETUP.md for detailed setup instructions.', 'blue');
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(error => {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests };
