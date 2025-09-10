import pyairbnb
import json
from datetime import datetime, timedelta

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

# Search parameters
price_min = 0
price_max = 100000  # High max price to get all listings
place_type = "Entire home/apt"  # Focus on entire properties
amenities = []  # No specific amenity filters
free_cancellation = False
language = "en"
proxy_url = ""

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
        price_min=price_min,
        price_max=price_max,
        place_type=place_type,
        amenities=amenities,
        free_cancellation=free_cancellation,
        currency=currency,
        language=language,
        proxy_url=proxy_url
    )

    print(f"Found {len(search_results)} listings")

    # Save the search results
    with open('airbnb_sea_point_results.json', 'w', encoding='utf-8') as f:
        json.dump(search_results, f, indent=2, ensure_ascii=False)
    print("Results saved to airbnb_sea_point_results.json")

    # Get details for first listing if any results found
    if search_results:
        first_listing = search_results[0]
        listing_id = first_listing.get('id')
        if listing_id:
            print(f"\nGetting details for listing {listing_id}...")
            details = pyairbnb.get_details(
                room_id=listing_id,
                currency=currency,
                language=language,
                proxy_url=proxy_url
            )
            
            # Save the details
            with open('airbnb_listing_details.json', 'w', encoding='utf-8') as f:
                json.dump(details, f, indent=2, ensure_ascii=False)
            print("Listing details saved to airbnb_listing_details.json")

except Exception as e:
    print(f"Error occurred: {str(e)}")
