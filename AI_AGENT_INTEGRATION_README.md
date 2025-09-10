# 🤖 AI Agent Integration with HostTrack Database

## Overview
This guide shows how to integrate your separate AI agent with the HostTrack Supabase database to access market intelligence data.

## 📊 Available Data
Your database contains **492 Airbnb properties** across **8 Cape Town areas**:
- **Century City**: 202 properties (R309 - R5,798)
- **Sea Point**: 84 properties (R694 - R9,050) 
- **Green Point**: 4 properties
- **Woodstock**: 2 properties
- **V&A Waterfront**: 3 properties
- **Camps Bay**: 2 properties
- **Newlands**: 3 properties
- **Observatory**: 8 properties

## 🚀 Quick Setup

### 1. Copy Configuration Files
```bash
# Copy to your AI agent project
cp shared-database-config.js /path/to/your/ai-agent/
cp ai-agent-env-template.txt /path/to/your/ai-agent/.env
```

### 2. Install Dependencies
```bash
cd /path/to/your/ai-agent
npm install @supabase/supabase-js
```

### 3. Update Environment Variables
Edit your `.env` file:
```env
SUPABASE_URL=https://nasxtkxixjhfuhcptwyb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc3h0a3hpeGpoZnVoY3B0d3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDkzMDYsImV4cCI6MjA2OTk4NTMwNn0.SViB5UsHFE3GkAByGTvm-hsMPrww375uRrZ0VqYgbRE
OPENAI_API_KEY=your_openai_api_key_here
```

## 💻 Usage Examples

### Basic Setup
```javascript
const { MarketIntelligence } = require('./shared-database-config');

const marketIntel = new MarketIntelligence();
```

### Get Pricing Analysis
```javascript
// Get pricing for Sea Point apartments
const pricing = await marketIntel.getPricingAnalysis('Sea Point', 'apartment');
console.log(pricing);
// Output: { averagePrice: 1854, minPrice: 694, maxPrice: 9050, ... }
```

### Get Competitive Analysis
```javascript
// Full competitive analysis for Century City
const analysis = await marketIntel.getCompetitiveAnalysis('Century City', 'apartment');
console.log(analysis);
```

### Get Available Areas
```javascript
const areas = await marketIntel.getAvailableAreas();
console.log(areas);
// Output: ['Sea Point', 'Century City', 'Camps Bay', ...]
```

## 🧠 AI Integration Examples

### GPT-4 with Market Data
```javascript
const { MarketIntelligence } = require('./shared-database-config');
const OpenAI = require('openai');

const marketIntel = new MarketIntelligence();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getMarketInsights(area, propertyType, userQuery) {
    // Get market data
    const analysis = await marketIntel.getCompetitiveAnalysis(area, propertyType);
    
    // Create AI prompt with market context
    const prompt = `
    You are a property management AI assistant. 
    
    Market Data for ${area} ${propertyType}:
    - Average Price: R${analysis.pricing.averagePrice}
    - Price Range: ${analysis.pricing.priceRange}
    - Total Properties: ${analysis.pricing.totalProperties}
    
    User Query: ${userQuery}
    
    Provide insights based on this market data.
    `;
    
    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500
    });
    
    return response.choices[0].message.content;
}
```

### Pricing Recommendations
```javascript
async function getPricingRecommendation(area, propertyType, userProperty) {
    const analysis = await marketIntel.getCompetitiveAnalysis(area, propertyType);
    
    const recommendation = `
    Based on ${area} market analysis:
    
    Current Market:
    - Average: R${analysis.pricing.averagePrice}
    - Range: ${analysis.pricing.priceRange}
    - Your property: R${userProperty.price}
    
    Recommendation:
    ${userProperty.price > analysis.pricing.averagePrice ? 
        'Consider lowering price to R' + analysis.pricing.averagePrice + ' to be competitive' :
        'Your price is competitive! Consider premium pricing if you have unique features.'
    }
    `;
    
    return recommendation;
}
```

## 📈 Available Functions

### MarketIntelligence Class Methods:

1. **`getCompetitorsByArea(area, propertyType)`**
   - Get all competitor properties in an area
   - Optional property type filter

2. **`getPricingAnalysis(area, propertyType)`**
   - Get pricing statistics (avg, min, max, median)
   - Returns comprehensive pricing data

3. **`getMarketTrends(area)`**
   - Get market trend data for an area
   - Historical pricing and occupancy trends

4. **`getAreaStats(area)`**
   - Get area-specific statistics
   - Investment scores and market metrics

5. **`getCompetitiveAnalysis(area, propertyType)`**
   - Complete competitive analysis
   - Combines pricing, trends, and stats

6. **`getAvailableAreas()`**
   - Get list of all available areas
   - Returns array of area names

7. **`getPropertyTypes(area)`**
   - Get available property types for an area
   - Returns array of property types

## 🔒 Security Notes

- **Database is read-only** for AI agent (anon key)
- **No sensitive data** exposed
- **Rate limiting** handled by Supabase
- **Free tier** - no additional costs

## 🚀 Next Steps

1. **Integrate with your AI agent** using the examples above
2. **Add market data context** to your AI prompts
3. **Create pricing recommendations** based on real market data
4. **Build competitive analysis** features
5. **Implement market trend** predictions

## 📞 Support

The database contains live market data that updates as new properties are added. Your AI agent can now provide real-time market intelligence to property owners!

**Total Properties**: 492  
**Areas Covered**: 8  
**Data Freshness**: Real-time  
**Cost**: R0.00 (Free tier)
