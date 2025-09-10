import pyairbnb
import json
from datetime import datetime, timedelta

# Define search parameters
currency = "ZAR"  # South African Rand
# Get dates for a single night stay next week
today = datetime.now()
check_in = (today + timedelta(days=7)).strftime("%Y-%m-%d")
check_out = (today + timedelta(days=8)).strftime("%Y-%m-%d")  # Just one night

# Woodstock coordinates
ne_lat = -33.9200  # North-East latitude
ne_long = 18.4500  # North-East longitude
sw_lat = -33.9400  # South-West latitude
sw_long = 18.4300  # South-West longitude
zoom_value = 14  # Zoom level for detailed view

try:
    # Search listings
    print("Searching for listings in Woodstock...")
    print(f"Date range: {check_in} to {check_out} (1 night)")
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

    # Take only first 30 listings
    limited_results = search_results[:30]
    print(f"Limited to {len(limited_results)} listings")

    # Save raw data
    with open('airbnb_woodstock_limited.json', 'w', encoding='utf-8') as f:
        json.dump(limited_results, f, indent=2, ensure_ascii=False)
    print("Raw results saved to airbnb_woodstock_limited.json")

    # Print sample data
    if limited_results:
        print("\nSample listings:")
        for i, listing in enumerate(limited_results[:3], 1):
            print(f"\n{i}. {listing.get('name', 'No name')} - {listing.get('price', {}).get('unit', {}).get('amount', 'No price')} ZAR/night")
            if listing.get('rating'):
                print(f"   Rating: {listing['rating'].get('value', 'N/A')} ({listing['rating'].get('reviewCount', 0)} reviews)")
            print(f"   Coordinates: {listing.get('coordinates', {}).get('latitude', 'N/A')}, {listing.get('coordinates', {}).get('longitude', 'N/A')}")

except Exception as e:
    print(f"Error occurred: {str(e)}")
