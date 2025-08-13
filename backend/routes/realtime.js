const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/auth');
const { createUserClient } = require('../config/supabase');

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Server-Sent Events endpoint for real-time updates
router.get('/events', (req, res) => {
    const userId = req.user.id;
    
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({
        type: 'connection',
        status: 'connected',
        userId: userId,
        timestamp: new Date().toISOString()
    })}\n\n`);

    // Store client connection
    const clientId = Date.now();
    req.app.locals.clients = req.app.locals.clients || new Map();
    req.app.locals.clients.set(clientId, { res, userId });

    // Send periodic heartbeat
    const heartbeat = setInterval(() => {
        res.write(`data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
        })}\n\n`);
    }, 30000);

    // Handle client disconnect
    req.on('close', () => {
        clearInterval(heartbeat);
        if (req.app.locals.clients) {
            req.app.locals.clients.delete(clientId);
        }
        console.log(`Client ${clientId} disconnected`);
    });

    // Send test update after 5 seconds
    setTimeout(() => {
        res.write(`data: ${JSON.stringify({
            type: 'test_update',
            message: 'Real-time connection established',
            timestamp: new Date().toISOString()
        })}\n\n`);
    }, 5000);
});

// Check for updates endpoint
router.get('/check-updates', async (req, res) => {
    try {
        const userId = req.user.id;
        const lastUpdate = req.headers['last-update'] || '0';
        const userClient = createUserClient(req.user.token);

        // Check for new bookings since last update
        const { data: newBookings } = await userClient
            .from('bookings')
            .select('id, property_id, check_in, check_out, price, guest_name, status')
            .eq('owner_id', userId)
            .gte('created_at', new Date(parseInt(lastUpdate)).toISOString())
            .limit(5);

        // Check for new properties since last update
        const { data: newProperties } = await userClient
            .from('properties')
            .select('id, name, address')
            .eq('owner_id', userId)
            .gte('created_at', new Date(parseInt(lastUpdate)).toISOString())
            .limit(3);

        // Check for revenue changes
        const { data: revenueChanges } = await userClient
            .from('bookings')
            .select('price, status')
            .eq('owner_id', userId)
            .eq('status', 'confirmed')
            .gte('updated_at', new Date(parseInt(lastUpdate)).toISOString());

        const hasChanges = newBookings?.length > 0 || newProperties?.length > 0 || revenueChanges?.length > 0;

        if (hasChanges) {
            // Calculate new revenue total
            const { data: allBookings } = await userClient
                .from('bookings')
                .select('price')
                .eq('owner_id', userId)
                .eq('status', 'confirmed');

            const totalRevenue = allBookings?.reduce((sum, booking) => sum + (booking.price || 0), 0) || 0;

            // Calculate new occupancy rate
            const { count: propertiesCount } = await userClient
                .from('properties')
                .select('*', { count: 'exact', head: true })
                .eq('owner_id', userId);

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

            res.json({
                hasChanges: true,
                updates: {
                    newBookings: newBookings || [],
                    newProperties: newProperties || [],
                    revenueChanges: revenueChanges || []
                },
                currentData: {
                    revenue: { total: totalRevenue },
                    occupancy: { rate: occupancyRate }
                },
                timestamp: Date.now()
            });
        } else {
            res.json({
                hasChanges: false,
                timestamp: Date.now()
            });
        }
    } catch (error) {
        console.error('Error checking for updates:', error);
        res.status(500).json({ 
            error: 'Failed to check for updates',
            hasChanges: false 
        });
    }
});

// Broadcast update to all connected clients
function broadcastUpdate(userId, updateData) {
    if (!router.app.locals.clients) return;
    
    router.app.locals.clients.forEach((client, clientId) => {
        if (client.userId === userId && client.res && !client.res.destroyed) {
            try {
                client.res.write(`data: ${JSON.stringify(updateData)}\n\n`);
            } catch (error) {
                console.error(`Error broadcasting to client ${clientId}:`, error);
                router.app.locals.clients.delete(clientId);
            }
        }
    });
}

// Export the broadcast function for use in other parts of the app
router.broadcastUpdate = broadcastUpdate;

module.exports = router;
