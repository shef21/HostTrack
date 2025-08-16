const { createUserClient } = require('../config/supabase');

// Get dashboard overview data
async function getDashboardData(req, res) {
    try {
        console.log('🔍 getDashboardData called with user:', req.user);
        const userId = req.user.id;
        const userClient = createUserClient(req.user.token);
        
        console.log('🔍 User client created, querying properties...');
        
        // TEMPORARY: Check if we're getting real data or mock data
        console.log('🔍 User client type:', typeof userClient);
        console.log('🔍 User client methods:', Object.keys(userClient));
        
        // Get properties count
        const { count: propertiesCount } = await userClient
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', userId);
        
        console.log('🔍 Properties count result:', propertiesCount);

        // Get bookings count and status breakdown
        const { data: bookings } = await userClient
            .from('bookings')
            .select('status')
            .eq('owner_id', userId);

        const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
        const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;
        const totalBookings = bookings?.length || 0;

        // Get services count
        const { count: servicesCount } = await userClient
            .from('services')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', userId);

        // Calculate revenue from confirmed bookings and get monthly breakdown
        const { data: revenueData } = await userClient
            .from('bookings')
            .select('price, check_in, check_out')
            .eq('owner_id', userId)
            .eq('status', 'confirmed');

        console.log('🔍 Revenue data from bookings:', revenueData);

        const totalRevenue = revenueData?.reduce((sum, booking) => sum + (booking.price || 0), 0) || 0;
        console.log('🔍 Total revenue calculated:', totalRevenue);

        // Calculate monthly revenue for the last 6 months with better date handling
        const monthlyRevenue = {};
        const currentDate = new Date();
        
        // Create month keys for the last 6 months INCLUDING current month
        for (let i = 5; i >= 0; i--) {
            const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = month.toISOString().slice(0, 7);
            monthlyRevenue[monthKey] = 0;
        }

        console.log('🔍 Month keys created:', Object.keys(monthlyRevenue));

        // Distribute revenue across months based on check-in dates
        revenueData?.forEach(booking => {
            if (booking.check_in && booking.price) {
                const checkInDate = new Date(booking.check_in);
                const monthKey = checkInDate.toISOString().slice(0, 7);
                
                console.log('🔍 Processing booking:', {
                    checkIn: booking.check_in,
                    monthKey: monthKey,
                    price: booking.price,
                    monthExists: monthlyRevenue[monthKey] !== undefined
                });
                
                // If the month is in our 6-month range, add the revenue
                if (monthlyRevenue[monthKey] !== undefined) {
                    monthlyRevenue[monthKey] += (booking.price || 0);
                    console.log('🔍 Added revenue to month:', monthKey, 'New total:', monthlyRevenue[monthKey]);
                } else {
                    // If the month is not in our range, add it dynamically
                    monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (booking.price || 0);
                    console.log('🔍 Added new month:', monthKey, 'Revenue:', monthlyRevenue[monthKey]);
                }
            }
        });

        console.log('🔍 Monthly revenue after distribution:', monthlyRevenue);

        // Sort months chronologically
        const sortedMonths = Object.keys(monthlyRevenue).sort();
        const sortedAmounts = sortedMonths.map(month => monthlyRevenue[month]);

        console.log('🔍 Sorted months:', sortedMonths);
        console.log('🔍 Sorted amounts:', sortedAmounts);

        // If no revenue was distributed to months but we have total revenue,
        // distribute it to the current month as a fallback
        if (totalRevenue > 0 && Object.values(monthlyRevenue).every(amount => amount === 0)) {
            const currentMonthKey = currentDate.toISOString().slice(0, 7);
            if (monthlyRevenue[currentMonthKey] !== undefined) {
                monthlyRevenue[currentMonthKey] = totalRevenue;
                console.log('🔍 Fallback: Distributed total revenue to current month:', currentMonthKey);
            }
        }

        // Calculate occupancy rate for current month
        const currentMonth = new Date().toISOString().slice(0, 7);
        const { data: currentMonthBookings } = await userClient
            .from('bookings')
            .select('check_in, check_out')
            .eq('owner_id', userId)
            .eq('status', 'confirmed')
            .gte('check_in', `${currentMonth}-01`)
            .lt('check_in', `${currentMonth}-32`);

        let occupancyRate = 0;
        if (propertiesCount > 0 && currentMonthBookings?.length > 0) {
            const totalDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            const totalAvailableDays = propertiesCount * totalDaysInMonth;
            let totalBookedDays = 0;
            
            currentMonthBookings.forEach(booking => {
                const checkIn = new Date(booking.check_in);
                const checkOut = new Date(booking.check_out);
                const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                totalBookedDays += days;
            });
            
            occupancyRate = Math.round((totalBookedDays / totalAvailableDays) * 100);
        }

        // Get property-specific occupancy data
        const { data: properties } = await userClient
            .from('properties')
            .select('id, name')
            .eq('owner_id', userId);

        const propertyOccupancy = [];
        if (properties && properties.length > 0) {
            for (const property of properties) {
                const { data: propertyBookings } = await userClient
                    .from('bookings')
                    .select('check_in, check_out')
                    .eq('owner_id', userId)
                    .eq('property_id', property.id)
                    .eq('status', 'confirmed')
                    .gte('check_in', `${currentMonth}-01`)
                    .lt('check_in', `${currentMonth}-32`);

                let propertyBookedDays = 0;
                propertyBookings?.forEach(booking => {
                    const checkIn = new Date(booking.check_in);
                    const checkOut = new Date(booking.check_out);
                    const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                    propertyBookedDays += days;
                });

                const totalDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                const propertyOccupancyRate = Math.round((propertyBookedDays / totalDaysInMonth) * 100);
                
                propertyOccupancy.push({
                    name: property.name,
                    occupancy: propertyOccupancyRate
                });
            }
        }

        // Calculate weekly occupancy for current week
        const currentWeekStart = new Date();
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
        const weeklyOccupancy = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun

        const { data: weeklyBookings } = await userClient
            .from('bookings')
            .select('check_in, check_out')
            .eq('owner_id', userId)
            .eq('status', 'confirmed')
            .gte('check_in', currentWeekStart.toISOString().split('T')[0]);

        if (weeklyBookings && propertiesCount > 0) {
            const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            weeklyBookings.forEach(booking => {
                const checkIn = new Date(booking.check_in);
                const checkOut = new Date(booking.check_out);
                const dayOfWeek = checkIn.getDay();
                
                // Calculate how many days this booking covers in the current week
                const weekEnd = new Date(currentWeekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                let daysInWeek = 0;
                let currentDate = new Date(checkIn);
                while (currentDate <= checkOut && currentDate <= weekEnd) {
                    if (currentDate >= currentWeekStart) {
                        const dayIndex = currentDate.getDay();
                        weeklyOccupancy[dayIndex] += 1;
                        daysInWeek++;
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            });

            // Convert to percentages
            for (let i = 0; i < 7; i++) {
                weeklyOccupancy[i] = Math.round((weeklyOccupancy[i] / propertiesCount) * 100);
            }
        }

        const dashboardData = {
            overview: {
                totalRevenue,
                totalBookings,
                avgBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
                occupancyRate
            },
            properties: { 
                total: propertiesCount || 0,
                names: propertyOccupancy.map(p => p.name),
                occupancy: propertyOccupancy.map(p => p.occupancy)
            },
            bookings: { 
                total: totalBookings, 
                confirmed: confirmedBookings, 
                pending: pendingBookings 
            },
            services: { total: servicesCount || 0 },
            revenue: {
                total: totalRevenue,
                monthly: monthlyRevenue,
                months: sortedMonths,
                amounts: sortedAmounts
            },
            occupancy: {
                rate: occupancyRate,
                weekly: weeklyOccupancy
            }
        };

        console.log('🔍 Final dashboard data being sent:', JSON.stringify(dashboardData, null, 2));
        res.json(dashboardData);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
}

// Get revenue analytics
async function getRevenueAnalytics(req, res) {
    try {
        const userId = req.user.id;
        const userClient = createUserClient(req.user.token);
        const { startDate, endDate } = req.query;

        let query = userClient
            .from('bookings')
            .select('price, check_in, check_out, status')
            .eq('owner_id', userId)
            .eq('status', 'confirmed');

        if (startDate && endDate) {
            query = query.gte('check_in', startDate).lte('check_in', endDate);
        }

        const { data: bookings, error } = await query;

        if (error) throw error;

        // Group by month
        const monthlyRevenue = {};
        bookings?.forEach(booking => {
            const month = new Date(booking.check_in).toISOString().slice(0, 7);
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (booking.price || 0);
        });

        res.json({
            monthlyRevenue,
            totalRevenue: Object.values(monthlyRevenue).reduce((sum, revenue) => sum + revenue, 0)
        });
    } catch (error) {
        console.error('Error fetching revenue analytics:', error);
        res.status(500).json({ error: 'Failed to fetch revenue analytics' });
    }
}

// Get occupancy analytics
async function getOccupancyAnalytics(req, res) {
    try {
        const userId = req.user.id;
        const userClient = createUserClient(req.user.token);
        const { startDate, endDate } = req.query;

        let query = userClient
            .from('bookings')
            .select('check_in, check_out, property_id')
            .eq('owner_id', userId)
            .eq('status', 'confirmed');

        if (startDate && endDate) {
            query = query.gte('check_in', startDate).lte('check_in', endDate);
        }

        const { data: bookings, error } = await query;

        if (error) throw error;

        // Calculate occupancy rates
        const occupancyData = {};
        bookings?.forEach(booking => {
            const month = new Date(booking.check_in).toISOString().slice(0, 7);
            if (!occupancyData[month]) {
                occupancyData[month] = { totalDays: 0, bookedDays: 0 };
            }
            
            const checkIn = new Date(booking.check_in);
            const checkOut = new Date(booking.check_out);
            const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            
            occupancyData[month].bookedDays += days;
        });

        res.json({ occupancyData });
    } catch (error) {
        console.error('Error fetching occupancy analytics:', error);
        res.status(500).json({ error: 'Failed to fetch occupancy analytics' });
    }
}

// Get expenses analytics
async function getExpensesAnalytics(req, res) {
    try {
        const userId = req.user.id;
        const userClient = createUserClient(req.user.token);
        const { startDate, endDate } = req.query;

        let query = userClient
            .from('expenses')
            .select('amount, category, date')
            .eq('owner_id', userId);

        if (startDate && endDate) {
            query = query.gte('date', startDate).lte('date', endDate);
        }

        const { data: expenses, error } = await query;

        if (error) throw error;

        // Group by category and month
        const categoryExpenses = {};
        const monthlyExpenses = {};

        expenses?.forEach(expense => {
            const month = new Date(expense.date).toISOString().slice(0, 7);
            
            // Category breakdown
            categoryExpenses[expense.category] = (categoryExpenses[expense.category] || 0) + (expense.amount || 0);
            
            // Monthly breakdown
            monthlyExpenses[month] = (monthlyExpenses[month] || 0) + (expense.amount || 0);
        });

        res.json({
            categoryExpenses,
            monthlyExpenses,
            totalExpenses: Object.values(monthlyExpenses).reduce((sum, amount) => sum + amount, 0)
        });
    } catch (error) {
        console.error('Error fetching expenses analytics:', error);
        res.status(500).json({ error: 'Failed to fetch expenses analytics' });
    }
}

// List all user data for debugging
async function listAllUserData(req, res) {
    try {
        const userId = req.user.id;
        const userClient = createUserClient(req.user.token);
        
        const { data: properties } = await userClient
            .from('properties')
            .select('*')
            .eq('owner_id', userId);

        const { data: bookings } = await userClient
            .from('bookings')
            .select('*')
            .eq('owner_id', userId);

        const { data: services } = await userClient
            .from('services')
            .select('*')
            .eq('owner_id', userId);

        const { data: expenses } = await userClient
            .from('expenses')
            .select('*')
            .eq('owner_id', userId);

        res.json({
            properties: properties || [],
            bookings: bookings || [],
            services: services || [],
            expenses: expenses || []
        });
    } catch (error) {
        console.error('Error listing user data:', error);
        res.status(500).json({ error: 'Failed to list user data' });
    }
}

// Test endpoint to verify frontend chart functionality
async function testDashboardData(req, res) {
    console.log('🧪 Test dashboard endpoint called');
    
    const testData = {
        overview: {
            totalRevenue: 15000,
            totalBookings: 8,
            avgBookingValue: 1875,
            occupancyRate: 75
        },
        properties: { 
            total: 3,
            names: ['Cape Town Villa', 'Joburg Suite', 'Durban Beach House'],
            occupancy: [80, 70, 75]
        },
        bookings: { 
            total: 8, 
            confirmed: 6, 
            pending: 2 
        },
        services: { total: 5 },
        revenue: {
            total: 15000,
            monthly: { '2024-01': 2000, '2024-02': 2500, '2024-03': 3000, '2024-04': 3500, '2024-05': 4000, '2024-06': 0 },
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            amounts: [2000, 2500, 3000, 3500, 4000, 0]
        },
        occupancy: {
            rate: 75,
            weekly: [60, 70, 80, 75, 85, 90, 65]
        }
    };
    
    console.log('🧪 Sending test data:', JSON.stringify(testData, null, 2));
    res.json(testData);
}

module.exports = {
    getDashboardData,
    getRevenueAnalytics,
    getOccupancyAnalytics,
    getExpensesAnalytics,
    listAllUserData,
    testDashboardData
}; 