from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import json
import re
from datetime import datetime
import time

def setup_driver():
    chrome_options = Options()
    
    # Basic Chrome settings
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--disable-infobars')
    chrome_options.add_argument('--disable-notifications')
    
    # Set window size to a common desktop resolution
    chrome_options.add_argument('--window-size=1920,1080')
    
    # Mimic a real browser
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Add common headers
    chrome_options.add_argument('--accept-lang=en-US,en;q=0.9')
    chrome_options.add_argument('--accept=text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
    
    # Set a common user agent
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    # Additional browser configurations
    driver.execute_cdp_cmd('Network.setUserAgentOverride', {
        "userAgent": 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        "platform": "MacOS"
    })
    
    # Hide webdriver
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    # Set common browser features
    driver.execute_script("""
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en']
        });
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5]
        });
    """)
    
    return driver

def extract_price(price_text):
    if not price_text:
        return None
    match = re.search(r'R\s*([\d,]+)', price_text.replace('\u202f', ' '))
    if match:
        return float(match.group(1).replace(',', ''))
    return None

def extract_number(text, patterns):
    if not text:
        return None
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            try:
                return int(match.group(1))
            except (IndexError, ValueError):
                continue
    return None

def extract_amenities(description):
    amenities = []
    amenity_patterns = {
        'parking': r'parking|garage|bay',
        'security': r'security|24-hour|guard|access control',
        'pool': r'pool|swimming',
        'gym': r'gym|fitness',
        'balcony': r'balcony|patio|terrace',
        'view': r'view|facing|overlook',
        'pet_friendly': r'pet|dog|cat',
        'furnished': r'furnished|equipped',
        'wifi': r'wifi|internet|broadband',
        'air_conditioning': r'air.?con|cooling|climate',
        'washing_machine': r'washing|laundry',
        'dishwasher': r'dishwasher',
        'storage': r'storage|cupboard',
        'elevator': r'elevator|lift',
    }
    
    for amenity, pattern in amenity_patterns.items():
        if re.search(pattern, description.lower()):
            amenities.append(amenity)
    
    return amenities

def scrape_property24():
    base_url = "https://www.property24.com/to-rent/sea-point/cape-town/western-cape/11021"
    properties = []
    driver = setup_driver()
    
    try:
        print("Accessing Property24...")
        
        # First visit the main Property24 page
        driver.get("https://www.property24.com")
        time.sleep(3)
        
        # Then navigate to the Sea Point rentals page
        print("Navigating to Sea Point rentals...")
        driver.get(base_url)
        
        # Wait for the page to load completely
        wait = WebDriverWait(driver, 30)  # Increased timeout
        try:
            # Wait for document ready state
            wait.until(lambda d: d.execute_script('return document.readyState') == 'complete')
            print("Page loaded")
            
            # Wait for any dynamic content
            time.sleep(5)
            
            # Check if we got redirected to an error page
            current_url = driver.current_url
            if "error" in current_url.lower() or "unavailable" in current_url.lower():
                print(f"Got redirected to error page: {current_url}")
                # Try refreshing the page
                driver.refresh()
                time.sleep(5)
            
            # Wait for listings to be visible
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '[data-listing-number]')))
            print("Listings found")
            
        except Exception as e:
            print(f"Error waiting for page load: {str(e)}")
        
        # Save page state for debugging
        with open("property24_initial_page.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        print("Saved initial page HTML")
        
        driver.save_screenshot("property24_initial_page.png")
        print("Saved initial page screenshot")
        
        # Print all available classes for debugging
        all_elements = driver.find_elements(By.CSS_SELECTOR, '[class]')
        classes = set()
        for elem in all_elements:
            classes.update(elem.get_attribute('class').split())
        print("\nAvailable classes:", sorted(classes))
        
        # Try different selectors for listings
        selectors = [
            '[data-listing-number]',
            '.js_resultTile',
            '.p24_tileContainer',
            '.p24_regularTile',
            'div[class*="Baker"]'
        ]
        
        listings = []
        for selector in selectors:
            try:
                print(f"\nTrying selector: {selector}")
                wait = WebDriverWait(driver, 5)
                found = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, selector)))
                if found:
                    print(f"Found {len(found)} listings with {selector}")
                    listings = found
                    break
            except Exception as e:
                print(f"Selector {selector} failed: {str(e)}")
        
        if not listings:
            raise Exception("Could not find any listings with any selector")
        
        print(f"Found {len(listings)} listings")
        processed_urls = set()
        
        for listing in listings[:25]:  # Process first 25 listings
            try:
                # Try different selectors for title and URL
                title_selectors = [
                    '.p24_title',
                    'span[itemprop="name"]',
                    'meta[itemprop="name"]'
                ]
                
                url_selectors = [
                    '.p24_image a',
                    '.p24_content',
                    'a[href*="/to-rent/"]'
                ]
                
                title_elem = None
                url = None
                
                print("\nTrying to find title/URL in listing:")
                print(listing.get_attribute('outerHTML'))
                
                # First get the URL
                for selector in url_selectors:
                    try:
                        print(f"Trying URL selector: {selector}")
                        url_elem = listing.find_element(By.CSS_SELECTOR, selector)
                        url = url_elem.get_attribute('href')
                        if url and '/to-rent/' in url:
                            print(f"Found URL: {url}")
                            break
                    except Exception as e:
                        print(f"URL selector {selector} failed: {str(e)}")
                
                if not url:
                    print("Could not find URL, skipping listing")
                    continue
                
                # Then get the title
                title = None
                for selector in title_selectors:
                    try:
                        print(f"Trying title selector: {selector}")
                        title_elem = listing.find_element(By.CSS_SELECTOR, selector)
                        title = title_elem.text or title_elem.get_attribute('content')
                        if title:
                            print(f"Found title: {title}")
                            break
                    except Exception as e:
                        print(f"Title selector {selector} failed: {str(e)}")
                
                if not title:
                    print("Could not find title, using URL")
                    title = url.split('/')[-1]
                
                if url in processed_urls:
                    continue
                    
                processed_urls.add(url)
                print(f"\nProcessing: {url}")
                
                # Take screenshot of listing
                try:
                    listing.screenshot(f"property24_listing_{len(properties)}.png")
                except:
                    print("Could not take listing screenshot")
                
                # Save listing HTML for debugging
                try:
                    with open(f"property24_listing_{len(properties)}.html", "w", encoding="utf-8") as f:
                        f.write(listing.get_attribute("outerHTML"))
                except:
                    print("Could not save listing HTML")
                
                # Open property detail page in new window
                driver.execute_script("window.open('');")
                driver.switch_to.window(driver.window_handles[-1])
                driver.get(url)
                time.sleep(2)
                
                # Extract detailed information
                detail_wait = WebDriverWait(driver, 10)
                # Get price from listing page
                price = None
                try:
                    price_elem = listing.find_element(By.CSS_SELECTOR, 'span[itemprop="price"]')
                    price = float(price_elem.get_attribute('content'))
                    print(f"Found price: R{price:,.2f}")
                except Exception as e:
                    print(f"Could not find price in listing: {str(e)}")
                
                # Get bedrooms from listing page
                bedrooms = None
                try:
                    bed_elems = listing.find_elements(By.CSS_SELECTOR, '.p24_featureDetails')
                    for elem in bed_elems:
                        if elem.get_attribute('title') == 'Bedrooms':
                            bedrooms = int(elem.find_element(By.CSS_SELECTOR, 'span:last-child').text)
                            print(f"Found bedrooms: {bedrooms}")
                            break
                except Exception as e:
                    print(f"Could not find bedrooms in listing: {str(e)}")
                
                # Get bathrooms from listing page
                bathrooms = None
                try:
                    bath_elems = listing.find_elements(By.CSS_SELECTOR, '.p24_featureDetails')
                    for elem in bath_elems:
                        if elem.get_attribute('title') == 'Bathrooms':
                            bathrooms = int(elem.find_element(By.CSS_SELECTOR, 'span:last-child').text)
                            print(f"Found bathrooms: {bathrooms}")
                            break
                except Exception as e:
                    print(f"Could not find bathrooms in listing: {str(e)}")
                
                # Get size from listing page
                size = None
                try:
                    size_elem = listing.find_element(By.CSS_SELECTOR, '.p24_size span:last-child')
                    size_text = size_elem.text.strip()
                    size_match = re.search(r'(\d+)\s*m²', size_text)
                    if size_match:
                        size = float(size_match.group(1))
                        print(f"Found size: {size} m²")
                except Exception as e:
                    print(f"Could not find size in listing: {str(e)}")
                
                # Get location from listing page
                location = None
                try:
                    location_elem = listing.find_element(By.CSS_SELECTOR, '.p24_location')
                    location = location_elem.text.strip()
                    try:
                        address_elem = listing.find_element(By.CSS_SELECTOR, '.p24_address')
                        location = f"{location}, {address_elem.text.strip()}"
                    except:
                        pass
                    print(f"Found location: {location}")
                except Exception as e:
                    print(f"Could not find location in listing: {str(e)}")
                
                # Get description from listing page
                description = None
                try:
                    desc_elem = listing.find_element(By.CSS_SELECTOR, '.p24_excerpt')
                    description = desc_elem.get_attribute('title').strip()
                    print(f"Found description: {description[:100]}...")
                except Exception as e:
                    print(f"Could not find description in listing: {str(e)}")
                
                # Extract amenities from description and features
                amenities = set()
                
                # Add amenities from description
                if description:
                    amenities.update(extract_amenities(description))
                
                # Add amenities from features
                try:
                    feature_elems = listing.find_elements(By.CSS_SELECTOR, '.p24_featureDetails')
                    for elem in feature_elems:
                        title = elem.get_attribute('title')
                        if title == 'Parking Spaces':
                            parking = int(elem.find_element(By.CSS_SELECTOR, 'span:last-child').text)
                            if parking > 0:
                                amenities.add('parking')
                except Exception as e:
                    print(f"Could not find additional features: {str(e)}")
                
                amenities = list(amenities)
                # Get additional description from detail page
                try:
                    detail_desc = driver.find_element(By.CSS_SELECTOR, '.p24_description, .p24_propertyInfo').text
                    if detail_desc:
                        description = f"{description}\n\n{detail_desc}" if description else detail_desc
                except:
                    pass
                
                # Extract property details
                bedroom_patterns = [
                    r'(\d+)\s*bedroom',
                    r'(\d+)\s*bed',
                    r'(\d+)\s*br',
                ]
                
                bathroom_patterns = [
                    r'(\d+)\s*bathroom',
                    r'(\d+)\s*bath',
                    r'(\d+)\s*ba',
                ]
                
                bedrooms = extract_number(description, bedroom_patterns)
                bathrooms = extract_number(description, bathroom_patterns)
                
                # Extract size if available
                size_match = re.search(r'(\d+)\s*m²', description)
                size = float(size_match.group(1)) if size_match else None
                
                # Extract amenities
                amenities = extract_amenities(description)
                
                # Get location details
                location = None
                try:
                    location = driver.find_element(By.CSS_SELECTOR, '.p24_location').text
                except:
                    pass
                
                # Create property object
                property_data = {
                    'title': title,
                    'current_price': price,
                    'price_type': 'monthly',  # Property24 deals in monthly rentals
                    'bedrooms': bedrooms,
                    'bathrooms': bathrooms,
                    'url': url,
                    'amenities': amenities,
                    'size_sqm': size,
                    'location': location,
                    'description': description,
                    'platform': 'property24',
                    'scan_date': datetime.now().isoformat(),
                    'rating': None,  # Property24 doesn't have ratings
                    'review_count': None,  # Property24 doesn't have reviews
                    'max_guests': None,  # Property24 is for long-term rentals
                    'location_score': None  # Property24 doesn't have location scores
                }
                
                # Only add property if we have the minimum required data
                if title and price and url:
                    properties.append(property_data)
                    print(f"Added property: {title} - R{price:,.2f}")
                else:
                    print("Skipping property due to missing required data")
                
                # Close detail page
                driver.close()
                driver.switch_to.window(driver.window_handles[0])
                
            except Exception as e:
                print(f"Error processing listing: {str(e)}")
                if len(driver.window_handles) > 1:
                    driver.close()
                    driver.switch_to.window(driver.window_handles[0])
                continue
        
    except Exception as e:
        print(f"Error during scraping: {str(e)}")
    
    finally:
        driver.quit()
    
    # Save results
    with open('property24_sea_point_raw.json', 'w', encoding='utf-8') as f:
        json.dump(properties, f, ensure_ascii=False, indent=2)
    
    print(f"\nScraped {len(properties)} properties")
    return properties

if __name__ == "__main__":
    properties = scrape_property24()
    
    # Print summary
    print("\nData Collection Summary:")
    print(f"Total properties: {len(properties)}")
    
    # Calculate completeness
    fields = ['title', 'current_price', 'bedrooms', 'bathrooms', 'url', 'amenities', 'size_sqm', 'location']
    completeness = {}
    
    for field in fields:
        present = sum(1 for p in properties if p.get(field))
        percentage = (present / len(properties)) * 100 if properties else 0
        completeness[field] = f"{present}/{len(properties)} ({percentage:.1f}%)"
    
    print("\nField Completeness:")
    for field, stats in completeness.items():
        print(f"{field}: {stats}")
    
    # Price range
    prices = [p['current_price'] for p in properties if p.get('current_price')]
    if prices:
        print(f"\nPrice Range: R{min(prices):,.2f} - R{max(prices):,.2f} per month")
