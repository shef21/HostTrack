# 🚀 HostTrack Deployment Guide - Vercel + Railway

## **Overview**
This guide will help you deploy HostTrack to production using:
- **Frontend**: Vercel (free tier)
- **Backend**: Railway ($5/month after free tier)

## **📋 Prerequisites**
1. **GitHub account** with your HostTrack repository
2. **Vercel account** (free)
3. **Railway account** (free tier available)
4. **Supabase project** (already configured)

## **🔧 Step 1: Prepare Your Repository**

### **1.1 Update API Configuration**
The frontend has been updated to automatically detect production vs development environments.

### **1.2 Commit and Push Changes**
```bash
git add .
git commit -m "Prepare for Vercel + Railway deployment"
git push origin main
```

## **🌐 Step 2: Deploy Backend to Railway**

### **2.1 Create Railway Account**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project

### **2.2 Deploy Backend**
1. **Connect Repository**: Select your HostTrack repository
2. **Set Root Directory**: `backend`
3. **Environment Variables**:
   ```
   NODE_ENV=production
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. **Deploy**: Railway will automatically build and deploy

### **2.3 Get Railway URL**
After deployment, copy your Railway app URL (e.g., `https://hosttrack-backend-production.up.railway.app`)

## **🎨 Step 3: Deploy Frontend to Vercel**

### **3.1 Create Vercel Account**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your HostTrack repository

### **3.2 Configure Vercel**
1. **Framework Preset**: Other
2. **Root Directory**: `web`
3. **Build Command**: Leave empty (static files)
4. **Output Directory**: Leave empty

### **3.3 Set Environment Variables**
1. **REACT_APP_API_URL**: Your Railway backend URL
2. **Deploy**

## **🔗 Step 4: Update Frontend API URL**

### **4.1 Update Vercel Environment Variable**
1. Go to your Vercel project settings
2. Add environment variable: `REACT_APP_API_URL`
3. Set value to your Railway backend URL
4. Redeploy

## **✅ Step 5: Test Deployment**

### **5.1 Test Backend**
```bash
curl https://your-railway-url.railway.app/health
```

### **5.2 Test Frontend**
1. Visit your Vercel URL
2. Test login functionality
3. Test AI chat (should now work with production backend)

## **🔧 Step 6: Custom Domain (Optional)**

### **6.1 Add Domain to Vercel**
1. Go to Vercel project settings
2. Add your custom domain
3. Configure DNS records

### **6.2 Add Domain to Railway**
1. Go to Railway project settings
2. Add custom domain
3. Configure DNS records

## **📊 Monitoring & Maintenance**

### **6.1 Railway Dashboard**
- Monitor backend performance
- View logs
- Scale resources if needed

### **6.2 Vercel Dashboard**
- Monitor frontend performance
- View analytics
- Manage deployments

## **💰 Cost Breakdown**
- **Vercel**: Free tier (unlimited)
- **Railway**: $5/month after free tier
- **Total**: $5/month

## **🚨 Troubleshooting**

### **Common Issues**
1. **CORS Errors**: Ensure Railway backend allows your Vercel domain
2. **Environment Variables**: Double-check all variables are set
3. **Build Failures**: Check Railway logs for Node.js version issues

### **Support**
- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)

## **🎯 Success Criteria**
✅ Backend responds to health check  
✅ Frontend loads without errors  
✅ Login functionality works  
✅ AI chat works with production backend  
✅ All API endpoints respond correctly  

---

**Need help?** Check the logs in both Railway and Vercel dashboards for detailed error information.
