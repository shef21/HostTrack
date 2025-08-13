const express = require('express');
const { createUserClient } = require('../config/supabase');
const authenticateUser = require('../middleware/auth');
const router = express.Router();

// Get all bookings for user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { status, propertyId, startDate, endDate } = req.query;
    
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    let query = supabase
      .from('bookings')
      .select(`
        *,
        property:properties(name, location)
      `)
      .eq('owner_id', req.user.id)
      .order('check_in', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }
    
    if (startDate) {
      query = query.gte('check_in', startDate);
    }
    
    if (endDate) {
      query = query.lte('check_in', endDate);
    }
    
    const { data: bookings, error } = await query;
    
    if (error) {
      console.error('Bookings fetch error:', error);
      return res.status(500).json({ message: 'Failed to fetch bookings' });
    }
    
    res.json(bookings);
    
  } catch (error) {
    console.error('Bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get booking statistics
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        check_in: { gte: startDate, lte: endDate }
      };
    }
    
    // Get total bookings and revenue
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    const { data: stats, error: statsError } = await supabase
      .from('bookings')
      .select('price, status')
      .eq('owner_id', req.user.id);
    
    if (statsError) {
      console.error('Stats error:', statsError);
      return res.status(500).json({ message: 'Failed to fetch statistics' });
    }
    
    // Calculate statistics
    const totalBookings = stats.length;
    const totalRevenue = stats.reduce((sum, booking) => sum + parseFloat(booking.price), 0);
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    
    // Get status breakdown
    const statusStats = {};
    stats.forEach(booking => {
      statusStats[booking.status] = (statusStats[booking.status] || 0) + 1;
    });
    
    res.json({
      overview: {
        totalBookings,
        totalRevenue,
        avgBookingValue
      },
      byStatus: statusStats
    });
    
  } catch (error) {
    console.error('Booking stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new booking
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      property_id,
      guest_name,
      guest_email,
      guest_phone,
      check_in,
      check_out,
      guests,
      price,
      currency,
      platform,
      platform_booking_id,
      notes,
      special_requests
    } = req.body;
    
    // Validation
    if (!property_id || !guest_name || !check_in || !check_out || !guests || !price) {
      return res.status(400).json({ 
        message: 'Please provide property, guest name, dates, guests, and price' 
      });
    }
    
    // Validate property ownership
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', property_id)
      .eq('owner_id', req.user.id)
      .single();
    
    if (propertyError || !property) {
      return res.status(400).json({ message: 'Invalid property' });
    }
    
    const bookingData = {
      property_id,
      owner_id: req.user.id,
      guest_name,
      guest_email: guest_email || null,
      guest_phone: guest_phone || null,
      check_in,
      check_out,
      guests: parseInt(guests),
      price: parseFloat(price),
      currency: currency || 'ZAR',
      platform: platform || 'direct',
      platform_booking_id: platform_booking_id || null,
      status: 'confirmed',
      payment_status: 'paid',
      notes: notes || null,
      special_requests: special_requests || null
    };
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select(`
        *,
        property:properties(name, location)
      `)
      .single();
    
    if (error) {
      console.error('Booking creation error:', error);
      return res.status(400).json({ message: 'Failed to create booking' });
    }
    
    res.status(201).json(booking);
    
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .single();
    
    if (fetchError || !existingBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const updateData = { ...req.body };
    delete updateData.id; // Prevent ID modification
    delete updateData.owner_id; // Prevent owner modification
    delete updateData.created_at; // Prevent timestamp modification
    
    // Validate property ownership if property_id is being updated
    if (updateData.property_id) {
      const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id')
        .eq('id', updateData.property_id)
        .eq('owner_id', req.user.id)
        .single();
      
      if (propertyError || !property) {
        return res.status(400).json({ message: 'Invalid property' });
      }
    }
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', req.params.id)
      .select(`
        *,
        property:properties(name, location)
      `)
      .single();
    
    if (error) {
      console.error('Booking update error:', error);
      return res.status(400).json({ message: 'Failed to update booking' });
    }
    
    res.json(booking);
    
  } catch (error) {
    console.error('Booking update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete booking
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .single();
    
    if (fetchError || !existingBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', req.params.id);
    
    if (error) {
      console.error('Booking deletion error:', error);
      return res.status(400).json({ message: 'Failed to delete booking' });
    }
    
    res.json({ message: 'Booking deleted successfully' });
    
  } catch (error) {
    console.error('Booking deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 