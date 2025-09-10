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
import os
from cape_town_areas import CAPE_TOWN_AREAS

# Area configuration
AREA_NAME = "Claremont"
AREA_CONFIG = CAPE_TOWN_AREAS[AREA_NAME]

async def scrape_airbnb():
    """Scrape Airbnb listings for Claremont"""
    try:
        print(f"\n🔍 Searching Airbnb in {AREA_NAME}...")
        
        # Get dates for a single night stay next week
        check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        check_out = (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d")
        
        coords = AREA_CONFIG["coordinates"]
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
        filename = f"airbnb_{AREA_NAME.lower()}_limited.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(limited_results, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Airbnb {AREA_NAME}: Found {len(limited_results)} listings")
        return len(limited_results)

    except Exception as e:
        print(f"❌ Error scraping Airbnb {AREA_NAME}: {str(e)}")
        return 0

async def scrape_booking():
    """Scrape Booking.com listings for Claremont"""
    driver = None
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
            'source': 'Object.defineProperty(navigator, "webdriver", { get: () => undefined })'
        })
        
        # Get dates
        check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        check_out = (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d")
        
        # Construct search URL
        url = (
            f"https://www.booking.com/searchresults.html"
            f"?ss={AREA_CONFIG['search_term']}"
            f"&checkin={check_in}"
            f"&checkout={check_out}"
            "&group_adults=2"
            "&no_rooms=1"
            "&group_children=0"
        )
        
        print(f"\n🔍 Searching Booking.com in {AREA_NAME}...")
        driver.get(url)
        time.sleep(10)  # Wait for page load
        
        # Extract property data
        properties = []
        try:
            # Wait for property cards to load
            WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="property-card"]'))
            )
            
            # Get all property cards
            property_cards = driver.find_elements(By.CSS_SELECTOR, '[data-testid="property-card"]')
            
            for card in property_cards[:30]:  # Limit to 30 properties
                try:
                    # Extract title and URL
                    title = card.find_element(By.CSS_SELECTOR, '[data-testid="title"]').text.strip()
                    url = card.find_element(By.CSS_SELECTOR, '[data-testid="title-link"]').get_attribute('href')
                    
                    # Extract price
                    price_element = card.find_element(By.CSS_SELECTOR, '[data-testid="price-and-discounted-price"]')
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
                        'area': AREA_NAME
                    }
                    
                    properties.append(property_data)
                    
                except Exception as e:
                    print(f"Error processing property card: {e}")
                    continue
                
                time.sleep(1)  # Small delay between properties
                
        except Exception as e:
            print(f"Error extracting properties: {e}")
        
        # Save results
        filename = f"booking_{AREA_NAME.lower()}_raw.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(properties, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Booking.com {AREA_NAME}: Found {len(properties)} listings")
        return len(properties)

    except Exception as e:
        print(f"❌ Error scraping Booking.com {AREA_NAME}: {str(e)}")
        return 0
    
    finally:
        if driver:
            driver.quit()

async def main():
    print(f"\n🚀 Starting scrape for {AREA_NAME} at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Scrape Airbnb
    airbnb_count = await scrape_airbnb()
    
    # Wait between scrapes
    print("\nWaiting 15 seconds before Booking.com scrape...")
    time.sleep(15)
    
    # Scrape Booking.com
    booking_count = await scrape_booking()
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 {AREA_NAME} SCRAPING SUMMARY")
    print("=" * 50)
    print(f"Airbnb: {airbnb_count} listings")
    print(f"Booking.com: {booking_count} listings")
    print(f"Total: {airbnb_count + booking_count} listings")
    print(f"⏱️ Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(main())
