import pyairbnb
import json
from datetime import datetime, timedelta

# Claremont coordinates
coords = {
    "ne_lat": -33.9750,
    "ne_long": 18.4750,
    "sw_lat": -33.9950,
    "sw_long": 18.4550
}

def scrape_airbnb_claremont():
    print("Starting Airbnb scrape for Claremont...")
    
    # Get dates for tomorrow (1-night stay)
    check_in = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    check_out = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    
    try:
        results = pyairbnb.search_all(
            check_in=check_in,
            check_out=check_out,
            ne_lat=coords["ne_lat"],
            ne_long=coords["ne_long"],
            sw_lat=coords["sw_lat"],
            sw_long=coords["sw_long"],
            zoom_value=14,
            price_min=0,
            price_max=100000,
            currency="ZAR"
        )
        
        print(f"Found {len(results)} listings")
        
        # Save results
        with open('airbnb_claremont_limited.json', 'w') as f:
            json.dump(results[:30], f, indent=2)
            
        print("Data saved to airbnb_claremont_limited.json")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    scrape_airbnb_claremont()
