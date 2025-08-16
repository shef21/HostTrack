# 📁 CSV Import Templates for Testing

This directory contains various CSV templates for testing the HostTrack CSV import functionality.

## 🎯 **Available Templates**

### **1. `properties-basic.csv` - Standard Properties**
- **Use Case**: Basic property import with essential fields
- **Fields**: 9 columns (name, location, type, price, bedrooms, bathrooms, max_guests, amenities, description)
- **Properties**: 10 diverse properties across South Africa
- **Best For**: Testing basic import functionality

### **2. `properties-with-platforms.csv` - Cross-Platform Properties**
- **Use Case**: Properties with platform integration
- **Fields**: 12 columns (includes airbnb_id, booking_id, platforms)
- **Properties**: 10 luxury properties with platform IDs
- **Best For**: Testing platform integration and duplicate handling

### **3. `properties-minimal.csv` - Minimal Required Fields**
- **Use Case**: Testing with only required fields
- **Fields**: 7 columns (essential fields only)
- **Properties**: 10 simple properties
- **Best For**: Testing minimum field requirements

### **4. `properties-extended.csv` - Extended Properties**
- **Use Case**: Comprehensive property data with all fields
- **Fields**: 16 columns (includes status, is_featured, occupancy_rate, image_url)
- **Properties**: 10 premium properties with full details
- **Best For**: Testing advanced features and data validation

### **5. `properties-test-cases.csv` - Test Scenarios**
- **Use Case**: Various test scenarios and edge cases
- **Fields**: 15 columns (includes status variations)
- **Properties**: 10 test properties with different statuses
- **Best For**: Testing edge cases and data validation

## 🧪 **Testing Scenarios**

### **Basic Import Testing**
1. Use `properties-basic.csv` for initial testing
2. Verify all 10 properties import correctly
3. Check that amenities are properly parsed
4. Confirm location and pricing data accuracy

### **Platform Integration Testing**
1. Use `properties-with-platforms.csv`
2. Verify platform IDs are captured
3. Test duplicate prevention with same platform IDs
4. Check platforms field parsing

### **Field Validation Testing**
1. Use `properties-minimal.csv` to test required fields
2. Use `properties-extended.csv` to test optional fields
3. Verify data type validation (numbers, text, etc.)
4. Test status field handling

### **Edge Case Testing**
1. Use `properties-test-cases.csv`
2. Test inactive status properties
3. Verify featured property handling
4. Check occupancy rate parsing

## 📋 **Field Descriptions**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `property_name` | Text | ✅ | Name of the property |
| `location` | Text | ✅ | Full location address |
| `type` | Text | ✅ | Property type (house, apartment, etc.) |
| `price` | Number | ✅ | Base price per night in ZAR |
| `bedrooms` | Number | ✅ | Number of bedrooms |
| `bathrooms` | Number | ✅ | Number of bathrooms |
| `max_guests` | Number | ✅ | Maximum number of guests |
| `amenities` | Text | ❌ | Comma-separated list of amenities |
| `description` | Text | ❌ | Property description |
| `airbnb_id` | Text | ❌ | Airbnb listing ID |
| `booking_id` | Text | ❌ | Booking.com listing ID |
| `platforms` | Text | ❌ | Comma-separated list of platforms |
| `status` | Text | ❌ | Property status (active/inactive) |
| `is_featured` | Boolean | ❌ | Whether property is featured |
| `occupancy_rate` | Number | ❌ | Current occupancy percentage |
| `image_url` | URL | ❌ | Property image URL |

## 🚀 **How to Test**

### **Step 1: Open CSV Import Modal**
1. Navigate to Properties tab
2. Look for CSV Import button
3. Click to open import modal

### **Step 2: Upload CSV File**
1. Drag and drop CSV file onto import zone
2. Or click to browse and select file
3. Verify file is loaded correctly

### **Step 3: Configure Import Options**
1. Check "First row contains column headers" if applicable
2. Check "Skip duplicate properties" if desired
3. Review column mapping

### **Step 4: Start Import**
1. Click "🚀 Start Import" button
2. Monitor progress bar
3. Review import results

### **Step 5: Verify Results**
1. Check Properties tab for imported properties
2. Verify data accuracy
3. Test property editing and management

## ⚠️ **Common Issues to Watch For**

### **Data Parsing Issues**
- **Commas in text fields**: Ensure text fields with commas are properly quoted
- **Number validation**: Verify price, bedrooms, bathrooms are valid numbers
- **Date formats**: Ensure dates are in YYYY-MM-DD format if used

### **Import Errors**
- **Missing required fields**: Check that all required fields are present
- **Invalid data types**: Verify data matches expected field types
- **Duplicate handling**: Test with duplicate property names

### **Platform Integration**
- **Platform ID parsing**: Verify airbnb_id and booking_id are captured
- **Platforms field**: Check comma-separated platform lists
- **Duplicate prevention**: Test with same platform IDs

## 📊 **Expected Results**

### **Successful Import**
- Progress bar completes
- Import summary shows correct property count
- Properties appear in Properties tab
- All data fields are properly populated

### **Partial Import**
- Some properties import successfully
- Error log shows failed imports
- Partial data available for review

### **Failed Import**
- Clear error messages displayed
- No properties imported
- Option to retry with corrected data

## 🔧 **Troubleshooting**

### **If Import Fails**
1. Check CSV file format and encoding
2. Verify all required fields are present
3. Check for special characters in text fields
4. Ensure proper CSV formatting (commas, quotes)

### **If Data is Incorrect**
1. Review column mapping
2. Check field data types
3. Verify CSV structure matches template
4. Test with minimal CSV first

### **If Properties Don't Appear**
1. Check import results summary
2. Verify import completed successfully
3. Refresh Properties tab
4. Check browser console for errors

## 📞 **Support**

If you encounter issues with CSV import:
1. Check the browser console for error messages
2. Verify CSV file format matches templates
3. Test with minimal data first
4. Review import results and error logs

---

**Happy Testing! 🎉**
