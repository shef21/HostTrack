const express = require('express');
const { createUserClient } = require('../config/supabase');
const authenticateUser = require('../middleware/auth');
const router = express.Router();

// Get all properties for user
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
    
    res.json(properties);
    
  } catch (error) {
    console.error('Properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single property
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) {
      console.error('Property fetch error:', error);
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
    
  } catch (error) {
    console.error('Property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new property
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      name,
      location,
      address,
      type,
      bedrooms,
      bathrooms,
      max_guests,
      price,
      currency,
      platforms,
      amenities,
      description,
      house_rules,
      check_in_time,
      check_out_time,
      image_url
    } = req.body;
    
    // Validation
    if (!name || !location || !type || !bedrooms || !bathrooms || !max_guests || !price) {
      return res.status(400).json({ 
        message: 'Please provide all required fields' 
      });
    }
    
    const propertyData = {
      owner_id: req.user.id,
      name,
      location,
      address: address || null,
      type,
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      max_guests: parseInt(max_guests),
      price: parseFloat(price),
      currency: currency || 'ZAR',
      platforms: platforms || [],
      amenities: amenities || [],
      description: description || null,
      house_rules: house_rules || [],
      check_in_time: check_in_time || '15:00',
      check_out_time: check_out_time || '11:00',
      image_url: image_url || null
    };
    
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: property, error } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();
    
    if (error) {
      console.error('Property creation error:', error);
      return res.status(400).json({ message: 'Failed to create property' });
    }
    
    res.status(201).json(property);
    
  } catch (error) {
    console.error('Property creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update property
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: existingProperty, error: fetchError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', req.params.id)
      .single();
    
    if (fetchError || !existingProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    const updateData = { ...req.body };
    delete updateData.id; // Prevent ID modification
    delete updateData.owner_id; // Prevent owner modification
    delete updateData.created_at; // Prevent timestamp modification
    
    const { data: property, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) {
      console.error('Property update error:', error);
      return res.status(400).json({ message: 'Failed to update property' });
    }
    
    res.json(property);
    
  } catch (error) {
    console.error('Property update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete property
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: existingProperty, error: fetchError } = await supabase
      .from('properties')
      .select('id, name')
      .eq('id', req.params.id)
      .single();
    
    if (fetchError || !existingProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check for dependencies before deletion
    const dependencies = await checkPropertyDependencies(supabase, req.params.id);
    
    if (dependencies.hasDependencies) {
      return res.status(409).json({
        message: 'Cannot delete property due to existing dependencies',
        propertyName: existingProperty.name,
        dependencies: dependencies
      });
    }
    
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', req.params.id);
    
    if (error) {
      console.error('Property deletion error:', error);
      return res.status(400).json({ message: 'Failed to delete property' });
    }
    
    res.json({ message: 'Property deleted successfully' });
    
  } catch (error) {
    console.error('Property deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to check property dependencies
async function checkPropertyDependencies(supabase, propertyId) {
  const dependencies = {
    hasDependencies: false,
    services: { count: 0, items: [] },
    bookings: { count: 0, items: [] },
    expenses: { count: 0, items: [] },
    orphanedBookings: { count: 0, items: [] }
  };

  try {
    // Check services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, category')
      .eq('property_id', propertyId);
    
    if (!servicesError && services && services.length > 0) {
      dependencies.services.count = services.length;
      dependencies.services.items = services;
      dependencies.hasDependencies = true;
    }

    // Check active bookings (not orphaned)
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, guest_name, check_in_date, check_out_date')
      .eq('property_id', propertyId)
      .eq('property_deleted', false);
    
    if (!bookingsError && bookings && bookings.length > 0) {
      dependencies.bookings.count = bookings.length;
      dependencies.bookings.items = bookings;
      dependencies.hasDependencies = true;
    }

    // Check orphaned bookings (where property was previously deleted)
    const { data: orphanedBookings, error: orphanedError } = await supabase
      .from('bookings')
      .select('id, guest_name, check_in_date, check_out_date, deleted_property_name')
      .eq('property_id', propertyId)
      .eq('property_deleted', true);
    
    if (!orphanedError && orphanedBookings && orphanedBookings.length > 0) {
      dependencies.orphanedBookings.count = orphanedBookings.length;
      dependencies.orphanedBookings.items = orphanedBookings;
      // Note: orphaned bookings don't prevent deletion, they're just informational
    }

    // Check expenses
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('id, description, amount, date')
      .eq('property_id', propertyId);
    
    if (!expensesError && expenses && expenses.length > 0) {
      dependencies.expenses.count = expenses.length;
      dependencies.expenses.items = expenses;
      dependencies.hasDependencies = true;
    }

  } catch (error) {
    console.error('Error checking property dependencies:', error);
  }

  return dependencies;
}

// Force delete property with dependencies
router.delete('/:id/force', authenticateUser, async (req, res) => {
  try {
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: existingProperty, error: fetchError } = await supabase
      .from('properties')
      .select('id, name')
      .eq('id', req.params.id)
      .single();
    
    if (fetchError || !existingProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check for dependencies to report what will be deleted
    const dependencies = await checkPropertyDependencies(supabase, req.params.id);
    
    // Delete dependencies first (in reverse order of foreign key relationships)
    if (dependencies.hasDependencies) {
      // Delete expenses first
      if (dependencies.expenses.count > 0) {
        const { error: expensesError } = await supabase
          .from('expenses')
          .delete()
          .eq('property_id', req.params.id);
        
        if (expensesError) {
          console.error('Error deleting expenses:', expensesError);
          return res.status(500).json({ message: 'Failed to delete related expenses' });
        }
      }

      // Update bookings to mark property as deleted (preserve booking history)
      if (dependencies.bookings.count > 0) {
        const { error: bookingsError } = await supabase
          .from('bookings')
          .update({ 
            property_deleted: true,
            deleted_property_name: existingProperty.name,
            property_id: null // Remove foreign key reference
          })
          .eq('property_id', req.params.id);
        
        if (bookingsError) {
          console.error('Error updating bookings:', bookingsError);
          return res.status(500).json({ message: 'Failed to update related bookings' });
        }
      }

      // Delete services
      if (dependencies.services.count > 0) {
        const { error: servicesError } = await supabase
          .from('services')
          .delete()
          .eq('property_id', req.params.id);
        
        if (servicesError) {
          console.error('Error deleting services:', servicesError);
          return res.status(500).json({ message: 'Failed to delete related services' });
        }
      }
    }
    
    // Now delete the property
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', req.params.id);
    
    if (error) {
      console.error('Property deletion error:', error);
      return res.status(400).json({ message: 'Failed to delete property' });
    }
    
    res.json({ 
      message: 'Property and all related data deleted successfully',
      deletedDependencies: dependencies
    });
    
  } catch (error) {
    console.error('Force property deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update property images
router.put('/:id/images', authenticateUser, async (req, res) => {
  try {
    const { images } = req.body;
    
    if (!Array.isArray(images)) {
      return res.status(400).json({ message: 'Images must be an array' });
    }
    
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: existingProperty, error: fetchError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', req.params.id)
      .single();
    
    if (fetchError || !existingProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    const { data: property, error } = await supabase
      .from('properties')
      .update({ images })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) {
      console.error('Property images update error:', error);
      return res.status(400).json({ message: 'Failed to update property images' });
    }
    
    res.json(property);
    
  } catch (error) {
    console.error('Property images update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 