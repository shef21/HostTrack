require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Check if we're in a test environment or if variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found, using mock client');
  // Return mock objects for testing
  module.exports = {
    supabaseAuth: {
      auth: {
        getUser: async () => ({ data: { user: null }, error: new Error('Mock auth') })
      }
    },
    getUserContext: async () => null,
    createUserClient: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            gte: () => ({
              order: () => Promise.resolve({ data: [], error: null })
            })
          })
        })
      })
    })
  };
  return;
}

// Auth client for authentication operations only
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to get user context safely
async function getUserContext(token) {
  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error getting user context:', error);
    return null;
  }
}

// Helper function to create a Supabase client with user context for RLS
function createUserClient(token) {
  if (!token) {
    throw new Error('Token is required for database operations');
  }
  
  // Create a client with the user's JWT token for RLS policies
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
  
  return client;
}

module.exports = {
  supabaseAuth,
  getUserContext,
  createUserClient
};