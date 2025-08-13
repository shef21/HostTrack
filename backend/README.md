# HostTrack CSV Import Backend

This is the backend API for the HostTrack CSV Import System with Smart Property Matching Engine.

## 🚀 Features

- **Property Management API** - Create, read, update, delete properties
- **Smart Duplicate Detection** - Advanced algorithms to prevent duplicate properties
- **Cross-Platform ID Support** - Handle Airbnb, Booking.com, VRBO IDs
- **CSV Import Processing** - Bulk property import with validation
- **Row Level Security** - User data isolation and security

## 📋 Prerequisites

- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

## 🛠️ Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Database Setup
```bash
# Connect to your PostgreSQL database
psql -U your_username -d your_database

# Run the schema file
\i schema/properties.sql
```

### 3. Environment Variables
Create a `.env` file in the backend directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/hosttrack
NODE_ENV=development
PORT=3001
```

### 4. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 🌐 API Endpoints

### Properties
- `GET /api/properties` - Get all properties for user
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `POST /api/properties/check-duplicate` - Check for duplicates

### Health Check
- `GET /health` - Server health status

## 🔧 Testing

### Test with Frontend
1. Start the backend server (port 3001)
2. Start the frontend server (port 8000)
3. Upload CSV files to test the import system

### Test with cURL
```bash
# Health check
curl http://localhost:3001/health

# Create property
curl -X POST http://localhost:3001/api/properties \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Property",
    "location": "Test Location",
    "type": "apartment",
    "price": 1000,
    "bedrooms": 2,
    "bathrooms": 1
  }'

# Check for duplicates
curl -X POST http://localhost:3001/api/properties/check-duplicate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Property",
    "location": "Test Location"
  }'
```

## 🗄️ Database Schema

The system uses a PostgreSQL database with the following key features:

- **Properties Table** - Core property data
- **Platform IDs** - JSONB field for cross-platform identifiers
- **Amenities** - Array field for property features
- **Row Level Security** - User data isolation
- **Triggers** - Automatic timestamp updates
- **Indexes** - Performance optimization

## 🔐 Authentication

Currently using a simple test authentication middleware. In production, implement:

- JWT token validation
- User session management
- Rate limiting
- Input validation

## 🚨 Production Notes

- Replace test authentication with proper JWT validation
- Add rate limiting and security headers
- Implement proper error logging
- Add database connection pooling
- Set up monitoring and health checks

## 📊 Performance

- Database indexes for fast queries
- JSONB for flexible platform ID storage
- Array fields for efficient amenities storage
- Prepared statements for security

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL in .env
   - Verify PostgreSQL is running
   - Check database permissions

2. **CORS Errors**
   - Verify frontend URL in CORS configuration
   - Check if both servers are running

3. **Property Creation Fails**
   - Check required fields (name, location)
   - Verify database schema is correct
   - Check server logs for detailed errors

## 📞 Support

For issues or questions:
1. Check server logs
2. Verify database connectivity
3. Test API endpoints individually
4. Check frontend console for errors
