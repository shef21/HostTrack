# HostTrack Local Development Setup

This guide will help you set up HostTrack for local development.

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Git (for version control)

## Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies (root, backend, and frontend)
npm run install:all
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp env.local.example .env.local

# Edit .env.local with your local settings
nano .env.local  # or use your preferred editor
```

**Required Environment Variables:**
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `JWT_SECRET`: Secret key for JWT tokens (use a strong random string)
- `SESSION_SECRET`: Secret key for sessions (use a strong random string)

### 3. Start Local Development

```bash
# Start both backend and frontend servers
npm run dev

# Or start servers individually
npm run dev:backend    # Backend only (port 3001)
npm run dev:frontend   # Frontend only (port 3000)
```

## Local Supabase Setup (Optional)

If you want to run Supabase locally instead of using the cloud version:

### Option 1: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# This will provide you with:
# - Local Supabase URL
# - Local anon key
# - Local service role key
```

### Option 2: Docker Compose

```bash
# Clone Supabase local development
git clone https://github.com/supabase/supabase
cd supabase/docker

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

## Development Workflow

### Starting Development

1. **Start the development environment:**
   ```bash
   npm run dev
   ```

2. **Access your application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health

### Stopping Development

- Press `Ctrl+C` in the terminal running `npm run dev`
- The script will gracefully shut down both servers

### Troubleshooting

#### Port Conflicts

If you get port conflicts:

```bash
# Check what's using the ports
lsof -i :3000  # Frontend port
lsof -i :3001  # Backend port

# Kill processes on specific ports
kill -9 $(lsof -ti:3000)  # Frontend
kill -9 $(lsof -ti:3001)  # Backend
```

#### Environment Issues

```bash
# Verify environment variables are loaded
node -e "console.log(require('dotenv').config())"

# Check if .env.local exists
ls -la .env.local
```

#### Database Connection Issues

1. Verify your Supabase credentials in `.env.local`
2. Check if your Supabase project is active
3. Ensure your IP is whitelisted (if using cloud Supabase)

## File Structure

```
hosttrack-dev/
├── .env.local              # Local environment variables
├── env.local.example       # Environment template
├── start-local.js          # Cross-platform startup script
├── package.json            # Root package.json with dev scripts
├── backend/
│   ├── config/
│   │   ├── local.js        # Local backend config
│   │   └── supabase.js     # Supabase configuration
│   └── server.js           # Backend server
└── web/
    ├── config/
    │   └── local.js        # Local frontend config
    └── server.js           # Frontend server
```

## Available Scripts

- `npm run dev` - Start both servers in development mode
- `npm run dev:backend` - Start only backend server
- `npm run dev:frontend` - Start only frontend server
- `npm run start:all` - Start both servers in production mode
- `npm run install:all` - Install all dependencies

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env.local`** - It contains sensitive information
2. **Use strong secrets** - Generate random strings for JWT and session secrets
3. **Local only** - These settings are for development only
4. **Database access** - Ensure your local database has proper access controls

## Next Steps

Once your local environment is running:

1. **Test the API endpoints** using the health check
2. **Verify database connectivity** by testing a simple query
3. **Check frontend functionality** by navigating through the app
4. **Set up your IDE** for debugging and development

## Support

If you encounter issues:

1. Check the console output for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check the troubleshooting section above

For additional help, refer to the main project documentation or create an issue in the project repository.
