/**
 * Smart Property Matching Engine for HostTrack
 * Phase 2: Advanced duplicate detection and cross-platform property matching
 */

class SmartMatchingEngine {
    constructor() {
        this.matchingAlgorithms = {
            exact: this.exactMatch.bind(this),
            fuzzy: this.fuzzyMatch.bind(this),
            location: this.locationMatch.bind(this),
            crossPlatform: this.crossPlatformMatch.bind(this)
        };
        
        this.confidenceThresholds = {
            high: 0.8,      // 80%+ confidence - auto-merge
            medium: 0.6,    // 60-79% confidence - user confirmation
            low: 0.4        // 40-59% confidence - user review
        };
        
        this.cities = null; // Will be populated from database
        this.areas = null;  // Will be populated from database
        this.initialized = false; // Track initialization status
        
        // Call tracking and debouncing
        this.isLoadingLocationData = false;
        this.isRefreshingLocationData = false;
        this.lastLocationDataLoad = null;
        this.locationDataLoadTimeout = null;
        this.refreshDebounceTimeout = null;
        this.refreshCooldown = 5000; // 5 seconds between refresh calls
        this.authenticationWaitActive = false;
        
        console.log('🚀 Smart Matching Engine initialized (waiting for API service)');
        
        // Initialize when ready instead of immediately
        this.initializeWhenReady();
    }

    /**
     * Main matching function - orchestrates all matching algorithms
     */
    async findMatches(newProperty, existingProperties) {
        console.log('🔍 Smart Matching Engine: Finding matches for:', newProperty.name);
        
        const matches = [];
        
        // Run all matching algorithms
        for (const [algorithmName, algorithm] of Object.entries(this.matchingAlgorithms)) {
            const algorithmMatches = await algorithm(newProperty, existingProperties);
            matches.push(...algorithmMatches);
        }
        
        // Remove duplicates and sort by confidence
        const uniqueMatches = this.removeDuplicateMatches(matches);
        const sortedMatches = uniqueMatches.sort((a, b) => b.confidence - a.confidence);
        
        console.log(`🎯 Found ${sortedMatches.length} potential matches`);
        return sortedMatches;
    }

    /**
     * Exact match by property name and location
     */
    async exactMatch(newProperty, existingProperties) {
        const matches = [];
        
        for (const existing of existingProperties) {
            const nameMatch = this.normalizeString(newProperty.name) === this.normalizeString(existing.name);
            const locationMatch = this.normalizeString(newProperty.location) === this.normalizeString(existing.location);
            
            if (nameMatch && locationMatch) {
                matches.push({
                    existingProperty: existing,
                    confidence: 1.0,
                    matchType: 'exact',
                    reasons: ['Exact name and location match'],
                    algorithm: 'exact'
                });
            }
        }
        
        return matches;
    }

    /**
     * Fuzzy matching using string similarity
     */
    async fuzzyMatch(newProperty, existingProperties) {
        const matches = [];
        const nameThreshold = 0.7;
        const locationThreshold = 0.6;
        
        for (const existing of existingProperties) {
            const nameSimilarity = this.calculateSimilarity(
                this.normalizeString(newProperty.name),
                this.normalizeString(existing.name)
            );
            
            const locationSimilarity = this.calculateSimilarity(
                this.normalizeString(newProperty.location),
                this.normalizeString(existing.location)
            );
            
            if (nameSimilarity >= nameThreshold || locationSimilarity >= locationThreshold) {
                const confidence = Math.max(nameSimilarity, locationSimilarity);
                const reasons = [];
                
                if (nameSimilarity >= nameThreshold) {
                    reasons.push(`Name similarity: ${Math.round(nameSimilarity * 100)}%`);
                }
                if (locationSimilarity >= locationThreshold) {
                    reasons.push(`Location similarity: ${Math.round(locationSimilarity * 100)}%`);
                }
                
                matches.push({
                    existingProperty: existing,
                    confidence: confidence,
                    matchType: 'fuzzy',
                    reasons: reasons,
                    algorithm: 'fuzzy'
                });
            }
        }
        
        return matches;
    }

    /**
     * Location-based matching using geographic proximity
     */
    async locationMatch(newProperty, existingProperties) {
        const matches = [];
        const locationThreshold = 0.7;
        
        for (const existing of existingProperties) {
            const locationSimilarity = this.calculateLocationSimilarity(
                newProperty.location,
                existing.location
            );
            
            if (locationSimilarity >= locationThreshold) {
                matches.push({
                    existingProperty: existing,
                    confidence: locationSimilarity,
                    matchType: 'location',
                    reasons: [`Location similarity: ${Math.round(locationSimilarity * 100)}%`],
                    algorithm: 'location'
                });
            }
        }
        
        return matches;
    }

    /**
     * Cross-platform ID matching
     */
    async crossPlatformMatch(newProperty, existingProperties) {
        const matches = [];
        
        // Check if new property has cross-platform IDs
        const newPlatformIds = this.extractPlatformIds(newProperty);
        
        for (const existing of existingProperties) {
            const existingPlatformIds = this.extractPlatformIds(existing);
            
            // Check for matching platform IDs
            for (const [platform, newId] of Object.entries(newPlatformIds)) {
                if (existingPlatformIds[platform] && existingPlatformIds[platform] === newId) {
                    matches.push({
                        existingProperty: existing,
                        confidence: 0.95,
                        matchType: 'cross_platform',
                        reasons: [`${platform} ID match: ${newId}`],
                        algorithm: 'cross_platform'
                    });
                    break; // Found a match, no need to check other IDs
                }
            }
        }
        
        return matches;
    }

    /**
     * Calculate string similarity using Levenshtein distance
     */
    calculateSimilarity(str1, str2) {
        if (str1 === str2) return 1.0;
        if (str1.length === 0) return 0.0;
        if (str2.length === 0) return 0.0;
        
        const distance = this.levenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        
        return 1 - (distance / maxLength);
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    /**
     * Calculate location similarity
     */
    calculateLocationSimilarity(loc1, loc2) {
        const normalized1 = this.normalizeString(loc1);
        const normalized2 = this.normalizeString(loc2);
        
        // Exact match
        if (normalized1 === normalized2) return 1.0;
        
        // Check if one location contains the other
        if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
            return 0.8;
        }
        
        // Check for common city names
        const cities1 = this.extractCities(normalized1);
        const cities2 = this.extractCities(normalized2);
        
        for (const city1 of cities1) {
            for (const city2 of cities2) {
                if (city1 === city2) {
                    return 0.7;
                }
            }
        }
        
        // Check for common area names
        const areas1 = this.extractAreas(normalized1);
        const areas2 = this.extractAreas(normalized2);
        
        for (const area1 of areas1) {
            for (const area2 of areas2) {
                if (area1 === area2) {
                    return 0.6;
                }
            }
        }
        
        return 0.0;
    }

    /**
     * Load location data from database
     * This replaces hardcoded cities and provinces with real data
     */
    async loadLocationData() {
        // Prevent multiple simultaneous calls
        if (this.isLoadingLocationData) {
            console.log('⏳ Location data load already in progress, skipping duplicate call');
            return;
        }
        
        // Check if we recently loaded data (within last 30 seconds)
        const now = Date.now();
        if (this.lastLocationDataLoad && (now - this.lastLocationDataLoad) < 30000) {
            console.log('⏳ Location data was recently loaded, skipping duplicate call');
            return;
        }
        
        this.isLoadingLocationData = true;
        console.log('🔄 Loading location data from database...');
        
        try {
            // Validate API service is available and authenticated
            if (!window.apiService) {
                throw new Error('API service not available');
            }
            
            if (!window.apiService.isAuthenticated()) {
                throw new Error('User not authenticated');
            }
            
            // Get unique cities and provinces from user's properties
            const properties = await window.apiService.getProperties();
            
            if (!properties || !Array.isArray(properties) || properties.length === 0) {
                console.log('ℹ️ No properties found, using fallback location data');
                this.useFallbackLocationData();
                return;
            }
            
            // Extract and validate location data
            const locationData = this.extractLocationDataFromProperties(properties);
            
            if (locationData.cities.length > 0) {
                this.cities = locationData.cities;
                console.log('✅ Loaded cities from user properties:', this.cities);
            } else {
                console.log('ℹ️ No city data found in properties, using fallback cities');
                this.cities = this.getFallbackCities();
            }
            
            if (locationData.provinces.length > 0) {
                this.areas = locationData.provinces;
                console.log('✅ Loaded provinces from user properties:', this.areas);
            } else {
                console.log('ℹ️ No province data found in properties, using fallback provinces');
                this.areas = this.getFallbackProvinces();
            }
            
            this.lastLocationDataLoad = now;
            console.log('✅ Location data loaded successfully');
            
        } catch (error) {
            console.warn('⚠️ Could not load location data from database:', error);
            this.useFallbackLocationData();
        } finally {
            this.isLoadingLocationData = false;
        }
    }

    /**
     * Extract location data from properties with validation
     */
    extractLocationDataFromProperties(properties) {
        const cities = new Set();
        const provinces = new Set();
        
        properties.forEach(property => {
            try {
                // Extract city from various possible fields
                let city = null;
                if (property.city && typeof property.city === 'string') {
                    city = property.city.trim();
                } else if (property.location && typeof property.location === 'string') {
                    const locationParts = property.location.split(',').map(part => part.trim());
                    city = locationParts[0];
                } else if (property.address && typeof property.address === 'string') {
                    const addressParts = property.address.split(',').map(part => part.trim());
                    city = addressParts[0];
                }
                
                // Validate and add city
                if (city && city.length > 0 && city.length < 100) {
                    cities.add(city);
                }
                
                // Extract province from various possible fields
                let province = null;
                if (property.province && typeof property.province === 'string') {
                    province = property.province.trim();
                } else if (property.location && typeof property.location === 'string') {
                    const locationParts = property.location.split(',').map(part => part.trim());
                    province = locationParts[1];
                } else if (property.region && typeof property.region === 'string') {
                    province = property.region.trim();
                }
                
                // Validate and add province
                if (province && province.length > 0 && province.length < 100) {
                    provinces.add(province);
                }
                
            } catch (propertyError) {
                console.warn('⚠️ Error processing property location data:', propertyError, property);
                // Continue with next property
            }
        });
        
        return {
            cities: Array.from(cities),
            provinces: Array.from(provinces)
        };
    }

    /**
     * Get fallback cities for when database data is unavailable
     */
    getFallbackCities() {
        return [
            'Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth',
            'Bloemfontein', 'Nelspruit', 'Kimberley', 'Polokwane', 'Stellenbosch',
            'East London', 'Pietermaritzburg', 'Rustenburg', 'Welkom', 'Vereeniging',
            'Klerksdorp', 'Potchefstroom', 'Kroonstad', 'Witbank'
        ];
    }

    /**
     * Get fallback provinces for when database data is unavailable
     */
    getFallbackProvinces() {
        return [
            'Western Cape', 'Gauteng', 'KwaZulu-Natal', 'Eastern Cape',
            'Free State', 'Mpumalanga', 'Northern Cape', 'Limpopo',
            'North West'
        ];
    }

    /**
     * Refresh location data (call this when properties are updated)
     */
    async refreshLocationData() {
        // Prevent multiple simultaneous refresh calls
        if (this.isRefreshingLocationData) {
            console.log('⏳ Location data refresh already in progress, skipping duplicate call');
            return;
        }
        
        // Check cooldown period
        const now = Date.now();
        if (this.lastLocationDataLoad && (now - this.lastLocationDataLoad) < this.refreshCooldown) {
            console.log(`⏳ Refresh cooldown active (${Math.ceil((this.refreshCooldown - (now - this.lastLocationDataLoad)) / 1000)}s remaining), skipping refresh`);
            return;
        }
        
        // Clear any existing debounce timeout
        if (this.refreshDebounceTimeout) {
            clearTimeout(this.refreshDebounceTimeout);
        }
        
        // Debounce the refresh call
        this.refreshDebounceTimeout = setTimeout(async () => {
            await this.performLocationDataRefresh();
        }, 300); // 300ms debounce delay
        
        console.log('🔄 Location data refresh scheduled (debounced)');
    }

    /**
     * Perform the actual location data refresh
     */
    async performLocationDataRefresh() {
        this.isRefreshingLocationData = true;
        console.log('🔄 Performing location data refresh...');
        
        try {
            if (window.apiService && window.apiService.isAuthenticated()) {
                await this.loadLocationData();
                console.log('✅ Location data refreshed successfully');
            } else {
                console.log('ℹ️ Cannot refresh location data - API service not ready or user not authenticated');
            }
        } catch (error) {
            console.error('❌ Error refreshing location data:', error);
            // Keep existing data if refresh fails
        } finally {
            this.isRefreshingLocationData = false;
        }
    }

    /**
     * Check if the matching engine is ready to use
     */
    isReady() {
        return this.initialized && this.cities && this.areas;
    }

    /**
     * Get current status of the matching engine
     */
    getStatus() {
        return {
            initialized: this.initialized,
            hasCities: !!this.cities,
            hasProvinces: !!this.areas,
            citiesCount: this.cities ? this.cities.length : 0,
            provincesCount: this.areas ? this.areas.length : 0,
            usingFallback: !this.initialized || !this.cities || !this.areas
        };
    }

    /**
     * Extract cities from location string
     */
    extractCities(location) {
        // Use dynamically loaded cities if available, otherwise fallback to comprehensive list
        const cities = this.cities || [
            'Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth',
            'Bloemfontein', 'Nelspruit', 'Kimberley', 'Polokwane', 'Stellenbosch',
            'East London', 'Pietermaritzburg', 'Rustenburg', 'Welkom', 'Vereeniging',
            'Klerksdorp', 'Potchefstroom', 'Kroonstad', 'Witbank'
        ];
        
        return cities.filter(city => 
            location.toLowerCase().includes(city.toLowerCase())
        );
    }

    /**
     * Extract area names from location string
     */
    extractAreas(location) {
        // Use dynamically loaded provinces if available, otherwise fallback to comprehensive list
        const areas = this.areas || [
            'Western Cape', 'Gauteng', 'KwaZulu-Natal', 'Eastern Cape',
            'Free State', 'Mpumalanga', 'Northern Cape', 'Limpopo',
            'North West'
        ];
        
        return areas.filter(area => 
            location.toLowerCase().includes(area.toLowerCase())
        );
    }

    /**
     * Extract cross-platform IDs from property data
     */
    extractPlatformIds(property) {
        const platformIds = {};
        
        // Check for common platform ID fields
        const idFields = [
            'airbnb_id', 'booking_id', 'vrbo_id', 'platform_id',
            'external_id', 'listing_id', 'property_id'
        ];
        
        for (const field of idFields) {
            if (property[field]) {
                platformIds[field] = property[field];
            }
        }
        
        // Check description for platform-specific patterns
        if (property.description) {
            const airbnbMatch = property.description.match(/airbnb[:\s]*(\w+)/i);
            if (airbnbMatch) platformIds.airbnb_id = airbnbMatch[1];
            
            const bookingMatch = property.description.match(/booking[:\s]*(\w+)/i);
            if (bookingMatch) platformIds.booking_id = bookingMatch[1];
        }
        
        return platformIds;
    }

    /**
     * Normalize string for comparison
     */
    normalizeString(str) {
        if (!str) return '';
        
        return str
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove special characters
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .trim();
    }

    /**
     * Remove duplicate matches
     */
    removeDuplicateMatches(matches) {
        const seen = new Set();
        const unique = [];
        
        for (const match of matches) {
            const key = `${match.existingProperty.id}-${match.algorithm}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(match);
            }
        }
        
        return unique;
    }

    /**
     * Determine match confidence level
     */
    getConfidenceLevel(confidence) {
        if (confidence >= this.confidenceThresholds.high) return 'high';
        if (confidence >= this.confidenceThresholds.medium) return 'medium';
        if (confidence >= this.confidenceThresholds.low) return 'low';
        return 'none';
    }

    /**
     * Generate match summary for user interface
     */
    generateMatchSummary(matches) {
        if (matches.length === 0) {
            return {
                type: 'no_matches',
                message: 'No potential duplicates found. Safe to import.',
                action: 'import'
            };
        }
        
        const bestMatch = matches[0];
        const confidenceLevel = this.getConfidenceLevel(bestMatch.confidence);
        
        if (confidenceLevel === 'high') {
            return {
                type: 'high_confidence',
                message: `High confidence duplicate found (${Math.round(bestMatch.confidence * 100)}%)`,
                action: 'auto_merge',
                match: bestMatch
            };
        } else if (confidenceLevel === 'medium') {
            return {
                type: 'medium_confidence',
                message: `Potential duplicate found (${Math.round(bestMatch.confidence * 100)}% confidence)`,
                action: 'user_confirm',
                match: bestMatch
            };
        } else {
            return {
                type: 'low_confidence',
                message: `Possible duplicate found (${Math.round(bestMatch.confidence * 100)}% confidence)`,
                action: 'user_review',
                match: bestMatch
            };
        }
    }

    /**
     * Merge property data intelligently
     */
    mergePropertyData(newProperty, existingProperty, mergeStrategy = 'smart') {
        const merged = { ...existingProperty };
        
        switch (mergeStrategy) {
            case 'newer_wins':
                // Prefer newer data
                merged.name = newProperty.name || existingProperty.name;
                merged.price = newProperty.price || existingProperty.price;
                merged.amenities = newProperty.amenities || existingProperty.amenities;
                break;
                
            case 'merge_amenities':
                // Combine amenities
                const existingAmenities = existingProperty.amenities || [];
                const newAmenities = newProperty.amenities || [];
                merged.amenities = [...new Set([...existingAmenities, ...newAmenities])];
                break;
                
            case 'smart':
            default:
                // Smart merging - prefer non-empty values
                for (const [key, value] of Object.entries(newProperty)) {
                    if (value && value !== '' && value !== 0) {
                        merged[key] = value;
                    }
                }
                break;
        }
        
        // Add cross-platform IDs
        const newPlatformIds = this.extractPlatformIds(newProperty);
        const existingPlatformIds = this.extractPlatformIds(existingProperty);
        merged.platform_ids = { ...existingPlatformIds, ...newPlatformIds };
        
        // Add import metadata
        merged.last_imported = new Date().toISOString();
        merged.import_source = newProperty.import_source || 'csv_import';
        
        return merged;
    }

    /**
     * Initialize the matching engine when the API service is ready.
     */
    async initializeWhenReady() {
        try {
            console.log('🔄 Initializing Smart Matching Engine...');
            
            // Wait for API service to be available
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max wait
            
            while (!window.apiService && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (window.apiService) {
                // Wait a bit more for authentication to complete
                await new Promise(resolve => setTimeout(resolve, 500));
                
                if (window.apiService.isAuthenticated()) {
                    await this.loadLocationData();
                    this.initialized = true;
                    this.setupAutoRefresh();
                    console.log('✅ Smart Matching Engine fully initialized with location data');
                } else {
                    console.log('ℹ️ Smart Matching Engine initialized (waiting for authentication)');
                    // Set up a listener for when authentication happens
                    this.waitForAuthentication();
                }
            } else {
                console.warn('⚠️ API service not available after timeout. Using fallback location data.');
                this.useFallbackLocationData();
                this.initialized = true;
            }
        } catch (error) {
            console.error('❌ Error initializing Smart Matching Engine:', error);
            this.useFallbackLocationData();
            this.initialized = true;
        }
    }

    /**
     * Wait for user authentication to complete
     */
    waitForAuthentication() {
        // Prevent multiple authentication wait loops
        if (this.authenticationWaitActive) {
            console.log('⏳ Authentication wait already active, skipping duplicate setup');
            return;
        }
        
        this.authenticationWaitActive = true;
        console.log('⏳ Setting up authentication wait loop...');
        
        const checkAuth = () => {
            if (window.apiService && window.apiService.isAuthenticated()) {
                console.log('✅ Authentication detected, loading location data...');
                this.loadLocationData().then(() => {
                    this.initialized = true;
                    this.authenticationWaitActive = false;
                    console.log('✅ Smart Matching Engine initialized after authentication');
                }).catch(error => {
                    console.error('❌ Error loading location data after authentication:', error);
                    this.useFallbackLocationData();
                    this.authenticationWaitActive = false;
                });
            } else {
                // Check again in 1 second
                setTimeout(checkAuth, 1000);
            }
        };
        
        // Start checking
        setTimeout(checkAuth, 1000);
    }

    /**
     * Use fallback location data if API service is not available
     */
    useFallbackLocationData() {
        console.log('ℹ️ Using fallback location data');
        this.cities = this.getFallbackCities();
        this.areas = this.getFallbackProvinces();
        console.log('✅ Fallback cities loaded:', this.cities.length);
        console.log('✅ Fallback provinces loaded:', this.areas.length);
    }

    /**
     * Handle property updates and refresh location data if needed
     */
    handlePropertyUpdate(propertyData, action = 'update') {
        console.log(`🔄 Property ${action} detected, checking if location data needs refresh...`);
        
        // Only refresh if we have location data and this property has location info
        if (this.isReady() && this.hasLocationData(propertyData)) {
            console.log('📍 Property has location data, scheduling location cache refresh...');
            this.refreshLocationData(); // This is now debounced
        } else {
            console.log('ℹ️ Property update does not affect location data, skipping refresh');
        }
    }

    /**
     * Check if a property has location data that would affect our cache
     */
    hasLocationData(property) {
        return !!(property.city || property.province || property.location || property.address || property.region);
    }

    /**
     * Set up automatic refresh when properties change
     */
    setupAutoRefresh() {
        // Listen for property changes if the app supports it
        if (window.addEventListener) {
            // Listen for custom property update events
            window.addEventListener('propertyUpdated', (event) => {
                this.handlePropertyUpdate(event.detail, 'update');
            });
            
            window.addEventListener('propertyCreated', (event) => {
                this.handlePropertyUpdate(event.detail, 'create');
            });
            
            window.addEventListener('propertyDeleted', (event) => {
                this.handlePropertyUpdate(event.detail, 'delete');
            });
            
            console.log('✅ Auto-refresh listeners set up for property changes');
        }
    }

    /**
     * Manually trigger initialization (useful for testing or manual refresh)
     */
    async forceInitialize() {
        console.log('🔄 Force initializing Smart Matching Engine...');
        this.initialized = false;
        await this.initializeWhenReady();
    }

    /**
     * Force refresh location data (bypasses cooldown)
     */
    async forceRefreshLocationData() {
        console.log('🔄 Force refreshing location data (bypassing cooldown)...');
        
        // Clear cooldown
        this.lastLocationDataLoad = null;
        
        // Clear any existing debounce
        if (this.refreshDebounceTimeout) {
            clearTimeout(this.refreshDebounceTimeout);
            this.refreshDebounceTimeout = null;
        }
        
        // Perform refresh immediately
        await this.performLocationDataRefresh();
    }

    /**
     * Clear refresh cooldown manually
     */
    clearRefreshCooldown() {
        console.log('🔄 Manually clearing refresh cooldown...');
        this.lastLocationDataLoad = null;
        console.log('✅ Refresh cooldown cleared');
    }

    /**
     * Get a summary of the current state for debugging
     */
    getDebugInfo() {
        return {
            status: this.getStatus(),
            apiServiceAvailable: !!window.apiService,
            apiServiceAuthenticated: window.apiService ? window.apiService.isAuthenticated() : false,
            timestamp: new Date().toISOString(),
            memoryUsage: {
                citiesSize: this.cities ? JSON.stringify(this.cities).length : 0,
                areasSize: this.areas ? JSON.stringify(this.areas).length : 0
            },
            callTracking: {
                isLoadingLocationData: this.isLoadingLocationData,
                isRefreshingLocationData: this.isRefreshingLocationData,
                authenticationWaitActive: this.authenticationWaitActive,
                lastLocationDataLoad: this.lastLocationDataLoad ? new Date(this.lastLocationDataLoad).toISOString() : null,
                timeSinceLastLoad: this.lastLocationDataLoad ? Date.now() - this.lastLocationDataLoad : null,
                refreshCooldownRemaining: this.lastLocationDataLoad ? Math.max(0, this.refreshCooldown - (Date.now() - this.lastLocationDataLoad)) : null
            }
        };
    }

    /**
     * Get call statistics for monitoring
     */
    getCallStats() {
        return {
            currentCalls: {
                loading: this.isLoadingLocationData,
                refreshing: this.isRefreshingLocationData,
                authWait: this.authenticationWaitActive
            },
            timing: {
                lastLoad: this.lastLocationDataLoad,
                cooldownRemaining: this.lastLocationDataLoad ? Math.max(0, this.refreshCooldown - (Date.now() - this.lastLocationDataLoad)) : null,
                canRefresh: !this.lastLocationDataLoad || (Date.now() - this.lastLocationDataLoad) >= this.refreshCooldown
            },
            status: {
                ready: this.isReady(),
                initialized: this.initialized,
                hasData: !!(this.cities && this.areas)
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartMatchingEngine;
}
