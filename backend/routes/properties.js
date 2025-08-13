const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const testAuth = require('../middleware/test-auth');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost/hosttrack',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * GET /api/properties
 * Get all properties for the authenticated user
 */
router.get('/', testAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const query = `
            SELECT id, name, location, type, price, bedrooms, bathrooms, 
                   max_guests, amenities, description, platform_ids, 
                   created_at, updated_at
            FROM properties 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `;
        
        const result = await pool.query(query, [userId]);
        
        res.json({
            success: true,
            properties: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ 
            error: 'Failed to fetch properties',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/properties
 * Create a new property
 */
router.post('/', testAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const {
            name, location, type, price, bedrooms, bathrooms,
            max_guests, amenities, description, platform_ids
        } = req.body;

        // Validate required fields
        if (!name || !location) {
            return res.status(400).json({ 
                error: 'Property name and location are required' 
            });
        }

        // Check for duplicates before creating
        const duplicateCheck = await checkForDuplicates(name, location, userId);
        if (duplicateCheck.isDuplicate) {
            return res.status(409).json({
                error: 'Property with this name and location already exists',
                duplicate_id: duplicateCheck.existingId,
                duplicate_property: duplicateCheck.existingProperty
            });
        }

        // Insert new property
        const query = `
            INSERT INTO properties (
                user_id, name, location, type, price, bedrooms, bathrooms,
                max_guests, amenities, description, platform_ids, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
            RETURNING id, name, location, type, price, bedrooms, bathrooms,
                      max_guests, amenities, description, platform_ids, created_at
        `;

        const values = [
            userId, name, location, type || 'apartment', 
            parseFloat(price) || 0, parseInt(bedrooms) || 1, 
            parseInt(bathrooms) || 1, parseInt(max_guests) || 2,
            Array.isArray(amenities) ? amenities : [],
            description || '', 
            platform_ids || {}
        ];

        const result = await pool.query(query, values);
        const newProperty = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Property created successfully',
            property: newProperty
        });

    } catch (error) {
        console.error('Error creating property:', error);
        res.status(500).json({ 
            error: 'Failed to create property',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/properties/check-duplicate
 * Check if a property is a duplicate
 */
router.post('/check-duplicate', testAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { name, location, platform_ids } = req.body;

        if (!name || !location) {
            return res.status(400).json({ 
                error: 'Property name and location are required' 
            });
        }

        const duplicateCheck = await checkForDuplicates(name, location, userId, platform_ids);
        
        res.json({
            success: true,
            isDuplicate: duplicateCheck.isDuplicate,
            existingId: duplicateCheck.existingId,
            existingProperty: duplicateCheck.existingProperty,
            matchType: duplicateCheck.matchType,
            confidence: duplicateCheck.confidence
        });

    } catch (error) {
        console.error('Error checking for duplicates:', error);
        res.status(500).json({ 
            error: 'Failed to check for duplicates',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * PUT /api/properties/:id
 * Update an existing property
 */
router.put('/:id', testAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        const propertyId = req.params.id;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if property exists and belongs to user
        const existingProperty = await pool.query(
            'SELECT * FROM properties WHERE id = $1 AND user_id = $2',
            [propertyId, userId]
        );

        if (existingProperty.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const {
            name, location, type, price, bedrooms, bathrooms,
            max_guests, amenities, description, platform_ids
        } = req.body;

        // Update property
        const query = `
            UPDATE properties SET
                name = COALESCE($1, name),
                location = COALESCE($2, location),
                type = COALESCE($3, type),
                price = COALESCE($4, price),
                bedrooms = COALESCE($5, bedrooms),
                bathrooms = COALESCE($6, bathrooms),
                max_guests = COALESCE($7, max_guests),
                amenities = COALESCE($8, amenities),
                description = COALESCE($9, description),
                platform_ids = COALESCE($10, platform_ids),
                updated_at = NOW()
            WHERE id = $11 AND user_id = $12
            RETURNING *
        `;

        const values = [
            name, location, type, parseFloat(price), parseInt(bedrooms),
            parseInt(bathrooms), parseInt(max_guests), amenities, description,
            platform_ids, propertyId, userId
        ];

        const result = await pool.query(query, values);
        const updatedProperty = result.rows[0];

        res.json({
            success: true,
            message: 'Property updated successfully',
            property: updatedProperty
        });

    } catch (error) {
        console.error('Error updating property:', error);
        res.status(500).json({ 
            error: 'Failed to update property',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * DELETE /api/properties/:id
 * Delete a property
 */
router.delete('/:id', testAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        const propertyId = req.params.id;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if property exists and belongs to user
        const existingProperty = await pool.query(
            'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
            [propertyId, userId]
        );

        if (existingProperty.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Delete property
        await pool.query(
            'DELETE FROM properties WHERE id = $1 AND user_id = $2',
            [propertyId, userId]
        );

        res.json({
            success: true,
            message: 'Property deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting property:', error);
        res.status(500).json({ 
            error: 'Failed to delete property',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Helper function to check for duplicates
 */
async function checkForDuplicates(name, location, userId, platform_ids = {}) {
    try {
        // Check for exact name and location match
        const exactMatch = await pool.query(
            'SELECT * FROM properties WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND LOWER(location) = LOWER($3)',
            [userId, name, location]
        );

        if (exactMatch.rows.length > 0) {
            return {
                isDuplicate: true,
                existingId: exactMatch.rows[0].id,
                existingProperty: exactMatch.rows[0],
                matchType: 'exact',
                confidence: 1.0
            };
        }

        // Check for platform ID matches
        for (const [platform, id] of Object.entries(platform_ids)) {
            if (id) {
                const platformMatch = await pool.query(
                    `SELECT * FROM properties WHERE user_id = $1 AND platform_ids->>$2 = $3`,
                    [userId, platform, id]
                );

                if (platformMatch.rows.length > 0) {
                    return {
                        isDuplicate: true,
                        existingId: platformMatch.rows[0].id,
                        existingProperty: platformMatch.rows[0],
                        matchType: 'platform_id',
                        confidence: 0.95
                    };
                }
            }
        }

        // Check for similar names (fuzzy matching)
        const similarNameMatch = await pool.query(
            'SELECT * FROM properties WHERE user_id = $1 AND LOWER(name) % LOWER($2)',
            [userId, name]
        );

        if (similarNameMatch.rows.length > 0) {
            return {
                isDuplicate: true,
                existingId: similarNameMatch.rows[0].id,
                existingProperty: similarNameMatch.rows[0],
                matchType: 'similar_name',
                confidence: 0.7
            };
        }

        return {
            isDuplicate: false,
            existingId: null,
            existingProperty: null,
            matchType: null,
            confidence: 0.0
        };

    } catch (error) {
        console.error('Error checking for duplicates:', error);
        throw error;
    }
}

module.exports = router; 