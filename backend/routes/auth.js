const express = require('express');
const { supabaseAuth, createUserClient } = require('../config/supabase');
const router = express.Router();

// GET /api/auth - Auth endpoints information
router.get('/', async (req, res) => {
  try {
    res.json({
      message: 'HostTrack Authentication API',
      status: 'active',
      endpoints: {
        'POST /api/auth/register': 'User registration',
        'POST /api/auth/login': 'User login',
        'GET /api/auth/me': 'Get current user profile',
        'PUT /api/auth/profile': 'Update user profile',
        'POST /api/auth/logout': 'User logout'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth info error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    
    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        message: 'Please provide email, password, and name' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters' 
      });
    }
    
    // Create user with Supabase Auth (auto-confirm for development)
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone
        },
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`
      }
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      return res.status(400).json({ 
        message: authError.message || 'Registration failed' 
      });
    }
    
    // Note: Profile will be created when user first logs in
    // We can't create it here without admin access
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({ 
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Development endpoint to create user without email confirmation
router.post('/dev-register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    
    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        message: 'Please provide email, password, and name' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters' 
      });
    }
    
    console.log('Creating user without email confirmation:', email);
    
    // Create user with regular signup (will need email confirmation)
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone
        }
      }
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      return res.status(400).json({ 
        message: authError.message || 'Registration failed' 
      });
    }
    
    // Note: Profile will be created when user first logs in
    // We can't create it here without admin access
    
    res.status(201).json({
      message: 'User registered successfully. Please check your email for confirmation.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({ 
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 === LOGIN DEBUG START ===');
    console.log('📧 Login attempt for email:', email);
    console.log('🔑 Password provided:', password ? 'Yes' : 'No');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    // Validation
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ 
        message: 'Please provide email and password' 
      });
    }
    
    console.log('✅ Validation passed, attempting Supabase login...');
    // Login with Supabase Auth
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.log('❌ Supabase login error:', error);
      console.log('❌ Error message:', error.message);
      console.log('❌ Error code:', error.code);
      console.log('❌ Error status:', error.status);
      return res.status(400).json({ 
        message: 'Invalid credentials' 
      });
    }
    
    console.log('✅ Supabase login successful!');
    console.log('👤 User ID:', data.user.id);
    console.log('📧 User email:', data.user.email);
    console.log('🔑 Session access token present:', !!data.session?.access_token);
    console.log('🔑 Session refresh token present:', !!data.session?.refresh_token);
    
    // Get user profile using user context (no admin client needed)
    console.log('🔍 Fetching user profile...');
    const userClient = createUserClient(data.session.access_token);
    
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    let userProfile = profile;
    
    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create a default one using user context
      console.log('⚠️ Profile not found for user:', data.user.id, '- creating default profile');
      
      const { data: newProfile, error: createError } = await userClient
        .from('profiles')
        .insert({
          id: data.user.id,
          name: data.user.user_metadata?.name || 'User',
          phone: '',
          settings: {
            notifications: true,
            currency: 'ZAR',
            timezone: 'Africa/Johannesburg'
          }
        })
        .select()
        .single();
      
      if (!createError) {
        userProfile = newProfile;
        console.log('✅ Default profile created successfully');
      } else {
        console.error('❌ Profile creation error:', createError);
        // If profile creation fails due to duplicate key, try to fetch the existing profile
        if (createError.code === '23505') {
          console.log('🔄 Profile already exists, fetching existing profile...');
          const { data: existingProfile, error: fetchError } = await userClient
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (!fetchError && existingProfile) {
            userProfile = existingProfile;
            console.log('✅ Existing profile fetched successfully');
          } else {
            console.error('❌ Failed to fetch existing profile:', fetchError);
            // Create a default profile object for the response
            userProfile = {
              id: data.user.id,
              name: data.user.user_metadata?.name || 'User',
              phone: '',
              settings: {
                notifications: true,
                currency: 'ZAR',
                timezone: 'Africa/Johannesburg'
              }
            };
          }
        } else {
          // For other errors (like RLS), create a default profile object
          console.log('⚠️ Creating default profile object due to RLS or other errors');
          userProfile = {
            id: data.user.id,
            name: data.user.user_metadata?.name || 'User',
            phone: '',
            settings: {
              notifications: true,
              currency: 'ZAR',
              timezone: 'Africa/Johannesburg'
            }
          };
        }
      }
    } else if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      // Create a default profile object for the response
      userProfile = {
        id: data.user.id,
        name: data.user.user_metadata?.name || 'User',
        phone: '',
        settings: {
          notifications: true,
          currency: 'ZAR',
          timezone: 'Africa/Johannesburg'
        }
      };
    } else {
      console.log('✅ Profile fetched successfully');
    }
    
    const responseData = {
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: userProfile?.name || data.user.user_metadata?.name || 'User',
        phone: userProfile?.phone || '',
        settings: userProfile?.settings || {
          notifications: true,
          currency: 'ZAR',
          timezone: 'Africa/Johannesburg'
        }
      },
      session: data.session
    };
    
    console.log('📤 Preparing response data...');
    console.log('👤 Response user ID:', responseData.user.id);
    console.log('📧 Response user email:', responseData.user.email);
    console.log('🔑 Response session token present:', !!responseData.session?.access_token);
    console.log('📊 Response data structure:', JSON.stringify(responseData, null, 2));
    
    console.log('🚀 Sending successful login response');
    console.log('🔐 === LOGIN DEBUG END ===');
    res.json(responseData);
    
  } catch (error) {
    console.error('💥 Login error:', error);
    console.error('💥 Error stack:', error.stack);
    console.error('💥 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({ 
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get Current User
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Get user profile
    const userClient = createUserClient(token);
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // If profile doesn't exist, create a default one
    let userProfile = profile;
    if (profileError && profileError.code === 'PGRST116') {
      console.log('Profile not found for user:', user.id, '- creating default profile');
      
      // Use user context for profile creation to work with RLS
      const userClient = createUserClient(token);
      const { data: newProfile, error: createError } = await userClient
        .from('profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || 'User',
          phone: '',
          settings: {
            notifications: true,
            currency: 'ZAR',
            timezone: 'Africa/Johannesburg'
          }
        })
        .select()
        .single();
      
      if (!createError) {
        userProfile = newProfile;
      }
    }
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: userProfile?.name || user.user_metadata?.name || 'User',
        phone: userProfile?.phone || '',
        settings: userProfile?.settings || {
          notifications: true,
          currency: 'ZAR',
          timezone: 'Africa/Johannesburg'
        }
      }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Profile
router.put('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const { name, phone, settings } = req.body;
    
    console.log('Profile update request for user with token:', token ? 'Present' : 'Missing');
    console.log('Update data:', { name, phone, settings });
    
    // Get user context using sustainable approach
    const user = await supabaseAuth.auth.getUser(token);
    if (!user) {
      console.error('Invalid token for profile update');
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    console.log('User context retrieved:', { id: user.user.id, email: user.user.email });
    
    // Use user context for profile operations (sustainable approach)
    const userClient = createUserClient(token);
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .upsert({
        id: user.user.id,
        name: name || user.user.user_metadata?.name || 'User',
        phone: phone || '',
        settings: settings || {
          notifications: true,
          currency: 'ZAR',
          timezone: 'Africa/Johannesburg'
        }
      }, {
        onConflict: 'id'
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('Profile operation error:', profileError);
      return res.status(400).json({ message: 'Failed to update profile' });
    }
    
    console.log('Profile updated successfully:', profile);
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.user.id,
        email: user.user.email,
        name: profile.name,
        phone: profile.phone,
        settings: profile.settings
      }
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // Use user client for logout (sustainable approach)
      const userClient = createUserClient(token);
      await userClient.auth.signOut();
    }
    
    res.json({ message: 'Logged out successfully' });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 