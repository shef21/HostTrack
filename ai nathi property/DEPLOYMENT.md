# AI Nathi Property - Deployment Guide

## Free Tier Deployment Strategy

This guide shows how to deploy the entire application for **$0-5/month** using free tiers.

## Architecture Overview

```
Frontend (Vercel) → Backend (Railway) → Database (Supabase)
```

## Step 1: Deploy Backend to Railway

### Prerequisites
- GitHub repository with your code
- Railway account (free tier: 500 hours/month)

### Deployment Steps

1. **Connect to Railway**:
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"

2. **Configure Environment Variables**:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   SECRET_KEY=your_secret_key
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ENVIRONMENT=production
   ```

3. **Deploy**:
   - Railway will automatically detect Python and install dependencies
   - Your backend will be available at `https://your-app.railway.app`

## Step 2: Deploy Frontend to Vercel

### Prerequisites
- GitHub repository with your code
- Vercel account (free tier: unlimited static sites)

### Deployment Steps

1. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project" → Import your repository

2. **Configure Build Settings**:
   - Framework Preset: `Create React App`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

3. **Set Environment Variables**:
   ```env
   REACT_APP_API_URL=https://your-railway-app.railway.app
   ```

4. **Deploy**:
   - Vercel will automatically build and deploy
   - Your frontend will be available at `https://your-app.vercel.app`

## Step 3: Configure Supabase

### Database Setup
1. Run the SQL schema in your Supabase SQL editor
2. Enable Row Level Security (RLS)
3. Configure CORS for your domains

### CORS Configuration
In Supabase dashboard → Settings → API:
```
Allowed Origins: https://your-vercel-app.vercel.app
```

## Step 4: Update Environment Variables

### Backend (Railway)
Update your Railway environment variables with the Vercel URL:
```env
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Frontend (Vercel)
Update your Vercel environment variables with the Railway URL:
```env
REACT_APP_API_URL=https://your-railway-app.railway.app
```

## Step 5: Test Production Deployment

1. **Test Chat Functionality**:
   - Send a message in the chat
   - Verify responses are generated

2. **Test Memory Management**:
   - Create, edit, and delete memories
   - Verify data persistence

3. **Test Data Ingestion**:
   - Upload a CSV/JSON file
   - Verify data processing

## Cost Breakdown

### Free Tier Limits
- **Railway**: 500 hours/month (enough for small apps)
- **Vercel**: Unlimited static sites
- **Supabase**: 500MB database, 2GB bandwidth
- **OpenAI**: $5 free credit initially

### Monthly Costs
- **Railway**: $0 (free tier) → $5/month when you exceed limits
- **Vercel**: $0 (always free for static sites)
- **Supabase**: $0 (free tier) → $25/month when you exceed limits
- **OpenAI**: $0-50/month (depends on usage)

**Total: $0-80/month** (scales with usage)

## Scaling Strategy

### When to Upgrade

1. **Railway Free Tier Exceeded**:
   - Upgrade to Railway Pro ($5/month)
   - Or migrate to Render ($7/month)

2. **Supabase Free Tier Exceeded**:
   - Upgrade to Supabase Pro ($25/month)
   - Or migrate to self-hosted PostgreSQL

3. **High OpenAI Usage**:
   - Implement caching to reduce API calls
   - Use cheaper models for non-critical tasks
   - Consider local models (Ollama) for development

### Performance Optimization

1. **Database Optimization**:
   - Add proper indexes
   - Implement connection pooling
   - Use read replicas for heavy queries

2. **API Optimization**:
   - Implement response caching
   - Use async processing for heavy tasks
   - Add rate limiting

3. **Frontend Optimization**:
   - Implement code splitting
   - Use CDN for static assets
   - Add service worker for offline support

## Monitoring and Maintenance

### Health Checks
- Set up uptime monitoring (UptimeRobot - free)
- Monitor API response times
- Track error rates

### Logging
- Use Railway's built-in logging
- Set up error tracking (Sentry - free tier)
- Monitor OpenAI API usage

### Backup Strategy
- Supabase handles database backups automatically
- Keep code in version control (GitHub)
- Document all environment variables

## Security Considerations

### Production Security
1. **Environment Variables**: Never commit secrets to git
2. **CORS**: Restrict to your domains only
3. **Rate Limiting**: Implement API rate limits
4. **Input Validation**: Validate all user inputs
5. **HTTPS**: All traffic should be encrypted

### Data Protection
1. **User Data**: Implement proper user authentication
2. **API Keys**: Rotate keys regularly
3. **Database**: Use connection strings with limited permissions
4. **Logs**: Don't log sensitive information

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Check FRONTEND_URL in backend environment
   - Verify CORS settings in Supabase

2. **Database Connection Issues**:
   - Verify Supabase credentials
   - Check network connectivity

3. **OpenAI API Errors**:
   - Verify API key is correct
   - Check credit balance
   - Monitor rate limits

4. **Build Failures**:
   - Check environment variables
   - Verify dependencies
   - Review build logs

### Support Resources
- Railway: [docs.railway.app](https://docs.railway.app)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Supabase: [supabase.com/docs](https://supabase.com/docs)
- OpenAI: [platform.openai.com/docs](https://platform.openai.com/docs)
