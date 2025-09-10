# AI Nathi Deployment Guide

## Quick Deployment to Railway

### Step 1: Deploy AI Nathi Backend to Railway

1. **Go to Railway.app** and sign in with GitHub
2. **Create New Project** → "Deploy from GitHub repo"
3. **Select your repository** and set root directory to `ai nathi property/backend`
4. **Set Environment Variables**:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   SECRET_KEY=your_secret_key_here
   FRONTEND_URL=https://host-track.vercel.app
   ENVIRONMENT=production
   ```
5. **Deploy** - Railway will automatically detect Python and install dependencies
6. **Copy your Railway URL** (e.g., `https://ai-nathi-production.up.railway.app`)

### Step 2: Update Frontend API URL

1. **Update the API URL** in `web/homepage.html`:
   - Find line 1133: `const AI_API_URL = 'https://your-ai-service.railway.app/api/chat/';`
   - Replace with your actual Railway URL: `const AI_API_URL = 'https://ai-nathi-production.up.railway.app/api/chat/';`

2. **Deploy to Vercel**:
   - Push changes to GitHub
   - Vercel will automatically redeploy

### Step 3: Test the Integration

1. **Visit your homepage**: `https://host-track.vercel.app`
2. **Ask Nathi a question** in the chat interface
3. **Verify responses** are coming from the AI service

## Environment Variables Required

### Railway (AI Backend)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `OPENAI_API_KEY` - Your OpenAI API key
- `SECRET_KEY` - Any strong random string
- `FRONTEND_URL` - `https://host-track.vercel.app`
- `ENVIRONMENT` - `production`

### Vercel (Frontend)
- No additional environment variables needed for the chat functionality

## Troubleshooting

### CORS Issues
- Ensure `FRONTEND_URL` in Railway matches your Vercel domain exactly
- Check that CORS middleware is properly configured in `main.py`

### API Connection Issues
- Verify the Railway URL is correct in `homepage.html`
- Check Railway deployment logs for errors
- Ensure all environment variables are set

### OpenAI API Issues
- Verify your OpenAI API key is valid
- Check your OpenAI account has sufficient credits
- Monitor usage in OpenAI dashboard

## Production Checklist

- [ ] Railway deployment successful
- [ ] All environment variables set
- [ ] CORS configured for Vercel domain
- [ ] API URL updated in frontend
- [ ] Chat interface working on homepage
- [ ] Nathi responding with real market data
- [ ] Error handling working properly

## Cost Estimate

- **Railway**: Free tier (500 hours/month) → $5/month when exceeded
- **Vercel**: Free (unlimited static sites)
- **OpenAI**: Pay per use (~$0.01-0.10 per conversation)
- **Supabase**: Free tier (500MB database, 2GB bandwidth)

**Total: $0-10/month** depending on usage
