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
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36')

    # Create driver
    driver = webdriver.Chrome(options=chrome_options)
    
    # Add script to webdriver to avoid detection
    driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
        'source': '''
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            })
        '''
    })
    
    return driver

def get_dates():
    # Get dates for a single night stay next week
    check_in = datetime.now() + timedelta(days=7)
    check_out = check_in + timedelta(days=1)
    return check_in.strftime('%Y-%m-%d'), check_out.strftime('%Y-%m-%d')

def extract_room_details(driver, url, max_retries=3):
    """Extract room details from property page with retry logic"""
    retries = 0
    while retries < max_retries:
        try:
            print(f"Opening property page (attempt {retries + 1}): {url}")
            
            # Open property in new tab
            driver.execute_script(f"window.open('{url}', '_blank');")
            driver.switch_to.window(driver.window_handles[-1])
            
            # Wait for page to load
            try:
                # Try multiple selectors for the description
                description_selectors = [
                    "hp-description-sub-header",
                    "property-description",
                    "hotel-description",
                    "description",
                    "property__description"
                ]
                
                description_found = False
                for selector in description_selectors:
                    try:
                        WebDriverWait(driver, 5).until(
                            EC.presence_of_element_located((By.CLASS_NAME, selector))
                        )
                        description_found = True
                        break
                    except TimeoutException:
                        continue
                
                if not description_found:
                    print("Could not find description element, trying facility list")
            
            except TimeoutException:
                print("Timeout waiting for description, trying facility list")
            
            # Let the page load completely
            time.sleep(2)
            
            # Initialize description
            description = ""
            
            # Try to get description from various elements
            for selector in description_selectors:
                try:
                    element = driver.find_element(By.CLASS_NAME, selector)
                    description += " " + element.text.lower()
                except NoSuchElementException:
                    continue
            
            # Try to get room info from facility list
            try:
                facility_selectors = [
                    "facility-badge",
                    "hotel-facilities__list",
                    "property-facilities",
                    "room-info"
                ]
                
                for selector in facility_selectors:
                    try:
                        facilities = driver.find_elements(By.CLASS_NAME, selector)
                        for facility in facilities:
                            description += " " + facility.text.lower()
                    except NoSuchElementException:
                        continue
            except Exception as e:
                print(f"Error getting facilities: {e}")
            
            # Try to get room info from room grid
            try:
                room_selectors = [
                    "room-info",
                    "room-type",
                    "hprt-table"
                ]
                
                for selector in room_selectors:
                    try:
                        rooms = driver.find_elements(By.CLASS_NAME, selector)
                        for room in rooms:
                            description += " " + room.text.lower()
                    except NoSuchElementException:
                        continue
            except Exception as e:
                print(f"Error getting room info: {e}")
            
            print(f"Found description text: {description[:200]}...")
            
            # Extract bedrooms
            bedrooms = None
            bedroom_patterns = [
                r'(\d+)\s*bedroom',
                r'(\d+)\s*bed\s+apartment',
                r'(\d+)-bed\s+apartment',
                r'(\d+)\s*br\b',
                r'(\d+)\s*bed\b',
                r'(\d+)\s*rooms?\b'
            ]
            for pattern in bedroom_patterns:
                match = re.search(pattern, description)
                if match:
                    bedrooms = int(match.group(1))
                    break
            
            # Check for studio
            if 'studio' in description:
                bedrooms = 0
            
            # Extract bathrooms
            bathrooms = None
            bathroom_patterns = [
                r'(\d+)\s*bathroom',
                r'(\d+)\s*bath',
                r'(\d+)\s*private bath',
                r'(\d+)\s*ba\b',
                r'(\d+)\s*en[- ]?suite'
            ]
            for pattern in bathroom_patterns:
                match = re.search(pattern, description)
                if match:
                    bathrooms = int(match.group(1))
                    break
            
            # Extract amenities
            amenities = set()
            amenity_keywords = {
                'wifi': 'wifi',
                'internet': 'wifi',
                'pool': 'pool',
                'swimming': 'pool',
                'parking': 'parking',
                'gym': 'gym',
                'fitness': 'gym',
                'balcony': 'balcony',
                'terrace': 'balcony',
                'patio': 'balcony',
                'view': 'view',
                'sea view': 'view',
                'ocean view': 'view',
                'mountain view': 'view',
                'air conditioning': 'air_conditioning',
                'air-conditioning': 'air_conditioning',
                'kitchen': 'kitchen',
                'kitchenette': 'kitchen',
                'washer': 'laundry',
                'dryer': 'laundry',
                'laundry': 'laundry',
                'beach': 'beach_access',
                'elevator': 'elevator',
                'lift': 'elevator'
            }
            
            for keyword, amenity in amenity_keywords.items():
                if keyword in description:
                    amenities.add(amenity)
            
            # If no bedrooms found, try to infer from property type
            if bedrooms is None:
                property_types = {
                    'studio': 0,
                    'apartment': 1,
                    'suite': 1,
                    'room': 1,
                    'hotel room': 1
                }
                for prop_type, bed_count in property_types.items():
                    if prop_type in description:
                        bedrooms = bed_count
                        break
            
            # If still no bathrooms found but we have bedrooms, estimate
            if bathrooms is None and bedrooms is not None:
                if bedrooms == 0:  # Studio
                    bathrooms = 1
                else:
                    bathrooms = max(1, bedrooms // 2)  # At least 1 bathroom, then 1 per 2 bedrooms
            
            print(f"Extracted details: {bedrooms} bedrooms, {bathrooms} bathrooms, {len(amenities)} amenities")
            
            # Close tab and switch back
            driver.close()
            driver.switch_to.window(driver.window_handles[0])
            
            return bedrooms, bathrooms, list(amenities)
            
        except Exception as e:
            print(f"Error extracting room details (attempt {retries + 1}): {e}")
            retries += 1
            if len(driver.window_handles) > 1:
                driver.close()
                driver.switch_to.window(driver.window_handles[0])
            time.sleep(2)  # Wait before retry
    
    print("Failed to extract room details after all retries")
    return None, None, []

def extract_property_data(element, driver):
    try:
        # First try to get the link element directly
        try:
            link_element = element.find_element(By.CSS_SELECTOR, 'a[data-testid="title-link"]')
            url = link_element.get_attribute('href')
            title = link_element.text.strip()
        except NoSuchElementException:
            # Fallback: try to find any link containing the title
            try:
                title_element = element.find_element(By.CSS_SELECTOR, '[data-testid="title"]')
                title = title_element.text.strip()
                # Find the closest ancestor or sibling that's a link
                link_element = element.find_element(By.XPATH, f".//a[contains(., '{title}')]")
                url = link_element.get_attribute('href')
            except NoSuchElementException:
                # Last resort: try to find any link in the property card
                try:
                    link_element = element.find_element(By.TAG_NAME, 'a')
                    url = link_element.get_attribute('href')
                    title = title_element.text.strip() if 'title_element' in locals() else link_element.text.strip()
                except NoSuchElementException:
                    url = None
                    title = None

        if not title or not url:
            print("Could not find title or URL")
            return None

        print(f"\nProcessing property: {title}")
        print(f"URL: {url}")

        # Basic property info
        property_data = {
            'external_id': element.get_attribute('data-hotel-id'),
            'title': title,
            'url': url,
            'images': [],
            'amenities': [],
            'coordinates': None,
            'rating': None,
            'review_count': None,
            'current_price': None,
            'max_guests': None,
            'bedrooms': None,
            'bathrooms': None
        }

        # Extract price
        try:
            price_element = element.find_element(By.CSS_SELECTOR, '[data-testid="price-and-discounted-price"]')
            price_text = price_element.text.strip()
            price = ''.join(filter(str.isdigit, price_text))
            if price:
                property_data['current_price'] = int(price)
                print(f"Price: R{property_data['current_price']}")
        except Exception as e:
            print(f"Error extracting price: {e}")

        # Extract rating
        try:
            rating_element = element.find_element(By.CSS_SELECTOR, '[data-testid="review-score"]')
            rating_text = rating_element.text.strip()
            
            # Extract rating (format: "Scored X.X")
            rating_match = re.search(r'Scored\s+(\d+\.\d+)', rating_text)
            if rating_match:
                property_data['rating'] = float(rating_match.group(1))
            
            # Extract review count (format: "X reviews")
            review_match = re.search(r'(\d+(?:,\d+)?)\s*reviews?', rating_text)
            if review_match:
                property_data['review_count'] = int(review_match.group(1).replace(',', ''))
            
            print(f"Rating: {property_data['rating']}, Reviews: {property_data['review_count']}")
        except Exception as e:
            print(f"Error extracting rating: {e}")

        # Extract images
        try:
            image_element = element.find_element(By.CSS_SELECTOR, 'img[data-testid="image"]')
            image_url = image_element.get_attribute('src')
            if image_url:
                property_data['images'].append(image_url)
                print(f"Found {len(property_data['images'])} images")
        except Exception as e:
            print(f"Error extracting images: {e}")

        # Extract room details from property page
        if url:
            bedrooms, bathrooms, amenities = extract_room_details(driver, url)
            property_data['bedrooms'] = bedrooms
            property_data['bathrooms'] = bathrooms
            property_data['amenities'] = amenities

        return property_data

    except Exception as e:
        print(f"Error extracting property data: {e}")
        return None

def search_booking_properties():
    print("Starting Booking.com property search for Green Point...")
    print("Note: Getting single-night rates including cleaning fees")
    
    driver = setup_driver()
    properties = []
    
    try:
        # Construct search URL for Green Point
        check_in, check_out = get_dates()
        search_url = (
            "https://www.booking.com/searchresults.html"
            "?ss=Green+Point%2C+Cape+Town"
            "&ssne=Green+Point"
            "&ssne_untouched=Green+Point"
            "&lang=en-gb"
            "&sb=1"
            "&src_elem=sb"
            "&src=searchresults"
            "&dest_type=district"
            "&group_adults=2"
            "&no_rooms=1"
            f"&checkin={check_in}"
            f"&checkout={check_out}"
            "&group_children=0"
            "&sb_travel_purpose=leisure"
            "&order=popularity"
        )

        print(f"Searching for dates: {check_in} to {check_out} (1 night)")
        print(f"Navigating to: {search_url}")
        driver.get(search_url)

        # Wait for properties to load
        print("Waiting for properties to load...")
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="property-card"]'))
        )

        # Let the page fully load
        time.sleep(5)

        # Get all property cards
        property_cards = driver.find_elements(By.CSS_SELECTOR, '[data-testid="property-card"]')
        print(f"Found {len(property_cards)} properties")

        # Extract data from each property
        for i, card in enumerate(property_cards, 1):
            print(f"\nProcessing property {i} of {len(property_cards)}")
            property_data = extract_property_data(card, driver)
            if property_data:
                properties.append(property_data)
            # Add delay between properties to avoid rate limiting
            time.sleep(2)

        print(f"\nSuccessfully extracted data from {len(properties)} properties")

        # Save raw data
        with open('booking_green_point_raw.json', 'w', encoding='utf-8') as f:
            json.dump(properties, f, indent=2, ensure_ascii=False)
        print("Raw results saved to booking_green_point_raw.json")

        # Print sample property
        if properties:
            print("\nSample property data:")
            sample = properties[0]
            print(f"Name: {sample['title']}")
            print(f"Price: {sample['current_price']} ZAR/night")
            print(f"Rating: {sample['rating']} ({sample['review_count']} reviews)")
            print(f"Bedrooms: {sample['bedrooms']}")
            print(f"Bathrooms: {sample['bathrooms']}")
            print(f"Amenities: {', '.join(sample['amenities'])}")

    except Exception as e:
        print(f"Error during search: {e}")
    finally:
        driver.quit()

    return properties

if __name__ == "__main__":
    search_booking_properties()
