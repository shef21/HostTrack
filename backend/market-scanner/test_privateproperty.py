from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
import time
import random

class PrivatePropertyScraper:
    def __init__(self):
        self.setup_driver()
        
    def setup_driver(self):
        """Setup Chrome driver with anti-bot measures"""
        options = Options()
        
        # Basic Chrome settings
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--disable-infobars')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--disable-web-security')
        options.add_argument('--allow-running-insecure-content')
        options.add_argument('--disable-features=IsolateOrigins,site-per-process')
        options.add_argument('--ignore-certificate-errors')
        options.add_argument('--ignore-ssl-errors')
        
        # Set window size
        options.add_argument('--window-size=1920,1080')
        
        # Anti-bot measures
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # Set user agent
        options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
        # Create driver
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=options)
        
        # Additional anti-detection
        self.driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': '''
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
                
                // Hide automation flags
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
            '''
        })
    
    def random_delay(self, min_seconds=2, max_seconds=5):
        """Add random delay to mimic human behavior"""
        time.sleep(random.uniform(min_seconds, max_seconds))
    
    def simulate_human_behavior(self):
        """Simulate human-like scrolling and mouse movements"""
        try:
            # Random scrolling
            total_height = self.driver.execute_script("return document.body.scrollHeight")
            viewport_height = self.driver.execute_script("return window.innerHeight")
            current_position = 0
            
            while current_position < total_height:
                # Random scroll amount
                scroll_amount = random.randint(100, 300)
                current_position = min(current_position + scroll_amount, total_height)
                
                # Smooth scroll
                self.driver.execute_script(f"window.scrollTo({{top: {current_position}, behavior: 'smooth'}})")
                self.random_delay(0.5, 1.5)
            
            # Scroll back up randomly
            if random.random() < 0.7:  # 70% chance to scroll back up
                current_position = total_height
                while current_position > 0:
                    scroll_amount = random.randint(100, 300)
                    current_position = max(current_position - scroll_amount, 0)
                    self.driver.execute_script(f"window.scrollTo({{top: {current_position}, behavior: 'smooth'}})")
                    self.random_delay(0.3, 1.0)
            
        except Exception as e:
            print(f"Error during human behavior simulation: {str(e)}")
    
    def extract_price(self, price_text):
        """Extract numeric price from text"""
        if not price_text:
            return None
        match = re.search(r'R\s*([\d,]+)', price_text.replace('\u202f', ' '))
        if match:
            return float(match.group(1).replace(',', ''))
        return None
    
    def extract_features(self, feature_text):
        """Extract property features"""
        features = {
            'bedrooms': None,
            'bathrooms': None,
            'parking': None,
            'size': None
        }
        
        if not feature_text:
            return features
        
        # Extract bedrooms
        bed_match = re.search(r'(\d+)\s*bed', feature_text.lower())
        if bed_match:
            features['bedrooms'] = int(bed_match.group(1))
        
        # Extract bathrooms
        bath_match = re.search(r'(\d+)\s*bath', feature_text.lower())
        if bath_match:
            features['bathrooms'] = int(bath_match.group(1))
        
        # Extract parking
        park_match = re.search(r'(\d+)\s*park', feature_text.lower())
        if park_match:
            features['parking'] = int(park_match.group(1))
        
        # Extract size
        size_match = re.search(r'(\d+)\s*m²', feature_text)
        if size_match:
            features['size'] = float(size_match.group(1))
        
        return features
    
    def search_sea_point(self):
        """Search for Sea Point rentals"""
        try:
            # First visit mobile homepage
            print("Visiting Private Property homepage...")
            self.driver.get("https://m.privateproperty.co.za")
            self.random_delay(3, 5)
            
            # Simulate human behavior
            self.simulate_human_behavior()
            
            # Navigate to Sea Point rentals (mobile site)
            print("\nNavigating to Sea Point rentals...")
            search_url = "https://m.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/437"
            self.driver.get(search_url)
            self.random_delay(4, 6)
            
            # Wait for listings to load
            wait = WebDriverWait(self.driver, 20)
            listings_present = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '.listingResult')))
            
            # Simulate human behavior
            self.simulate_human_behavior()
            
            # Parse the page
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            # Find all listings
            listings = soup.find_all('div', {'class': 'listingResult'})
            print(f"\nFound {len(listings)} listings")
            
            # Extract data from first 25 listings
            results = []
            for listing in listings[:25]:
                try:
                    # Get title and URL
                    title_elem = listing.find('span', {'class': 'p24_title'})
                    if not title_elem:
                        title_elem = listing.find('span', {'itemprop': 'name'})
                    title = title_elem.text.strip() if title_elem else None
                    
                    # Get URL from the first link in the listing
                    url_elem = listing.find('a', href=True)
                    url = f"https://www.privateproperty.co.za{url_elem['href']}" if url_elem else None
                    
                    # Get price
                    price_elem = listing.find('span', {'class': 'p24_price'})
                    if not price_elem:
                        price_elem = listing.find('span', {'itemprop': 'price'})
                    price = self.extract_price(price_elem.text) if price_elem else None
                    
                    # Get features
                    features = {}
                    
                    # Get bedrooms
                    bed_elem = listing.find('span', {'title': 'Bedrooms'})
                    if bed_elem:
                        bed_value = bed_elem.find('span')
                        if bed_value:
                            features['bedrooms'] = int(bed_value.text.strip())
                    
                    # Get bathrooms
                    bath_elem = listing.find('span', {'title': 'Bathrooms'})
                    if bath_elem:
                        bath_value = bath_elem.find('span')
                        if bath_value:
                            features['bathrooms'] = float(bath_value.text.strip())
                    
                    # Get parking
                    park_elem = listing.find('span', {'title': 'Parking Spaces'})
                    if park_elem:
                        park_value = park_elem.find('span')
                        if park_value:
                            features['parking'] = int(park_value.text.strip())
                    
                    # Get size
                    size_elem = listing.find('span', {'class': 'p24_size'})
                    if size_elem:
                        size_value = size_elem.find('span')
                        if size_value:
                            size_match = re.search(r'(\d+)\s*m²', size_value.text)
                            if size_match:
                                features['size'] = float(size_match.group(1))
                    
                    # Get location
                    location_elem = listing.find('span', {'class': 'p24_location'})
                    location = location_elem.text.strip() if location_elem else 'Sea Point'
                    
                    # Get address
                    address_elem = listing.find('span', {'class': 'p24_address'})
                    if address_elem:
                        location = f"{location}, {address_elem.text.strip()}"
                    
                    # Get description
                    desc_elem = listing.find('span', {'class': 'p24_excerpt'})
                    description = desc_elem.text.strip() if desc_elem else None
                    
                    # Get availability
                    avail_elem = listing.find('li', {'class': 'p24_availableBadge'})
                    availability = avail_elem.text.strip() if avail_elem else None
                    
                    # Visit property detail page
                    if url:
                        print(f"\nVisiting property page: {url}")
                        # Open in new tab
                        self.driver.execute_script("window.open('');")
                        self.driver.switch_to.window(self.driver.window_handles[-1])
                        self.driver.get(url)
                        self.random_delay(3, 5)
                        
                        try:
                            # Wait for detail page to load
                            detail_wait = WebDriverWait(self.driver, 10)
                            detail_wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '.propertyDetails')))
                            
                            # Get detailed description
                            detail_desc = self.driver.find_element(By.CSS_SELECTOR, '.propertyDescription')
                            if detail_desc:
                                description = detail_desc.text.strip()
                            
                            # Get additional features
                            feature_list = self.driver.find_elements(By.CSS_SELECTOR, '.propertyFeatures li')
                            additional_features = []
                            for feature in feature_list:
                                feature_text = feature.text.strip()
                                if feature_text:
                                    additional_features.append(feature_text)
                            
                            # Get agent/landlord info
                            agent_elem = self.driver.find_element(By.CSS_SELECTOR, '.agentDetails')
                            agent_info = agent_elem.text.strip() if agent_elem else None
                            
                            # Get pet policy
                            pet_policy = None
                            if description:
                                pet_matches = re.findall(r'(?i)pets?\s*(not\s*)?allowed|no\s*pets|pet\s*friendly', description)
                                if pet_matches:
                                    pet_policy = pet_matches[0]
                            
                            # Get lease terms
                            lease_terms = None
                            if description:
                                lease_matches = re.findall(r'(?i)(?:minimum|max|maximum)?\s*lease\s*(?:term|period|length)?\s*(?:of|is|:)?\s*(\d+)\s*(?:month|year)s?', description)
                                if lease_matches:
                                    lease_terms = lease_matches[0]
                            
                            # Get deposit info
                            deposit = None
                            if description:
                                deposit_matches = re.findall(r'(?i)deposit\s*(?:of|is|:)?\s*R?\s*([\d,]+)', description)
                                if deposit_matches:
                                    deposit = float(deposit_matches[0].replace(',', ''))
                            
                            # Close detail page
                            self.driver.close()
                            self.driver.switch_to.window(self.driver.window_handles[0])
                            
                        except Exception as e:
                            print(f"Error extracting details: {str(e)}")
                            if len(self.driver.window_handles) > 1:
                                self.driver.close()
                                self.driver.switch_to.window(self.driver.window_handles[0])
                    
                    # Create listing object
                    listing_data = {
                        'title': title,
                        'current_price': price,
                        'price_type': 'monthly',  # Private Property deals in monthly rentals
                        'url': url,
                        'bedrooms': features.get('bedrooms'),
                        'bathrooms': features.get('bathrooms'),
                        'parking': features.get('parking'),
                        'size_sqm': features.get('size'),
                        'location': location,
                        'description': description,
                        'availability': availability,
                        'platform': 'privateproperty',
                        'scan_date': datetime.now().isoformat(),
                        'rating': None,  # Private Property doesn't have ratings
                        'review_count': None,  # Private Property doesn't have reviews
                        'max_guests': None,  # Private Property is for long-term rentals
                        'location_score': None,  # Private Property doesn't have location scores
                        'additional_features': additional_features if 'additional_features' in locals() else [],
                        'agent_info': agent_info if 'agent_info' in locals() else None,
                        'pet_policy': pet_policy if 'pet_policy' in locals() else None,
                        'lease_terms': lease_terms if 'lease_terms' in locals() else None,
                        'deposit': deposit if 'deposit' in locals() else None
                    }
                    
                    results.append(listing_data)
                    print(f"Added listing: {title}")
                    
                except Exception as e:
                    print(f"Error processing listing: {str(e)}")
                    continue
            
            # Save results
            with open('privateproperty_listings.json', 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2)
            print(f"\nSaved {len(results)} listings to privateproperty_listings.json")
            
            # Print summary
            if results:
                # Calculate price range
                prices = [p['current_price'] for p in results if p['current_price']]
                if prices:
                    print(f"\nPrice Range: R{min(prices):,.2f} - R{max(prices):,.2f} per month")
                
                # Calculate averages
                bedrooms = [p['bedrooms'] for p in results if p['bedrooms']]
                bathrooms = [p['bathrooms'] for p in results if p['bathrooms']]
                sizes = [p['size_sqm'] for p in results if p['size_sqm']]
                
                if bedrooms:
                    print(f"Average Bedrooms: {sum(bedrooms)/len(bedrooms):.1f}")
                if bathrooms:
                    print(f"Average Bathrooms: {sum(bathrooms)/len(bathrooms):.1f}")
                if sizes:
                    print(f"Average Size: {sum(sizes)/len(sizes):.1f} m²")
            
        except Exception as e:
            print(f"\nError during search: {str(e)}")
        
        finally:
            self.driver.quit()

if __name__ == "__main__":
    scraper = PrivatePropertyScraper()
    scraper.search_sea_point()
