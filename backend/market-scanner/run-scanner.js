const SeaPointScanner = require('./scanners/SeaPointScanner');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://nasxtkxixjhfuhcptwyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE';

async function runScanner() {
    // Initialize Supabase client with anon key
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('🔐 Initialized scanner with public access');
    console.log('🚀 Starting Cape Town Market Scanner');
    
    const scanner = new SeaPointScanner(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    try {
        console.log('📍 Scanning Sea Point market...');
        await scanner.scan();
        console.log('✅ Sea Point scan completed successfully');
        
        // Run data quality verification after scan
        const { verifyDataQuality } = require('./verify-data-quality');
        console.log('\n🔍 Running data quality verification...');
        await verifyDataQuality();
        
    } catch (error) {
        console.error('❌ Scanner failed:', error);
        process.exit(1);
    }
}

// Run scanner if called directly
if (require.main === module) {
    runScanner();
}

module.exports = { runScanner };