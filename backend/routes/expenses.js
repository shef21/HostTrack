const express = require('express');
const { createUserClient } = require('../config/supabase');
const authenticateUser = require('../middleware/auth');
const router = express.Router();

// Get all expenses for user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { propertyId, serviceId, category, startDate, endDate } = req.query;
    
    // Create client with user context for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    let query = supabase
      .from('expenses')
      .select(`
        *,
        property:properties(name, location),
        service:services(name, provider)
      `)
      .eq('owner_id', req.user.id)
      .order('date', { ascending: false });
    
    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }
    
    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    }
    
    const { data: expenses, error } = await query;
    
    if (error) {
      console.error('Expenses fetch error:', error);
      return res.status(500).json({ message: 'Failed to fetch expenses' });
    }
    
    res.json(expenses);
    
  } catch (error) {
    console.error('Expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expense statistics
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : now;
    
    // Use user client for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('amount, category, status')
      .eq('owner_id', req.user.id)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0]);
    
    if (error) {
      console.error('Expense stats error:', error);
      return res.status(500).json({ message: 'Failed to fetch expense statistics' });
    }
    
    // Calculate statistics
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const paidExpenses = expenses.filter(e => e.status === 'paid').length;
    const pendingExpenses = expenses.filter(e => e.status === 'pending').length;
    
    // Group by category
    const expensesByCategory = {};
    expenses.forEach(expense => {
      const amount = parseFloat(expense.amount);
      expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + amount;
    });
    
    res.json({
      overview: {
        totalExpenses,
        totalCount: expenses.length,
        paidCount: paidExpenses,
        pendingCount: pendingExpenses
      },
      byCategory: expensesByCategory,
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    });
    
  } catch (error) {
    console.error('Expense stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new expense
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      property_id,
      service_id,
      title,
      amount,
      currency,
      category,
      date,
      payment_method,
      notes
    } = req.body;
    
    // Validation
    if (!title || !amount || !category || !date) {
      return res.status(400).json({ 
        message: 'Please provide title, amount, category, and date' 
      });
    }
    
    // Use user client for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    // Validate property ownership if property_id is provided
    if (property_id) {
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id')
        .eq('id', property_id)
        .eq('owner_id', req.user.id)
        .single();
      
      if (propertyError || !property) {
        return res.status(400).json({ message: 'Invalid property' });
      }
    }
    
    // Validate service ownership if service_id is provided
    if (service_id) {
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('id')
        .eq('id', service_id)
        .eq('owner_id', req.user.id)
        .single();
      
      if (serviceError || !service) {
        return res.status(400).json({ message: 'Invalid service' });
      }
    }
    
    const expenseData = {
      owner_id: req.user.id,
      property_id: property_id || null,
      service_id: service_id || null,
      title,
      amount: parseFloat(amount),
      currency: currency || 'ZAR',
      category,
      date,
      status: 'paid',
      payment_method: payment_method || null,
      notes: notes || null
    };
    
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select(`
        *,
        property:properties(name, location),
        service:services(name, provider)
      `)
      .single();
    
    if (error) {
      console.error('Expense creation error:', error);
      return res.status(400).json({ message: 'Failed to create expense' });
    }
    
    res.status(201).json(expense);
    
  } catch (error) {
    console.error('Expense creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update expense
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    // Use user client for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: existingExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('id')
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .single();
    
    if (fetchError || !existingExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    const updateData = { ...req.body };
    delete updateData.id; // Prevent ID modification
    delete updateData.owner_id; // Prevent owner modification
    delete updateData.created_at; // Prevent timestamp modification
    
    // Validate property ownership if property_id is being updated
    if (updateData.property_id) {
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
    
    // Validate service ownership if service_id is being updated
    if (updateData.service_id) {
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('id')
        .eq('id', updateData.service_id)
        .eq('owner_id', req.user.id)
        .single();
      
      if (serviceError || !service) {
        return res.status(400).json({ message: 'Invalid service' });
      }
    }
    
    const { data: expense, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', req.params.id)
      .select(`
        *,
        property:properties(name, location),
        service:services(name, provider)
      `)
      .single();
    
    if (error) {
      console.error('Expense update error:', error);
      return res.status(400).json({ message: 'Failed to update expense' });
    }
    
    res.json(expense);
    
  } catch (error) {
    console.error('Expense update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete expense
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    // Use user client for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: existingExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('id')
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .single();
    
    if (fetchError || !existingExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', req.params.id);
    
    if (error) {
      console.error('Expense deletion error:', error);
      return res.status(400).json({ message: 'Failed to delete expense' });
    }
    
    res.json({ message: 'Expense deleted successfully' });
    
  } catch (error) {
    console.error('Expense deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload receipt for expense
router.put('/:id/receipt', authenticateUser, async (req, res) => {
  try {
    const { receipt } = req.body;
    
    if (!receipt) {
      return res.status(400).json({ message: 'Receipt URL is required' });
    }
    
    // Use user client for RLS
    const supabase = createUserClient(req.headers.authorization?.split(' ')[1]);
    
    const { data: existingExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('id')
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .single();
    
    if (fetchError || !existingExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    const { data: expense, error } = await supabase
      .from('expenses')
      .update({ receipt })
      .eq('id', req.params.id)
      .select(`
        *,
        property:properties(name, location),
        service:services(name, provider)
      `)
      .single();
    
    if (error) {
      console.error('Receipt update error:', error);
      return res.status(400).json({ message: 'Failed to update receipt' });
    }
    
    res.json(expense);
    
  } catch (error) {
    console.error('Receipt update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 