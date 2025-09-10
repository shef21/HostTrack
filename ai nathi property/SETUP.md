# AI Nathi Property - Setup Guide

## Prerequisites

1. **Python 3.8+** installed
2. **Node.js 16+** and npm installed
3. **Supabase account** (free tier)
4. **OpenAI API key**

## Step 1: Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to **Settings > API**
3. Copy your:
   - Project URL
   - Anon public key
   - Service role key (keep this secret!)
4. Go to **SQL Editor** and run the contents of `backend/database_schema.sql`

## Step 2: Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create environment file:
   ```bash
   cp env.example .env
   ```

5. Edit `.env` with your credentials:
   ```env
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   SECRET_KEY=your_secret_key_here
   FRONTEND_URL=http://localhost:3000
   ```

6. Run the backend:
   ```bash
   uvicorn main:app --reload
   ```

The backend will be available at `http://localhost:8000`

## Step 3: Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp env.example .env
   ```

4. Edit `.env`:
   ```env
   REACT_APP_API_URL=http://localhost:8000
   ```

5. Start the frontend:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## Step 4: Test the Application

1. Open `http://localhost:3000` in your browser
2. Try the **Chat** tab - send a message
3. Try the **Memory** tab - create a memory
4. Try the **Data Ingestion** tab - upload a CSV/JSON file

## Troubleshooting

### Backend Issues
- Check that all environment variables are set correctly
- Ensure Supabase project is active and accessible
- Verify OpenAI API key has sufficient credits

### Frontend Issues
- Check that backend is running on port 8000
- Verify CORS settings in backend
- Check browser console for errors

### Database Issues
- Ensure pgvector extension is enabled in Supabase
- Check that all tables were created successfully
- Verify RLS policies are set correctly

## Next Steps

1. **Deploy Backend**: Use Railway, Render, or Heroku
2. **Deploy Frontend**: Use Vercel or Netlify
3. **Set up Domain**: Configure custom domain
4. **Monitor**: Set up logging and monitoring
5. **Scale**: Optimize for production load

## Production Deployment

### Backend (Railway)
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables
3. Deploy automatically on push

### Environment Variables for Production
```env
# Backend
SUPABASE_URL=your_production_supabase_url
SUPABASE_KEY=your_production_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
OPENAI_API_KEY=your_openai_api_key
SECRET_KEY=your_strong_secret_key
FRONTEND_URL=https://your-frontend-domain.com
ENVIRONMENT=production

# Frontend
REACT_APP_API_URL=https://your-backend-domain.com
```
