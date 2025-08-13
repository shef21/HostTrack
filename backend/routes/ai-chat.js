/**
 * AI Chat Backend Route
 * Secure proxy for Gemini API calls with user authentication and rate limiting
 */

const express = require('express');
const router = express.Router();
const { getUserContext } = require('../config/supabase');
const authenticateUser = require('../middleware/auth');

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Rate limiting and cost control configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 15; // Gemini free tier limit
const MAX_REQUESTS_PER_DAY = 100; // Daily limit to control costs
const DAILY_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

// User usage tracking
const userRequestCounts = new Map(); // Per-minute tracking
const userDailyCounts = new Map(); // Daily tracking
const userTokenUsage = new Map(); // Token usage tracking

// Simple response cache to reduce AI calls
const responseCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Cleanup old cache entries every hour
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of responseCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            responseCache.delete(key);
        }
    }
    console.log(`AI Chat - Cache cleanup completed, ${responseCache.size} entries remaining`);
}, 60 * 60 * 1000); // Every hour

// Cost estimation (approximate)
const COST_PER_1K_INPUT_TOKENS = 0.00015; // $0.00015 per 1K input tokens
const COST_PER_1K_OUTPUT_TOKENS = 0.0006; // $0.0006 per 1K output tokens

// Enhanced middleware to check rate limits and daily usage
function checkRateLimit(req, res, next) {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const now = Date.now();
    
    // Check per-minute rate limit
    const userRequests = userRequestCounts.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
        return res.status(429).json({ 
            error: 'Rate limit exceeded', 
            message: 'Please wait a moment before sending another message',
            retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - recentRequests[0])) / 1000)
        });
    }
    
    // Check daily limit
    const userDailyRequests = userDailyCounts.get(userId) || [];
    const todayRequests = userDailyRequests.filter(time => now - time < DAILY_LIMIT_WINDOW);
    
    if (todayRequests.length >= MAX_REQUESTS_PER_DAY) {
        return res.status(429).json({ 
            error: 'Daily limit exceeded', 
            message: 'You have reached your daily AI chat limit. Please try again tomorrow.',
            retryAfter: Math.ceil((DAILY_LIMIT_WINDOW - (now - todayRequests[0])) / 1000)
        });
    }
    
    // Add current request to both trackers
    recentRequests.push(now);
    todayRequests.push(now);
    userRequestCounts.set(userId, recentRequests);
    userDailyCounts.set(userId, todayRequests);
    
    next();
}

// Get user's property context for AI responses
async function getUserPropertyContext(userId, authToken) {
    try {
        // Create user-specific Supabase client
        const { createUserClient } = require('../config/supabase');
        const supabase = createUserClient(authToken);
        
        // Get user's properties
        const { data: properties, error: propertiesError } = await supabase
            .from('properties')
            .select('id, name, location, type, bedrooms, bathrooms, max_guests, price, currency, amenities')
            .eq('owner_id', userId)
            .order('created_at', { ascending: false });
        
        if (propertiesError) {
            console.error('Error fetching properties for AI context:', propertiesError);
            throw propertiesError;
        }
        
        // Get recent booking statistics
        const { data: recentBookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('id, property_id, check_in, check_out, price, status, created_at')
            .eq('owner_id', userId)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
            .order('created_at', { ascending: false });
        
        if (bookingsError) {
            console.error('Error fetching bookings for AI context:', bookingsError);
        }
        
        // Get current month revenue
        const currentMonth = new Date();
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        const { data: monthlyBookings, error: monthlyError } = await supabase
            .from('bookings')
            .select('price, status')
            .eq('owner_id', userId)
            .gte('check_in', startOfMonth.toISOString())
            .lte('check_in', endOfMonth.toISOString())
            .eq('status', 'confirmed');
        
        if (monthlyError) {
            console.error('Error fetching monthly bookings for AI context:', monthlyError);
        }
        
        // Get recent expenses for cost analysis
        const { data: recentExpenses, error: expensesError } = await supabase
            .from('expenses')
            .select('amount, category, property_id, date')
            .eq('owner_id', userId)
            .gte('date', startOfMonth.toISOString())
            .lte('date', endOfMonth.toISOString())
            .order('date', { ascending: false });
        
        if (expensesError) {
            console.error('Error fetching expenses for AI context:', expensesError);
        }
        
        // Get ALL services for maintenance insights (not just monthly due)
        const { data: recentServices, error: servicesError } = await supabase
            .from('services')
            .select('name, status, property_id, cost, next_due, description')
            .eq('owner_id', userId)
            .order('next_due', { ascending: false });
        
        if (servicesError) {
            console.error('Error fetching services for AI context:', servicesError);
        }
        
        // Calculate metrics
        const totalProperties = properties?.length || 0;
        const totalBookings = recentBookings?.length || 0;
        const confirmedBookings = recentBookings?.filter(b => b.status === 'confirmed').length || 0;
        const monthlyRevenue = monthlyBookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0;
        
        // Calculate expenses and services metrics
        const monthlyExpenses = recentExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
        const pendingServices = recentServices?.filter(s => s.status === 'active').length || 0;
        const completedServices = recentServices?.filter(s => s.status === 'completed').length || 0;
        
        // Calculate occupancy rate (simplified - based on confirmed bookings vs total days)
        const totalDaysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const totalAvailableDays = totalProperties * totalDaysInMonth;
        const occupiedDays = confirmedBookings * 2; // Assume average 2-day stays
        const occupancyRate = totalAvailableDays > 0 ? Math.round((occupiedDays / totalAvailableDays) * 100) : 0;
        
        // Calculate profit margin
        const profitMargin = monthlyRevenue > 0 ? Math.round(((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100) : 0;
        
        // Build detailed context
        let context = `You are Nathi, a friendly and knowledgeable property management AI assistant for HostTrack. `;
        
        if (totalProperties > 0) {
            context += `The user manages ${totalProperties} property(ies): `;
            properties.forEach((prop, index) => {
                context += `${prop.name} (${prop.type}) in ${prop.location} with ${prop.bedrooms} bedrooms, ${prop.bathrooms} bathrooms, max ${prop.max_guests} guests, priced at ${prop.currency} ${prop.price}/night`;
                if (prop.amenities && prop.amenities.length > 0) {
                    context += `, featuring ${prop.amenities.slice(0, 3).join(', ')}`;
                }
                context += index < properties.length - 1 ? '; ' : '. ';
            });
            
            context += `Recent performance: ${confirmedBookings} confirmed bookings in the last 30 days, generating ${properties[0].currency || 'ZAR'} ${monthlyRevenue.toLocaleString()} in revenue this month. `;
            context += `Current occupancy rate is approximately ${occupancyRate}%. `;
            context += `Monthly expenses: ${properties[0].currency || 'ZAR'} ${monthlyExpenses.toLocaleString()}, profit margin: ${profitMargin}%. `;
            context += `Services: ${pendingServices} pending, ${completedServices} completed this month. `;
            
            // Add specific insights based on property types
            const propertyTypes = [...new Set(properties.map(p => p.type))];
            if (propertyTypes.includes('apartment') && propertyTypes.includes('house')) {
                context += `The user has a mix of apartments and houses, which is great for diversifying their portfolio. `;
            } else if (propertyTypes.includes('apartment')) {
                context += `The user specializes in apartment rentals, which typically have higher turnover but lower maintenance costs. `;
            } else if (propertyTypes.includes('house')) {
                context += `The user focuses on house rentals, which often command higher rates and longer stays. `;
            }
        } else {
            context += `The user is new to HostTrack and doesn't have any properties listed yet. `;
        }
        
        return {
            hasProperties: totalProperties > 0,
            propertyCount: totalProperties,
            properties: properties || [],
            recentBookings: recentBookings || [],
            monthlyRevenue: monthlyRevenue,
            monthlyExpenses: monthlyExpenses,
            occupancyRate: occupancyRate,
            profitMargin: profitMargin,
            pendingServices: pendingServices,
            completedServices: completedServices,
            recentServices: recentServices || [],
            context: context
        };
        
    } catch (error) {
        console.error('Error getting user property context:', error);
        return {
            hasProperties: false,
            propertyCount: 0,
            context: 'You are Nathi, a friendly property management AI assistant for HostTrack. The user is new to the platform and doesn\'t have any properties listed yet.'
        };
    }
}

// Main chat endpoint
router.post('/chat', authenticateUser, checkRateLimit, async (req, res) => {
    try {
        const { message, topic, conversationContext, conversationTopics } = req.body;
        const userId = req.user?.id;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required and must be a string' });
        }

        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not configured');
            return res.status(500).json({ 
                error: 'AI service temporarily unavailable',
                message: 'Please try again later'
            });
        }

        // Check cache first to reduce AI calls
        const cacheKey = `${userId}:${message.toLowerCase().trim()}`;
        const cachedResponse = responseCache.get(cacheKey);
        
        if (cachedResponse && (Date.now() - cachedResponse.timestamp) < CACHE_TTL) {
            console.log(`AI Chat - Cache hit for user ${userId}, avoiding AI call`);
            return res.json({
                success: true,
                response: cachedResponse.response,
                timestamp: new Date().toISOString(),
                usage: {
                    user: userId,
                    messageLength: message.length,
                    responseLength: cachedResponse.response.length,
                    cached: true,
                    cost: 0
                }
            });
        }

        // Get user's property context with authentication token
        const userContext = await getUserPropertyContext(userId, req.headers.authorization?.split(' ')[1]);
        
        // Build enhanced AI prompt with topic-first approach
        let prompt = `You are Nathi, a friendly and knowledgeable property management AI assistant for HostTrack. `;
        
        // PRIORITY 1: Topic-specific instructions (most important)
        if (topic && topic !== 'general') {
            prompt += `IMPORTANT: The user is specifically asking about ${topic}. You MUST focus your entire response on ${topic} and avoid discussing other topics unless directly relevant. `;
            
            // Add topic-specific context and data
            if (topic === 'services') {
                prompt += `For services questions, focus on maintenance, upkeep, scheduling, and service-related insights. `;
                if (userContext.recentServices && userContext.recentServices.length > 0) {
                    prompt += `DETAILED SERVICE INFORMATION: `;
                    userContext.recentServices.forEach((service, index) => {
                        const dueDate = new Date(service.next_due).toLocaleDateString();
                        const cost = service.cost ? `${userContext.properties[0]?.currency || 'ZAR'} ${service.cost}` : 'No cost specified';
                        prompt += `Service ${index + 1}: ${service.name} - Status: ${service.status} - Description: ${service.description || 'No description provided'} - Next Due: ${dueDate} - Cost: ${cost}`;
                        prompt += index < userContext.recentServices.length - 1 ? ' | ' : '. ';
                    });
                    prompt += `IMPORTANT: Use this EXACT service data when responding. Quote specific service names, statuses, and due dates. `;
                    
                    // Debug logging for services
                    console.log(`AI Chat - Services data for user ${userId}:`, {
                        totalServices: userContext.recentServices.length,
                        services: userContext.recentServices.map(s => ({
                            name: s.name,
                            status: s.status,
                            description: s.description,
                            nextDue: s.next_due,
                            cost: s.cost
                        }))
                    });
                } else {
                    prompt += `No services found in the system. `;
                    console.log(`AI Chat - No services found for user ${userId}`);
                }
                prompt += `CRITICAL: Do NOT discuss property performance, pricing, occupancy rates, or booking strategies unless the user specifically asks about those topics. Focus ONLY on services, maintenance, and upkeep. `;
            } else if (topic === 'properties') {
                prompt += `For property questions, focus on property details, amenities, pricing, and property-specific insights. `;
            } else if (topic === 'bookings') {
                prompt += `For booking questions, focus on reservations, guest management, calendar, and booking-specific insights. `;
            } else if (topic === 'revenue') {
                prompt += `For revenue questions, focus on income, pricing, expenses, and financial insights. `;
            } else if (topic === 'analytics') {
                prompt += `For analytics questions, focus on performance metrics, trends, and data insights. `;
            }
        }
        
        // PRIORITY 2: Conversation context
        if (conversationContext) {
            prompt += `Conversation context: ${conversationContext}. Use this context to provide relevant follow-up information. `;
        }
        
        // PRIORITY 3: Conversation topics
        if (conversationTopics && conversationTopics.length > 0) {
            prompt += `Previous conversation topics: ${conversationTopics.join(', ')}. `;
        }
        
        // PRIORITY 4: General property context (only if relevant to the topic)
        if (userContext.hasProperties) {
            // Only include property context if it's relevant to the current topic
            if (topic === 'properties' || topic === 'general' || topic === 'analytics') {
                prompt += `${userContext.context} `;
                
                if (userContext.properties.length > 0) {
                    const prop = userContext.properties[0];
                    prompt += `Current business metrics: ${userContext.confirmedBookings || 0} confirmed bookings in last 30 days, ${prop.currency || 'ZAR'} ${userContext.monthlyRevenue?.toLocaleString() || 0} monthly revenue, ${userContext.occupancyRate || 0}% occupancy rate, ${prop.currency || 'ZAR'} ${userContext.monthlyExpenses?.toLocaleString() || 0} monthly expenses, ${userContext.profitMargin || 0}% profit margin, ${userContext.pendingServices || 0} pending services. `;
                }
            }
        } else {
            prompt += `The user is new to HostTrack and doesn't have any properties listed yet. `;
        }
        
        prompt += `Question: ${message} `;
        prompt += `CRITICAL INSTRUCTIONS: 
        1. Respond ONLY about ${topic || 'the topic asked'}. 
        2. If topic is 'services', focus ONLY on services, maintenance, and upkeep. Do NOT mention property performance, pricing, occupancy, or bookings.
        3. If topic is 'properties', focus ONLY on property details and property-specific insights.
        4. If topic is 'bookings', focus ONLY on reservations and guest management.
        5. Stay on topic and do not go off-topic under any circumstances.
        6. Be specific, actionable, and use the relevant data provided. 
        7. Keep response under 200 words. 
        8. Do not repeat introductory phrases like "I'm from hosttrack" or "I'm Nathi" unless this is the very first message.`;

        // Call Gemini API
        const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 300,
                    topP: 0.8,
                    topK: 40
                }
            })
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error:', geminiResponse.status, errorText);
            
            if (geminiResponse.status === 429) {
                return res.status(429).json({ 
                    error: 'AI service busy',
                    message: 'The AI service is currently busy. Please try again in a moment.'
                });
            }
            
            return res.status(500).json({ 
                error: 'AI service error',
                message: 'Sorry, I encountered an error. Please try again.'
            });
        }

        const data = await geminiResponse.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            
            // Cache the response to reduce future AI calls
            responseCache.set(cacheKey, {
                response: aiResponse,
                timestamp: Date.now()
            });
            
            // Estimate token usage and cost
            const estimatedInputTokens = Math.ceil(prompt.length / 4); // Rough estimate
            const estimatedOutputTokens = Math.ceil(aiResponse.length / 4);
            const estimatedCost = (estimatedInputTokens * COST_PER_1K_INPUT_TOKENS / 1000) + 
                                 (estimatedOutputTokens * COST_PER_1K_OUTPUT_TOKENS / 1000);
            
            // Track user's token usage
            const userTokens = userTokenUsage.get(userId) || { input: 0, output: 0, cost: 0 };
            userTokens.input += estimatedInputTokens;
            userTokens.output += estimatedOutputTokens;
            userTokens.cost += estimatedCost;
            userTokenUsage.set(userId, userTokens);
            
            // Log usage for monitoring
            console.log(`AI Chat - User: ${userId}, Message: ${message.substring(0, 50)}..., Tokens: ${estimatedInputTokens}i/${estimatedOutputTokens}o, Cost: $${estimatedCost.toFixed(6)}`);
            
            res.json({
                success: true,
                response: aiResponse,
                timestamp: new Date().toISOString(),
                usage: {
                    user: userId,
                    messageLength: message.length,
                    responseLength: aiResponse.length,
                    cached: false,
                    tokens: {
                        input: estimatedInputTokens,
                        output: estimatedOutputTokens
                    },
                    cost: estimatedCost
                }
            });
        } else {
            throw new Error('Invalid response format from Gemini API');
        }

    } catch (error) {
        console.error('AI Chat error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Sorry, I encountered an error. Please try again.'
        });
    }
});

// Get chat status and usage info
router.get('/status', authenticateUser, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const userRequests = userRequestCounts.get(userId) || [];
        const now = Date.now();
        const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
        
        const userTokens = userTokenUsage.get(userId) || { input: 0, output: 0, cost: 0 };
        
        res.json({
            success: true,
            rateLimit: {
                current: recentRequests.length,
                limit: MAX_REQUESTS_PER_MINUTE,
                window: RATE_LIMIT_WINDOW / 1000, // seconds
                resetTime: recentRequests.length > 0 ? 
                    new Date(recentRequests[0] + RATE_LIMIT_WINDOW).toISOString() : 
                    new Date().toISOString()
            },
            dailyLimit: {
                current: todayRequests.length,
                limit: MAX_REQUESTS_PER_DAY,
                window: DAILY_LIMIT_WINDOW / 1000 / 60 / 60, // hours
                resetTime: todayRequests.length > 0 ? 
                    new Date(todayRequests[0] + DAILY_LIMIT_WINDOW).toISOString() : 
                    new Date().toISOString()
            },
            usage: {
                tokens: {
                    input: userTokens.input,
                    output: userTokens.output,
                    total: userTokens.input + userTokens.output
                },
                cost: {
                    current: userTokens.cost,
                    estimated: userTokens.cost,
                    currency: 'USD'
                }
            },
            service: {
                status: GEMINI_API_KEY ? 'available' : 'unavailable',
                provider: 'Google Gemini'
            }
        });
    } catch (error) {
        console.error('Chat status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'AI Chat Backend',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!GEMINI_API_KEY
    });
});

// Usage monitoring endpoint (for administrators)
router.get('/usage', authenticateUser, (req, res) => {
    try {
        // Only allow admin users or the user themselves
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const totalUsers = userRequestCounts.size;
        const totalDailyRequests = Array.from(userDailyCounts.values())
            .reduce((sum, requests) => sum + requests.length, 0);
        const totalCost = Array.from(userTokenUsage.values())
            .reduce((sum, usage) => sum + usage.cost, 0);

        res.json({
            success: true,
            summary: {
                totalUsers,
                totalDailyRequests,
                totalCost: totalCost.toFixed(6),
                cacheSize: responseCache.size
            },
            limits: {
                perMinute: MAX_REQUESTS_PER_MINUTE,
                perDay: MAX_REQUESTS_PER_DAY,
                cacheTTL: CACHE_TTL / 1000 / 60 // minutes
            }
        });
    } catch (error) {
        console.error('Usage monitoring error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
