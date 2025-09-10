# GoDaddy Domain Setup Guide

## Quick Setup Steps

### 1. GoDaddy DNS Configuration

**Login to GoDaddy:**
1. Go to [godaddy.com](https://godaddy.com) and sign in
2. Go to **My Products** → **All Products and Services**
3. Find your domain → Click **DNS** or **Manage DNS**

### 2. Add Required DNS Records

**For your main domain (yourdomain.com):**

**A Record:**
```
Type: A
Name: @
Value: 76.76.19.61
TTL: 600 (or 1 Hour)
```

**CNAME Record:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600 (or 1 Hour)
```

**For your API subdomain (api.yourdomain.com):**

**CNAME Record:**
```
Type: CNAME
Name: api
Value: [Railway will provide this after you add the domain]
TTL: 600 (or 1 Hour)
```

### 3. Vercel Setup

1. **Go to Vercel Dashboard** → Your project
2. **Settings** → **Domains**
3. **Add Domain** → Enter: `yourdomain.com`
4. **Add Domain** → Enter: `www.yourdomain.com`
5. **Wait for verification** (usually 5-10 minutes)

### 4. Railway Setup

1. **Deploy AI service to Railway** (if not done)
2. **Go to Railway Dashboard** → Your AI service
3. **Settings** → **Domains**
4. **Add Custom Domain** → Enter: `api.yourdomain.com`
5. **Copy the CNAME value** Railway provides
6. **Add this CNAME record** to GoDaddy DNS

### 5. Update Configuration

**Replace `yourdomain.com` with your actual domain in:**
- `web/homepage.html` (line 1133)
- `ai nathi property/backend/app/core/config.py` (line 19)

### 6. Environment Variables

**In Railway:**
```
FRONTEND_URL=https://yourdomain.com
```

**In Vercel:**
```
REACT_APP_API_URL=https://api.yourdomain.com
```

### 7. Testing

1. **Test main site:** `https://yourdomain.com`
2. **Test API:** `https://api.yourdomain.com/health`
3. **Test chat:** Ask Nathi a question

### 8. DNS Propagation

- **Can take up to 48 hours** for full propagation
- **Usually works within 1-2 hours**
- Use `dig yourdomain.com` to check DNS status

### 9. Common GoDaddy Issues

**If domain doesn't work:**
1. Check DNS records are exactly as shown above
2. Ensure TTL is set to 600 or 1 Hour
3. Wait for propagation (up to 48 hours)
4. Clear your browser cache

**If CNAME doesn't work:**
1. Make sure you're using the exact CNAME value from Railway
2. Check that the subdomain (api) is correct
3. Wait for DNS propagation

### 10. SSL Certificates

- ✅ **Vercel:** Automatic HTTPS
- ✅ **Railway:** Automatic HTTPS
- ✅ **No manual setup needed**

## What's your domain name?

Once you provide your domain, I can:
1. Update all configuration files with your specific domain
2. Give you exact DNS records to add
3. Help you test the setup

**Example:** If your domain is `myhosttrack.com`, the setup would be:
- Main site: `https://myhosttrack.com`
- API: `https://api.myhosttrack.com`
