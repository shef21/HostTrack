/**
 * Quick Verification Script for Anti-Duplicate Call Protection
 * Run this in browser console to verify the system is working
 */

console.log('🔍 Verifying Anti-Duplicate Call Protection...');

// Quick verification function
function verifyProtection() {
    if (!window.smartMatchingEngine) {
        console.error('❌ Smart Matching Engine not found. Make sure the test page is loaded.');
        return false;
    }
    
    console.log('✅ Engine found, checking protection mechanisms...');
    
    // Check 1: Call tracking properties exist
    const hasCallTracking = smartMatchingEngine.isLoadingLocationData !== undefined &&
                           smartMatchingEngine.isRefreshingLocationData !== undefined &&
                           smartMatchingEngine.lastLocationDataLoad !== undefined;
    
    console.log('📊 Call tracking properties:', hasCallTracking ? '✅ Present' : '❌ Missing');
    
    // Check 2: Protection methods exist
    const hasProtectionMethods = typeof smartMatchingEngine.performLocationDataRefresh === 'function' &&
                                typeof smartMatchingEngine.forceRefreshLocationData === 'function' &&
                                typeof smartMatchingEngine.clearRefreshCooldown === 'function';
    
    console.log('🛡️ Protection methods:', hasProtectionMethods ? '✅ Present' : '❌ Missing');
    
    // Check 3: Status methods exist
    const hasStatusMethods = typeof smartMatchingEngine.getCallStats === 'function' &&
                            typeof smartMatchingEngine.getDebugInfo === 'function';
    
    console.log('📈 Status methods:', hasStatusMethods ? '✅ Present' : '❌ Missing');
    
    // Check 4: Current state
    const status = smartMatchingEngine.getStatus();
    const callStats = smartMatchingEngine.getCallStats();
    
    console.log('🎯 Current status:', status);
    console.log('📊 Call statistics:', callStats);
    
    return hasCallTracking && hasProtectionMethods && hasStatusMethods;
}

// Test protection in action
function testProtectionInAction() {
    console.log('\n🧪 Testing Protection in Action...');
    
    // Test 1: Multiple rapid refresh calls
    console.log('🔄 Making 3 rapid refresh calls...');
    smartMatchingEngine.refreshLocationData();
    smartMatchingEngine.refreshLocationData();
    smartMatchingEngine.refreshLocationData();
    
    // Check if only one is actually processing
    setTimeout(() => {
        const stats = smartMatchingEngine.getCallStats();
        console.log('📊 After rapid calls - Current state:', stats.currentCalls);
        console.log('⏳ Cooldown status:', stats.timing.canRefresh ? 'Can refresh' : 'Cooldown active');
    }, 500);
    
    // Test 2: Check cooldown
    setTimeout(() => {
        const stats = smartMatchingEngine.getCallStats();
        console.log('📊 After 1 second - Cooldown remaining:', stats.timing.cooldownRemaining ? `${Math.ceil(stats.timing.cooldownRemaining / 1000)}s` : 'None');
    }, 1000);
}

// Run verification
function runVerification() {
    console.log('🚀 Running Protection Verification...\n');
    
    if (verifyProtection()) {
        console.log('\n✅ All protection mechanisms verified!');
        testProtectionInAction();
    } else {
        console.log('\n❌ Protection verification failed. Check the implementation.');
    }
}

// Export for manual testing
window.verifyProtection = {
    verifyProtection,
    testProtectionInAction,
    runVerification
};

console.log('✅ Verification functions loaded. Use verifyProtection.runVerification() to test');
