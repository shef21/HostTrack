import asyncio
import json
from datetime import datetime, timedelta
import pyairbnb
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
import os
from cape_town_areas import CAPE_TOWN_AREAS

class NewAreasScraper:
    def __init__(self):
        self.results_dir = "scrape_results"
        os.makedirs(self.results_dir, exist_ok=True)
        self.max_workers = 2  # Reduced from 4 to avoid rate limiting
        self.scan_date = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Filter for only pending areas
        self.pending_areas = {
            name: data for name, data in CAPE_TOWN_AREAS.items()
            if data["status"] == "pending"
        }

    def random_delay(self, min_seconds=2, max_seconds=5):
        """Add random delay between requests"""
        delay = random.uniform(min_seconds, max_seconds)
        time.sleep(delay)

    async def scrape_airbnb_area(self, area_name, coords):
        """Scrape Airbnb listings for a specific area"""
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                # Get dates for a single night stay next week
                check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
                check_out = (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d")

                print(f"🔍 Searching Airbnb in {area_name} (Attempt {retry_count + 1}/{max_retries})...")
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
                
                # Add random delay before next request
                self.random_delay(5, 10)
                
                return area_name, "airbnb", len(limited_results)

            except Exception as e:
                retry_count += 1
                print(f"❌ Error scraping Airbnb {area_name} (Attempt {retry_count}/{max_retries}): {str(e)}")
                if retry_count < max_retries:
                    delay = retry_count * 10  # Increase delay with each retry
                    print(f"Waiting {delay} seconds before retry...")
                    time.sleep(delay)
                else:
                    print(f"Failed to scrape Airbnb {area_name} after {max_retries} attempts")
                    return area_name, "airbnb", 0

    async def scrape_booking_area(self, area_name, search_term):
        """Scrape Booking.com listings for a specific area"""
        max_retries = 3
        retry_count = 0
        driver = None
        
        while retry_count < max_retries:
            try:
                # Setup Chrome options
                chrome_options = Options()
                chrome_options.add_argument('--no-sandbox')
                chrome_options.add_argument('--headless')
                chrome_options.add_argument('--disable-dev-shm-usage')
                chrome_options.add_argument('--disable-blink-features=AutomationControlled')
                chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36')
                
                driver = webdriver.Chrome(options=chrome_options)
                driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                    'source': '''
                        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                        window.navigator.chrome = { runtime: {} };
                    '''
                })
                
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
                
                print(f"🔍 Searching Booking.com in {area_name} (Attempt {retry_count + 1}/{max_retries})...")
                driver.get(url)
                time.sleep(random.uniform(8, 12))  # Longer initial wait
                
                # Extract property data
                properties = []
                try:
                    # Wait for property cards to load
                    WebDriverWait(driver, 30).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="property-card"]'))
                    )
                    
                    # Get all property cards
                    property_cards = driver.find_elements(By.CSS_SELECTOR, '[data-testid="property-card"]')
                    
                    for card in property_cards[:30]:  # Limit to 30 properties
                        try:
                            # Extract data with explicit waits
                            title = WebDriverWait(card, 10).until(
                                EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="title"]'))
                            ).text.strip()
                            
                            url = WebDriverWait(card, 10).until(
                                EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="title-link"]'))
                            ).get_attribute('href')
                            
                            price_element = WebDriverWait(card, 10).until(
                                EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="price-and-discounted-price"]'))
                            )
                            price_text = price_element.text.strip()
                            price = int(''.join(filter(str.isdigit, price_text)))
                            
                            # Try to get rating and reviews
                            try:
                                rating = float(card.find_element(By.CSS_SELECTOR, '[data-testid="review-score"]').text)
                                review_count = int(''.join(filter(str.isdigit, card.find_element(By.CSS_SELECTOR, '[data-testid="review-count"]').text)))
                            except:
                                rating = None
                                review_count = 0
                            
                            # Try to get address
                            try:
                                address = card.find_element(By.CSS_SELECTOR, '[data-testid="address"]').text.strip()
                            except:
                                address = ""
                            
                            property_data = {
                                'title': title,
                                'url': url,
                                'current_price': price,
                                'rating': rating,
                                'review_count': review_count,
                                'address': address,
                                'area': area_name
                            }
                            
                            properties.append(property_data)
                            
                        except Exception as e:
                            print(f"Error processing property card: {e}")
                            continue
                        
                        self.random_delay(1, 3)  # Random delay between properties
                        
                except Exception as e:
                    print(f"Error extracting properties for {area_name}: {e}")
                
                # Save results
                filename = f"{self.results_dir}/booking_{area_name.lower().replace(' ', '_')}_{self.scan_date}.json"
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(properties, f, indent=2, ensure_ascii=False)
                
                if driver:
                    driver.quit()
                
                print(f"✅ Booking.com {area_name}: Found {len(properties)} listings")
                
                # Add random delay before next request
                self.random_delay(8, 15)
                
                return area_name, "booking", len(properties)

            except Exception as e:
                retry_count += 1
                print(f"❌ Error scraping Booking.com {area_name} (Attempt {retry_count}/{max_retries}): {str(e)}")
                if driver:
                    try:
                        driver.quit()
                    except:
                        pass
                
                if retry_count < max_retries:
                    delay = retry_count * 15  # Longer delay for Booking.com
                    print(f"Waiting {delay} seconds before retry...")
                    time.sleep(delay)
                else:
                    print(f"Failed to scrape Booking.com {area_name} after {max_retries} attempts")
                    return area_name, "booking", 0

    async def bulk_scrape(self):
        """Scrape all pending areas with better error handling"""
        print(f"\n🚀 Starting bulk scrape of new areas at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📍 Areas to scrape: {', '.join(self.pending_areas.keys())}")
        print("=" * 50 + "\n")

        # Process areas sequentially to avoid overwhelming the services
        results = []
        for area_name, data in self.pending_areas.items():
            print(f"\n=== Processing {area_name} ===")
            
            # Scrape Airbnb
            airbnb_result = await self.scrape_airbnb_area(area_name, data["coordinates"])
            results.append(airbnb_result)
            
            # Add delay between platforms
            self.random_delay(10, 15)
            
            # Scrape Booking.com
            booking_result = await self.scrape_booking_area(area_name, data["search_term"])
            results.append(booking_result)
            
            # Add longer delay between areas
            if area_name != list(self.pending_areas.keys())[-1]:  # If not last area
                delay = random.uniform(20, 30)
                print(f"\nWaiting {int(delay)} seconds before next area...")
                time.sleep(delay)

        # Print summary
        print("\n" + "=" * 50)
        print("📊 NEW AREAS SCRAPING SUMMARY")
        print("=" * 50)
        
        total_listings = 0
        for area_name in self.pending_areas.keys():
            print(f"\n{area_name}:")
            airbnb_count = next((r[2] for r in results if r[0] == area_name and r[1] == "airbnb"), 0)
            booking_count = next((r[2] for r in results if r[0] == area_name and r[1] == "booking"), 0)
            area_total = airbnb_count + booking_count
            total_listings += area_total
            print(f"  Airbnb: {airbnb_count} listings")
            print(f"  Booking.com: {booking_count} listings")
            print(f"  Total: {area_total} listings")

        print("\n" + "=" * 50)
        print(f"📈 TOTAL NEW LISTINGS: {total_listings}")
        print(f"⏱️ COMPLETED AT: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 50 + "\n")

        return results

if __name__ == "__main__":
    scraper = NewAreasScraper()
    asyncio.run(scraper.bulk_scrape())
