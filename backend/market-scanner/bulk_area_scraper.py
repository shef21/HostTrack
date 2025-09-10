import asyncio
import json
from datetime import datetime, timedelta
import pyairbnb
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import os

# Area definitions with coordinates and search terms
AREAS = {
    "Sea Point": {
        "coordinates": {
            "ne_lat": -33.9100,
            "ne_long": 18.3900,
            "sw_lat": -33.9300,
            "sw_long": 18.3700
        },
        "search_term": "Sea+Point%2C+Cape+Town"
    },
    "Green Point": {
        "coordinates": {
            "ne_lat": -33.9000,
            "ne_long": 18.4100,
            "sw_lat": -33.9200,
            "sw_long": 18.3900
        },
        "search_term": "Green+Point%2C+Cape+Town"
    },
    "Camps Bay": {
        "coordinates": {
            "ne_lat": -33.9400,
            "ne_long": 18.3900,
            "sw_lat": -33.9600,
            "sw_long": 18.3700
        },
        "search_term": "Camps+Bay%2C+Cape+Town"
    },
    "V&A Waterfront": {
        "coordinates": {
            "ne_lat": -33.9000,
            "ne_long": 18.4300,
            "sw_lat": -33.9200,
            "sw_long": 18.4100
        },
        "search_term": "V%26A+Waterfront%2C+Cape+Town"
    },
    "Century City": {
        "coordinates": {
            "ne_lat": -33.8800,
            "ne_long": 18.5100,
            "sw_lat": -33.9000,
            "sw_long": 18.4900
        },
        "search_term": "Century+City%2C+Cape+Town"
    },
    "Observatory": {
        "coordinates": {
            "ne_lat": -33.9350,
            "ne_long": 18.4750,
            "sw_lat": -33.9450,
            "sw_long": 18.4650
        },
        "search_term": "Observatory%2C+Cape+Town"
    },
    "Woodstock": {
        "coordinates": {
            "ne_lat": -33.9200,
            "ne_long": 18.4500,
            "sw_lat": -33.9400,
            "sw_long": 18.4300
        },
        "search_term": "Woodstock%2C+Cape+Town"
    },
    "Newlands": {
        "coordinates": {
            "ne_lat": -33.9750,
            "ne_long": 18.4600,
            "sw_lat": -33.9850,
            "sw_long": 18.4500
        },
        "search_term": "Newlands%2C+Cape+Town"
    }
}

class BulkAreaScraper:
    def __init__(self):
        self.results_dir = "scrape_results"
        os.makedirs(self.results_dir, exist_ok=True)
        self.max_workers = 4  # Adjust based on your system's capabilities
        self.scan_date = datetime.now().strftime("%Y%m%d_%H%M%S")

    async def scrape_airbnb_area(self, area_name, coords):
        """Scrape Airbnb listings for a specific area"""
        try:
            # Get dates for a single night stay next week
            check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
            check_out = (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d")

            print(f"🔍 Searching Airbnb in {area_name}...")
            search_results = pyairbnb.search_all(
                check_in=check_in,
                check_out=check_out,
                ne_lat=coords["ne_lat"],
                ne_long=coords["ne_long"],
                sw_lat=coords["sw_lat"],
                sw_long=coords["sw_long"],
                zoom_value=14,
                price_min=0,
                price_max=100000,
                place_type="Entire home/apt",
                amenities=[],
                free_cancellation=False,
                currency="ZAR",
                language="en",
                proxy_url=""
            )

            # Take only first 30 listings
            limited_results = search_results[:30] if search_results else []
            
            # Save results
            filename = f"{self.results_dir}/airbnb_{area_name.lower().replace(' ', '_')}_{self.scan_date}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(limited_results, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Airbnb {area_name}: Found {len(limited_results)} listings")
            return area_name, "airbnb", len(limited_results)

        except Exception as e:
            print(f"❌ Error scraping Airbnb {area_name}: {str(e)}")
            return area_name, "airbnb", 0

    async def scrape_booking_area(self, area_name, search_term):
        """Scrape Booking.com listings for a specific area"""
        try:
            # Setup Chrome options
            chrome_options = Options()
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--headless')  # Run in headless mode for parallel processing
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            
            driver = webdriver.Chrome(options=chrome_options)
            
            # Get dates
            check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
            check_out = (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d")
            
            # Construct search URL
            url = (
                f"https://www.booking.com/searchresults.html"
                f"?ss={search_term}"
                f"&checkin={check_in}"
                f"&checkout={check_out}"
                "&group_adults=2"
                "&no_rooms=1"
                "&group_children=0"
            )
            
            print(f"🔍 Searching Booking.com in {area_name}...")
            driver.get(url)
            time.sleep(5)  # Wait for page load
            
            # Extract property data
            properties = []
            try:
                from test_booking_direct import extract_property_data
                property_cards = driver.find_elements_by_css_selector('[data-testid="property-card"]')
                for card in property_cards[:30]:  # Limit to 30 properties
                    property_data = extract_property_data(card, driver)
                    if property_data:
                        properties.append(property_data)
                    time.sleep(1)  # Small delay between properties
            except Exception as e:
                print(f"Error extracting properties for {area_name}: {e}")
            
            # Save results
            filename = f"{self.results_dir}/booking_{area_name.lower().replace(' ', '_')}_{self.scan_date}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(properties, f, indent=2, ensure_ascii=False)
            
            driver.quit()
            print(f"✅ Booking.com {area_name}: Found {len(properties)} listings")
            return area_name, "booking", len(properties)

        except Exception as e:
            print(f"❌ Error scraping Booking.com {area_name}: {str(e)}")
            try:
                driver.quit()
            except:
                pass
            return area_name, "booking", 0

    async def bulk_scrape(self):
        """Scrape all areas in parallel"""
        print(f"\n🚀 Starting bulk scrape at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📍 Areas to scrape: {', '.join(AREAS.keys())}")
        print("=" * 50 + "\n")

        # Create tasks for all areas
        tasks = []
        for area_name, data in AREAS.items():
            # Airbnb task
            tasks.append(self.scrape_airbnb_area(area_name, data["coordinates"]))
            # Booking.com task
            tasks.append(self.scrape_booking_area(area_name, data["search_term"]))

        # Run tasks in parallel with limits
        results = []
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Convert coroutines to futures
            futures = [
                executor.submit(asyncio.run, task)
                for task in tasks
            ]
            
            # Collect results as they complete
            for future in as_completed(futures):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    print(f"Task failed: {e}")

        # Print summary
        print("\n" + "=" * 50)
        print("📊 SCRAPING SUMMARY")
        print("=" * 50)
        
        total_listings = 0
        for area_name in AREAS.keys():
            print(f"\n{area_name}:")
            airbnb_count = next((r[2] for r in results if r[0] == area_name and r[1] == "airbnb"), 0)
            booking_count = next((r[2] for r in results if r[0] == area_name and r[1] == "booking"), 0)
            area_total = airbnb_count + booking_count
            total_listings += area_total
            print(f"  Airbnb: {airbnb_count} listings")
            print(f"  Booking.com: {booking_count} listings")
            print(f"  Total: {area_total} listings")

        print("\n" + "=" * 50)
        print(f"📈 TOTAL LISTINGS: {total_listings}")
        print(f"⏱️ COMPLETED AT: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 50 + "\n")

        return results

if __name__ == "__main__":
    scraper = BulkAreaScraper()
    asyncio.run(scraper.bulk_scrape())
