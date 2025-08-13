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
     * Extract cities from location string
     */
    extractCities(location) {
        const cities = [
            'Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth',
            'Bloemfontein', 'Nelspruit', 'Kimberley', 'Polokwane', 'Stellenbosch'
        ];
        
        return cities.filter(city => 
            location.toLowerCase().includes(city.toLowerCase())
        );
    }

    /**
     * Extract area names from location string
     */
    extractAreas(location) {
        const areas = [
            'Western Cape', 'Gauteng', 'KwaZulu-Natal', 'Eastern Cape',
            'Free State', 'Mpumalanga', 'Northern Cape', 'Limpopo'
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartMatchingEngine;
}
