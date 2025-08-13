const express = require('express');
const { createUserClient } = require('../config/supabase');
const authenticateUser = require('../middleware/auth');
const router = express.Router();

// Get all services for user
router.get('/', authenticateUser, async (req, res) => {
  try {
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: services, error } = await supabase
      .from('services')
      .select(`
        *,
        property:properties(name, location)
      `)
      .eq('owner_id', req.user.id)
      .order('next_due', { ascending: true });
    
    if (error) {
      console.error('Services fetch error:', error);
      return res.status(500).json({ message: 'Failed to fetch services' });
    }
    
    res.json(services);
    
  } catch (error) {
    console.error('Services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get services by category
router.get('/category/:category', authenticateUser, async (req, res) => {
  try {
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: services, error } = await supabase
      .from('services')
      .select(`
        *,
        property:properties(name, location)
      `)
      .eq('category', req.params.category)
      .order('next_due', { ascending: true });
    
    if (error) {
      console.error('Services by category error:', error);
      return res.status(500).json({ message: 'Failed to fetch services' });
    }
    
    res.json(services);
    
  } catch (error) {
    console.error('Services by category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get upcoming due services
router.get('/upcoming/:days', authenticateUser, async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: services, error } = await supabase
      .from('services')
      .select(`
        *,
        property:properties(name, location)
      `)
      .eq('status', 'active')
      .lte('next_due', futureDate.toISOString().split('T')[0])
      .order('next_due', { ascending: true });
    
    if (error) {
      console.error('Upcoming services error:', error);
      return res.status(500).json({ message: 'Failed to fetch upcoming services' });
    }
    
    res.json(services);
    
  } catch (error) {
    console.error('Upcoming services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new service (development endpoint - bypasses auth)
router.post('/dev', async (req, res) => {
  try {
    const {
      name,
      provider,
      provider_contact,
      cost,
      currency,
      frequency,
      next_due,
      property_id,
      category,
      description,
      contract_number,
      auto_renew,
      payment_method,
      notes
    } = req.body;
    
    // Validation
    if (!name || !provider || !cost || !frequency || !next_due) {
      return res.status(400).json({ 
        message: 'Please provide name, provider, cost, frequency, and next due date' 
      });
    }
    
    const serviceData = {
      owner_id: 'ae9e2a68-fb8c-41ed-ac75-d0768d103894', // Test user ID
      name,
      provider,
      provider_contact: provider_contact || null,
      cost: parseFloat(cost),
      currency: currency || 'ZAR',
      frequency,
      next_due,
      status: 'active',
      property_id: property_id || null,
      category: category || 'other',
      description: description || null,
      contract_number: contract_number || null,
      auto_renew: auto_renew || false,
      payment_method: payment_method || null,
      notes: notes || null
    };
    
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: service, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select(`
        *,
        property:properties(name, location)
      `)
      .single();
    
    if (error) {
      console.error('Service creation error:', error);
      return res.status(400).json({ message: 'Failed to create service', details: error });
    }
    
    res.status(201).json(service);
    
  } catch (error) {
    console.error('Service creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new service
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      name,
      provider,
      provider_contact,
      cost,
      currency,
      frequency,
      next_due,
      property_id,
      category,
      description,
      contract_number,
      auto_renew,
      payment_method,
      notes
    } = req.body;
    
    // Validation
    if (!name || !provider || !cost || !frequency || !next_due) {
      return res.status(400).json({ 
        message: 'Please provide name, provider, cost, frequency, and next due date' 
      });
    }
    
    // Validate property ownership if property_id is provided
    if (property_id) {
      // Create client with user context for RLS
      const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
      
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id')
        .eq('id', property_id)
        .single();
      
      if (propertyError || !property) {
        return res.status(400).json({ message: 'Invalid property' });
      }
    }
    
    const serviceData = {
      owner_id: req.user.id,
      name,
      provider,
      provider_contact: provider_contact || null,
      cost: parseFloat(cost),
      currency: currency || 'ZAR',
      frequency,
      next_due,
      status: 'active',
      property_id: property_id || null,
      category: category || 'other',
      description: description || null,
      contract_number: contract_number || null,
      auto_renew: auto_renew || false,
      payment_method: payment_method || null,
      notes: notes || null
    };
    
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: service, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select(`
        *,
        property:properties(name, location)
      `)
      .single();
    
    if (error) {
      console.error('Service creation error:', error);
      return res.status(400).json({ message: 'Failed to create service' });
    }
    
    res.status(201).json(service);
    
  } catch (error) {
    console.error('Service creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update service
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    console.log('Service update request:', {
      serviceId: req.params.id,
      userId: req.user.id,
      updateData: req.body
    });

    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: existingService, error: fetchError } = await supabase
      .from('services')
      .select('id')
      .eq('id', req.params.id)
      .single();
    
    if (fetchError || !existingService) {
      console.log('Service not found or access denied:', { fetchError, existingService });
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const updateData = { ...req.body };
    delete updateData.id; // Prevent ID modification
    delete updateData.owner_id; // Prevent owner modification
    delete updateData.created_at; // Prevent timestamp modification
    
    console.log('Processed update data:', updateData);
    
    // Validate property ownership if property_id is being updated
    if (updateData.property_id) {
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id')
        .eq('id', updateData.property_id)
        .single();
      
      if (propertyError || !property) {
        console.log('Invalid property:', { propertyError, property });
        return res.status(400).json({ message: 'Invalid property' });
      }
    }
    
    const { data: service, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', req.params.id)
      .select(`
        *,
        property:properties(name, location)
      `)
      .single();
    
    if (error) {
      console.error('Service update error:', error);
      return res.status(400).json({ message: 'Failed to update service' });
    }
    
    console.log('Service updated successfully:', service);
    res.json(service);
    
  } catch (error) {
    console.error('Service update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete service
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: existingService, error: fetchError } = await supabase
      .from('services')
      .select('id')
      .eq('id', req.params.id)
      .single();
    
    if (fetchError || !existingService) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', req.params.id);
    
    if (error) {
      console.error('Service deletion error:', error);
      return res.status(400).json({ message: 'Failed to delete service' });
    }
    
    res.json({ message: 'Service deleted successfully' });
    
  } catch (error) {
    console.error('Service deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk update services
router.put('/bulk/update', authenticateUser, async (req, res) => {
  try {
    const { serviceIds, updates } = req.body;
    
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ message: 'Service IDs must be an array' });
    }
    
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    // Verify all services belong to the user
    const { data: services, error: fetchError } = await supabase
      .from('services')
      .select('id')
      .in('id', serviceIds);
    
    if (fetchError || services.length !== serviceIds.length) {
      return res.status(400).json({ message: 'Invalid service IDs' });
    }
    
    const { error } = await supabase
      .from('services')
      .update(updates)
      .in('id', serviceIds);
    
    if (error) {
      console.error('Bulk update error:', error);
      return res.status(400).json({ message: 'Failed to update services' });
    }
    
    res.json({ message: `${serviceIds.length} services updated successfully` });
    
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 