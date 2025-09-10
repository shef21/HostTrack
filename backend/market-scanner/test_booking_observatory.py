from datetime import datetime, timedelta
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import re

def setup_driver():
    chrome_options = Options()
    # Add arguments to mimic a real browser
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument('--disable-extensions')
    chrome_options.add_argument('--start-maximized')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--disable-notifications')
    chrome_options.add_argument('--disable-popup-blocking')
    
    driver = webdriver.Chrome(options=chrome_options)
    return driver

def get_dates():
    today = datetime.now()
    check_in = today + timedelta(days=7)
    check_out = check_in + timedelta(days=1)  # One night stay
    return check_in.strftime("%Y-%m-%d"), check_out.strftime("%Y-%m-%d")

def extract_price(price_text):
    if not price_text:
        return None
    # Extract numbers from string, handle thousands separator
    price = re.sub(r'[^\d]', '', price_text)
    return int(price) if price else None

def is_in_observatory(title, address):
    """Check if the property is actually in Observatory"""
    title_lower = title.lower()
    address_lower = address.lower() if address else ""
    
    # Keywords that indicate the property is in Observatory
    obs_keywords = ['observatory', 'obs ', 'lower main road', 'salt river']
    
    # Keywords that indicate the property is NOT in Observatory
    non_obs_keywords = ['cbd', 'city centre', 'waterfront', 'gardens', 'newlands', 'mowbray']
    
    # Check if any Observatory keywords are present
    is_obs = any(keyword in title_lower or keyword in address_lower for keyword in obs_keywords)
    
    # Check if any non-Observatory keywords are present
    is_non_obs = any(keyword in title_lower or keyword in address_lower for keyword in non_obs_keywords)
    
    return is_obs and not is_non_obs

def scrape_properties():
    driver = setup_driver()
    check_in, check_out = get_dates()
    print(f"Searching for properties in Observatory (Lower Main Road area)...")
    print(f"Date range: {check_in} to {check_out} (1 night)")
    
    try:
        # Observatory search URL with dates
        url = f"https://www.booking.com/searchresults.html?ss=Observatory+Lower+Main+Road%2C+Cape+Town&checkin={check_in}&checkout={check_out}&group_adults=2&no_rooms=1&group_children=0"
        driver.get(url)
        time.sleep(5)  # Wait for page load
        
        # Wait for property cards to load
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div[data-testid='property-card']"))
        )
        
        properties = []
        property_cards = driver.find_elements(By.CSS_SELECTOR, "div[data-testid='property-card']")
        
        for card in property_cards:
            try:
                # Extract property details
                title = card.find_element(By.CSS_SELECTOR, "div[data-testid='title']").text
                
                # Try to get address
                try:
                    address = card.find_element(By.CSS_SELECTOR, "span[data-testid='address']").text
                except:
                    address = ""
                
                # Skip if not in Observatory
                if not is_in_observatory(title, address):
                    continue
                
                price_element = card.find_element(By.CSS_SELECTOR, "span[data-testid='price-and-discounted-price']")
                price = extract_price(price_element.text)
                
                # Try to get rating and review count
                try:
                    rating = float(card.find_element(By.CSS_SELECTOR, "div[data-testid='review-score']").text)
                    review_count = int(re.search(r'\d+', card.find_element(By.CSS_SELECTOR, "div[data-testid='review-count']").text).group())
                except:
                    rating = None
                    review_count = 0
                
                # Try to get amenities
                amenities = []
                try:
                    amenities_elements = card.find_elements(By.CSS_SELECTOR, "div[data-testid='property-card-unit-configuration']")
                    for element in amenities_elements:
                        amenities.append(element.text.strip())
                except:
                    pass
                
                properties.append({
                    'title': title,
                    'address': address,
                    'current_price': price,
                    'rating': rating,
                    'review_count': review_count,
                    'amenities': amenities,
                    'url': card.find_element(By.CSS_SELECTOR, "a[data-testid='title-link']").get_attribute('href')
                })
                
            except Exception as e:
                print(f"Error processing property card: {str(e)}")
                continue
        
        # Save the results
        with open('booking_observatory_raw.json', 'w') as f:
            json.dump(properties, f, indent=2)
        print(f"✅ Saved {len(properties)} properties to booking_observatory_raw.json")
        
    except Exception as e:
        print(f"Error: {str(e)}")
    
    finally:
        driver.quit()

if __name__ == "__main__":
    scrape_properties()