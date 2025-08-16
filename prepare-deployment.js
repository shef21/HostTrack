#!/usr/bin/env node

/**
 * Deployment Preparation Script
 * This script prepares the project for deployment to production
 * by creating production-ready configurations and removing development-specific files
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
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

function logHeader(message) {
  log(`\n${message}`, 'magenta');
}

// Configuration for production deployment
const PRODUCTION_CONFIG = {
  // Files to exclude from production
  excludeFiles: [
    '.env.local',
    'env.local.example',
    'start-local.js',
    'test-local-setup.js',
    'prepare-deployment.js',
    'LOCAL_SETUP.md',
    'backend/config/local.js',
    'web/config/local.js'
  ],
  
  // Directories to exclude
  excludeDirs: [
    'node_modules',
    '.git',
    '.vscode',
    '*.log'
  ],
  
  // Production environment template
  productionEnv: `# Production Environment Configuration
NODE_ENV=production

# Server Ports (configure based on your hosting provider)
PORT=3000

# Supabase Configuration (Production)
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_supabase_anon_key

# Security (Production - Use strong, unique secrets)
JWT_SECRET=your_production_jwt_secret_here
SESSION_SECRET=your_production_session_secret_here

# Production Settings
DEBUG=false
LOG_LEVEL=info
CORS_ORIGIN=your_production_domain_here
`
};

// Utility functions
function shouldExcludeFile(filePath) {
  const fileName = path.basename(filePath);
  const dirName = path.dirname(filePath);
  
  // Check if file is in exclude list
  if (PRODUCTION_CONFIG.excludeFiles.includes(fileName)) {
    return true;
  }
  
  // Check if file is in excluded directories
  if (PRODUCTION_CONFIG.excludeDirs.some(dir => dirName.includes(dir))) {
    return true;
  }
  
  // Check for log files
  if (fileName.endsWith('.log')) {
    return true;
  }
  
  return false;
}

function createProductionPackageJson() {
  logInfo('Creating production package.json...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Remove development-specific scripts
    const productionScripts = {
      ...packageJson.scripts
    };
    
    delete productionScripts.dev;
    delete productionScripts['dev:backend'];
    delete productionScripts['dev:frontend'];
    delete productionScripts['test:local'];
    
    // Add production scripts
    productionScripts.start = 'cd backend && npm start';
    productionScripts['start:backend'] = 'cd backend && npm start';
    productionScripts['start:frontend'] = 'cd web && npm start';
    
    const productionPackageJson = {
      ...packageJson,
      scripts: productionScripts,
      description: `${packageJson.description} - Production Build`
    };
    
    fs.writeFileSync('package.production.json', JSON.stringify(productionPackageJson, null, 2));
    logSuccess('Created package.production.json');
    
    return true;
  } catch (error) {
    logError(`Failed to create production package.json: ${error.message}`);
    return false;
  }
}

function createProductionEnvFile() {
  logInfo('Creating production environment template...');
  
  try {
    fs.writeFileSync('.env.production.example', PRODUCTION_CONFIG.productionEnv);
    logSuccess('Created .env.production.example');
    return true;
  } catch (error) {
    logError(`Failed to create production environment file: ${error.message}`);
    return false;
  }
}

function createDeploymentManifest() {
  logInfo('Creating deployment manifest...');
  
  try {
    const manifest = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'production',
      excludedFiles: PRODUCTION_CONFIG.excludeFiles,
      excludedDirectories: PRODUCTION_CONFIG.excludeDirs,
      instructions: [
        '1. Copy all files EXCEPT those listed in excludedFiles and excludedDirectories',
        '2. Copy package.production.json to package.json',
        '3. Copy .env.production.example to .env and configure production values',
        '4. Run npm install to install production dependencies',
        '5. Start the application with npm start'
      ]
    };
    
    fs.writeFileSync('deployment-manifest.json', JSON.stringify(manifest, null, 2));
    logSuccess('Created deployment-manifest.json');
    return true;
  } catch (error) {
    logError(`Failed to create deployment manifest: ${error.message}`);
    return false;
  }
}

function createDeploymentScript() {
  logInfo('Creating deployment script...');
  
  try {
    const deploymentScript = `#!/bin/bash

# Production Deployment Script
# This script helps deploy the application to production

echo "🚀 Preparing HostTrack for Production Deployment"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Create production build
echo "📦 Creating production build..."

# Copy production package.json
if [ -f "package.production.json" ]; then
    cp package.production.json package.json
    echo "✅ Updated package.json for production"
else
    echo "⚠️  Warning: package.production.json not found"
fi

# Create production environment file
if [ -f ".env.production.example" ]; then
    if [ ! -f ".env" ]; then
        cp .env.production.example .env
        echo "✅ Created .env from production template"
        echo "⚠️  IMPORTANT: Please edit .env with your production values"
    else
        echo "ℹ️  .env already exists, skipping..."
    fi
else
    echo "⚠️  Warning: .env.production.example not found"
fi

# Install production dependencies
echo "📥 Installing production dependencies..."
npm install

# Remove development files
echo "🧹 Cleaning up development files..."
rm -f start-local.js test-local-setup.js prepare-deployment.js
rm -f LOCAL_SETUP.md
rm -rf backend/config/local.js web/config/local.js

echo ""
echo "🎉 Production deployment preparation complete!"
echo "📋 Next steps:"
echo "   1. Configure your production environment in .env"
echo "   2. Deploy to your hosting provider"
echo "   3. Start the application with: npm start"
echo ""
echo "💡 For detailed deployment instructions, see deployment-manifest.json"
`;

    fs.writeFileSync('deploy-to-production.sh', deploymentScript);
    
    // Make it executable on Unix systems
    try {
      fs.chmodSync('deploy-to-production.sh', '755');
    } catch (error) {
      // Ignore chmod errors on Windows
    }
    
    logSuccess('Created deploy-to-production.sh');
    return true;
  } catch (error) {
    logError(`Failed to create deployment script: ${error.message}`);
    return false;
  }
}

// Main function
async function prepareDeployment() {
  logHeader('🚀 HostTrack Production Deployment Preparation');
  
  log('This script will prepare your project for production deployment by:');
  log('• Creating production-ready package.json');
  log('• Creating production environment template');
  log('• Creating deployment manifest');
  log('• Creating deployment script');
  log('• Identifying files to exclude from production');
  log('');
  
  try {
    // Create production files
    const results = [
      createProductionPackageJson(),
      createProductionEnvFile(),
      createDeploymentManifest(),
      createDeploymentScript()
    ];
    
    if (results.every(result => result)) {
      logHeader('✅ Deployment Preparation Complete!');
      
      log('Files created:');
      log('• package.production.json - Production package.json');
      log('• .env.production.example - Production environment template');
      log('• deployment-manifest.json - Deployment instructions');
      log('• deploy-to-production.sh - Deployment script');
      
      logHeader('📋 Next Steps:');
      log('1. Review the generated files');
      log('2. Configure your production environment');
      log('3. Run ./deploy-to-production.sh when ready to deploy');
      log('4. Copy files to your production server (excluding development files)');
      
      logHeader('⚠️  Important Notes:');
      log('• Never commit .env files to version control');
      log('• Use strong, unique secrets in production');
      log('• Test in staging environment before production');
      log('• Keep backups of your production data');
      
    } else {
      logHeader('❌ Some files failed to create');
      log('Please check the errors above and try again.');
    }
    
  } catch (error) {
    logError(`Deployment preparation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  prepareDeployment().catch(error => {
    logError(`Script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { prepareDeployment };
