import pyairbnb
import json
from datetime import datetime, timedelta
import subprocess
import os

def run_node_script(data):
    # Save data to a temporary file
    with open('temp_data.json', 'w') as f:
        json.dump(data, f)
    
    # Create a simple Node.js script to use the normalizer
    node_script = """
    const AirbnbNormalizer = require('./lib/AirbnbNormalizer');
    const fs = require('fs');

    // Read the data
    const data = JSON.parse(fs.readFileSync('temp_data.json', 'utf8'));
    const normalizer = new AirbnbNormalizer();

    // Normalize the data
    const normalized = data.map(listing => {
        const normalizedListing = normalizer.normalize(listing);
        console.log('Normalized listing:', JSON.stringify(normalizedListing, null, 2));
        if (normalizer.validateData(normalizedListing)) {
            return normalizedListing;
        }
        return null;
    }).filter(listing => listing !== null);

    // Write the results
    fs.writeFileSync('normalized_data.json', JSON.stringify(normalized, null, 2));
    """

    # Save the Node.js script
    with open('normalize.js', 'w') as f:
        f.write(node_script)

    # Run the Node.js script
    subprocess.run(['node', 'normalize.js'])

    # Read the results
    with open('normalized_data.json', 'r') as f:
        normalized_data = json.load(f)

    # Clean up temporary files
    os.remove('temp_data.json')
    os.remove('normalize.js')
    os.remove('normalized_data.json')

    return normalized_data

# Define search parameters
currency = "ZAR"  # South African Rand
# Get dates for next week
today = datetime.now()
check_in = (today + timedelta(days=7)).strftime("%Y-%m-%d")
check_out = (today + timedelta(days=14)).strftime("%Y-%m-%d")

# Sea Point coordinates
ne_lat = -33.9100  # North-East latitude
ne_long = 18.3900  # North-East longitude
sw_lat = -33.9300  # South-West latitude
sw_long = 18.3700  # South-West longitude
zoom_value = 14  # Zoom level for detailed view

try:
    # Search listings
    print("Searching for listings in Sea Point...")
    search_results = pyairbnb.search_all(
        check_in=check_in,
        check_out=check_out,
        ne_lat=ne_lat,
        ne_long=ne_long,
        sw_lat=sw_lat,
        sw_long=sw_long,
        zoom_value=zoom_value,
        price_min=0,
        price_max=100000,
        place_type="Entire home/apt",
        amenities=[],
        free_cancellation=False,
        currency=currency,
        language="en",
        proxy_url=""
    )

    print(f"Found {len(search_results)} listings")

    # Save raw data
    with open('airbnb_sea_point_raw.json', 'w', encoding='utf-8') as f:
        json.dump(search_results, f, indent=2, ensure_ascii=False)
    print("Raw results saved to airbnb_sea_point_raw.json")

    # Print sample raw data
    if search_results:
        print("\nSample raw listing:")
        print(json.dumps(search_results[0], indent=2))

    # Normalize the data
    print("\nNormalizing data...")
    normalized_data = run_node_script(search_results)
    print(f"Successfully normalized {len(normalized_data)} listings")

    # Save normalized data
    with open('airbnb_sea_point_normalized.json', 'w', encoding='utf-8') as f:
        json.dump(normalized_data, f, indent=2, ensure_ascii=False)
    print("Normalized results saved to airbnb_sea_point_normalized.json")

    # Print sample of normalized data
    if normalized_data:
        print("\nSample normalized listing:")
        print(json.dumps(normalized_data[0], indent=2))

except Exception as e:
    print(f"Error occurred: {str(e)}")