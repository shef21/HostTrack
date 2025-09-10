# HostTrack.co.za Domain Setup

## Your Domain: hosttrack.co.za

### Step 1: GoDaddy DNS Records

**Login to GoDaddy:**
1. Go to godaddy.com → Sign in
2. My Products → All Products and Services
3. Find hosttrack.co.za → Click "DNS"

**Use Vercel's DNS settings:**
- Vercel will give you specific DNS records
- Copy them exactly as Vercel shows them
- Add them to your GoDaddy DNS
- Usually looks like:
  ```
  Type: A
  Name: @
  Value: [Vercel's IP address]
  
  Type: CNAME
  Name: www
  Value: [Vercel's CNAME]
  ```

### Step 2: Vercel Setup

1. Go to vercel.com → Your project
2. Settings → Domains
3. Add Domain: `hosttrack.co.za`
4. Add Domain: `www.hosttrack.co.za`

### Step 3: Railway Setup (for API)

1. Deploy your AI service to Railway
2. Go to Railway → Your AI service → Settings → Domains
3. Add Custom Domain: `api.hosttrack.co.za`
4. Copy the CNAME value Railway gives you
5. Add this CNAME record in GoDaddy:

**Record 3:**
```
Type: CNAME
Name: api
Value: [Railway will give you this]
TTL: 600
```

### Step 4: Environment Variables

**In Railway:**
```
FRONTEND_URL=https://hosttrack.co.za
```

**In Vercel:**
```
REACT_APP_API_URL=https://api.hosttrack.co.za
```

### Step 5: Test

1. Visit: https://hosttrack.co.za
2. Test API: https://api.hosttrack.co.za/health
3. Ask Nathi a question!

### That's it! 

Your site will be:
- Main site: https://hosttrack.co.za
- API: https://api.hosttrack.co.za
