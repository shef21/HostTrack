/**
 * Console Test Script for Smart Matching Engine Anti-Duplicate Call System
 * Run this in the browser console after the test page loads
 */

console.log('🧪 Starting Smart Matching Engine Anti-Duplicate Call Tests...');

// Test 1: Multiple rapid refresh calls
function testMultipleRefreshCalls() {
    console.log('\n🧪 Test 1: Multiple Rapid Refresh Calls');
    console.log('🔄 Calling refreshLocationData 5 times rapidly...');
    
    for (let i = 0; i < 5; i++) {
        console.log(`📍 Refresh call ${i + 1}`);
        smartMatchingEngine.refreshLocationData();
    }
    
    console.log('✅ Multiple refresh calls made (should be debounced and cooldown protected)');
    console.log('📊 Current call stats:', smartMatchingEngine.getCallStats());
}

// Test 2: Check cooldown protection
function testCooldownProtection() {
    console.log('\n🧪 Test 2: Cooldown Protection');
    
    const stats = smartMatchingEngine.getCallStats();
    console.log('📊 Current timing:', stats.timing);
    
    if (stats.timing.canRefresh) {
        console.log('✅ Can refresh now');
    } else {
        console.log(`⏳ Cooldown active: ${Math.ceil(stats.timing.cooldownRemaining / 1000)}s remaining`);
    }
}

// Test 3: Force refresh bypass
function testForceRefreshBypass() {
    console.log('\n🧪 Test 3: Force Refresh Bypass');
    
    console.log('🔄 Attempting force refresh...');
    smartMatchingEngine.forceRefreshLocationData().then(() => {
        console.log('✅ Force refresh completed successfully');
        console.log('📊 Updated call stats:', smartMatchingEngine.getCallStats());
    }).catch(error => {
        console.error('❌ Force refresh failed:', error);
    });
}

// Test 4: Multiple initialization calls
function testMultipleInitialization() {
    console.log('\n🧪 Test 4: Multiple Initialization Calls');
    
    console.log('🔄 Calling initializeWhenReady multiple times...');
    smartMatchingEngine.initializeWhenReady();
    smartMatchingEngine.initializeWhenReady();
    smartMatchingEngine.initializeWhenReady();
    
    console.log('✅ Multiple initialization calls made (should be blocked by protection)');
    console.log('📊 Current status:', smartMatchingEngine.getStatus());
}

// Test 5: Property update simulation
function testPropertyUpdates() {
    console.log('\n🧪 Test 5: Property Update Simulation');
    
    const properties = [
        { city: 'Test City 1', province: 'Test Province 1' },
        { city: 'Test City 2', province: 'Test Province 2' },
        { city: 'Test City 3', province: 'Test Province 3' }
    ];
    
    console.log('🔄 Simulating multiple property updates...');
    properties.forEach((prop, index) => {
        setTimeout(() => {
            console.log(`📍 Property update ${index + 1}:`, prop.city);
            smartMatchingEngine.handlePropertyUpdate(prop, 'update');
        }, index * 200);
    });
    
    console.log('✅ Multiple property updates scheduled (should be debounced)');
}

// Test 6: Comprehensive status check
function comprehensiveStatusCheck() {
    console.log('\n🧪 Test 6: Comprehensive Status Check');
    
    console.log('📊 Engine Status:', smartMatchingEngine.getStatus());
    console.log('📊 Call Statistics:', smartMatchingEngine.getCallStats());
    console.log('🔍 Debug Info:', smartMatchingEngine.getDebugInfo());
}

// Run all tests
function runAllTests() {
    console.log('🚀 Running all Smart Matching Engine tests...\n');
    
    testMultipleRefreshCalls();
    setTimeout(() => testCooldownProtection(), 1000);
    setTimeout(() => testForceRefreshBypass(), 2000);
    setTimeout(() => testMultipleInitialization(), 4000);
    setTimeout(() => testPropertyUpdates(), 6000);
    setTimeout(() => comprehensiveStatusCheck(), 8000);
}

// Export test functions for manual testing
window.smartMatchingTests = {
    testMultipleRefreshCalls,
    testCooldownProtection,
    testForceRefreshBypass,
    testMultipleInitialization,
    testPropertyUpdates,
    comprehensiveStatusCheck,
    runAllTests
};

console.log('✅ Test functions loaded. Use smartMatchingTests.runAllTests() to run all tests');
console.log('📋 Available tests:', Object.keys(window.smartMatchingTests));
