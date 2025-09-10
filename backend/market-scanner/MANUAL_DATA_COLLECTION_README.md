# Manual Data Collection Guide - Sea Point Rentals

## Overview
This manual data collection system helps you systematically gather rental property data from various sources (Private Property, Seeff, RE/MAX, etc.) for your Cape Town market intelligence platform.

## How to Use

### 1. Running the Data Collection Tool
```bash
cd backend/market-scanner
python3 manual_data_collection_template.py
```

### 2. Data Collection Process

#### Step 1: Access Property Sources
Visit these websites and search for Sea Point rentals:
- **Private Property**: https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/437
- **Seeff**: https://atlanticseaboard.seeff.com/results/residential/to-let/cape-town/sea-point/
- **RE/MAX**: Search for Sea Point rentals
- **Just Property**: Cape Town Sea Point listings

#### Step 2: Select Properties
Choose 20-25 properties to collect data from. Focus on:
- Different price ranges (R10k - R100k+)
- Various property types (apartments, houses, townhouses)
- Different bedroom counts (1-4+ bedrooms)
- Mix of furnished/unfurnished

#### Step 3: Data Collection Fields

**Required Fields:**
- Property URL
- Property title
- Monthly price
- Number of bedrooms
- Number of bathrooms
- Location (Sea Point)
- Property type

**Recommended Fields:**
- Full address
- Size in m²
- Parking spaces
- Furnished status
- Deposit amount
- Agent/landlord info
- Availability date
- Pet policy
- Lease terms

**Optional Fields:**
- Amenities (pool, gym, security, etc.)
- Building security
- Maintenance costs
- Utilities included
- Additional notes

### 3. Data Entry Process

1. **Choose Option 1** - Add new property entry
2. **Fill in all fields** you can find on the property page
3. **Use "N/A" or leave blank** if information isn't available
4. **Be consistent** with naming conventions

### 4. Data Management

#### Viewing Your Data
- Choose **Option 2** to see a summary of collected data
- Shows total properties, average prices, and breakdowns

#### Exporting Data
- Choose **Option 3** to export to CSV format
- Creates `sea_point_rentals.csv` for easy analysis

### 5. Data Quality Guidelines

#### Price Information
- Always record monthly rental price
- Convert weekly/monthly prices consistently
- Note if utilities/maintenance are included

#### Property Details
- Count bedrooms accurately (exclude living areas)
- Include all bathrooms (ensuite, guest, etc.)
- Measure/record size in square meters
- Note parking (garage, covered, open)

#### Location Information
- Use consistent location naming
- Record full addresses when available
- Note proximity to beaches/amenities

### 6. Example Data Entry

**Property URL:** https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR4459514

**Title:** 2 Bedroom Apartment in Sea Point

**Price:** 32000

**Bedrooms:** 2

**Bathrooms:** 2

**Parking:** 1

**Size:** 85

**Location:** Sea Point

**Address:** 6 Regent Rd

**Property Type:** Apartment

**Furnished:** Unfurnished

**Description:** Modern 2 bedroom apartment with stunning sea views...

### 7. Integration with Existing System

The collected data can be:
1. **Imported into Supabase** for real-time access
2. **Combined with automated data** from Airbnb/Booking.com
3. **Used for market analysis** and pricing comparisons
4. **Exported for reporting** and visualization

### 8. Best Practices

#### Efficiency Tips
- **Work in batches** of 5-10 properties
- **Save frequently** to avoid data loss
- **Use keyboard shortcuts** for faster navigation
- **Copy-paste** when possible

#### Quality Assurance
- **Double-check prices** - they vary significantly
- **Verify bedroom counts** - include accurate counts
- **Note availability dates** - important for analysis
- **Document unique features** - differentiates properties

#### Data Consistency
- **Standardize location names** (use "Sea Point" consistently)
- **Use consistent date formats**
- **Standardize property types** (Apartment, House, Townhouse)
- **Be consistent with amenities** (Pool, Swimming Pool, etc.)

### 9. Troubleshooting

**Common Issues:**
- **Price not showing**: Check if it's "POA" (Price on Application)
- **Bedroom count unclear**: Look for "2 bedroom" in title/description
- **Size not listed**: Can often be estimated or left blank
- **Contact info missing**: Note "Agent not specified"

**Data Validation:**
- Prices should be realistic for Sea Point (R15k-R100k+)
- Bedroom counts should match property size
- Addresses should be in Sea Point area

### 10. Next Steps After Collection

1. **Import to Database**: Move data to Supabase tables
2. **Data Cleaning**: Standardize and validate all entries
3. **Analysis**: Compare with automated short-term rental data
4. **Reporting**: Create market intelligence reports

This manual collection will provide valuable long-term rental data that complements your automated short-term rental data, giving users a complete picture of the Sea Point rental market.
