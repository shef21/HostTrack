const express = require('express');
const { createUserClient } = require('../config/supabase');
const authenticateUser = require('../middleware/auth');
const router = express.Router();

// Get all properties
router.get('/', authenticateUser, async (req, res) => {
  try {
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Properties fetch error:', error);
      return res.status(500).json({ message: 'Failed to fetch properties' });
    }
    
    res.json(properties || []);
    
  } catch (error) {
    console.error('Properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get property by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .eq('owner_id', req.user.id)
      .single();
    
    if (error) {
      console.error('Property fetch error:', error);
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
    
  } catch (error) {
    console.error('Property by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new property
router.post('/', authenticateUser, async (req, res) => {
  try {
    const propertyData = {
      ...req.body,
      owner_id: req.user.id,
      created_at: new Date().toISOString()
    };
    
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: property, error } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();
    
    if (error) {
      console.error('Create property error:', error);
      return res.status(500).json({ message: 'Failed to create property' });
    }
    
    res.status(201).json(property);
    
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update property
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: property, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .eq('owner_id', req.user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Update property error:', error);
      return res.status(500).json({ message: 'Failed to update property' });
    }
    
    res.json(property);
    
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete property
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
      .eq('owner_id', req.user.id);
    
    if (error) {
      console.error('Delete property error:', error);
      return res.status(500).json({ message: 'Failed to delete property' });
    }
    
    res.json({ message: 'Property deleted successfully' });
    
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
