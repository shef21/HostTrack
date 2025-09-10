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

class PrivatePropertyDirectScraper:
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
        options.add_argument('--window-size=1920,1080')
        
        # Anti-bot measures
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # Rotate between different user agents
        user_agents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (iPad; CPU OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0'
        ]
        options.add_argument(f'user-agent={random.choice(user_agents)}')
        
        # Create driver
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=options)
        
        # Hide automation
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    def random_delay(self, min_seconds=2, max_seconds=5):
        """Add random delay to mimic human behavior"""
        # Add some randomness to the delay
        base_delay = random.uniform(min_seconds, max_seconds)
        extra_delay = random.uniform(0, 1) if random.random() < 0.3 else 0  # 30% chance of extra delay
        time.sleep(base_delay + extra_delay)
        
        # Sometimes add a very short pause
        if random.random() < 0.2:  # 20% chance
            time.sleep(random.uniform(0.1, 0.3))
    
    def extract_price(self, price_text):
        """Extract numeric price from text"""
        if not price_text:
            return None
        match = re.search(r'R\s*([\d,]+)', price_text.replace('\u202f', ' '))
        if match:
            return float(match.group(1).replace(',', ''))
        return None
    
    def scrape_property(self, url):
        """Scrape a single property page"""
        try:
            print(f"\nAccessing property: {url}")
            self.driver.get(url)
            self.random_delay(3, 5)
            
            # Wait for page to load
            wait = WebDriverWait(self.driver, 20)
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '.propertyDetails')))
            
            # Get basic info
            title = None
            price = None
            location = None
            description = None
            features = {}
            
            try:
                # Get title
                title_elem = self.driver.find_element(By.CSS_SELECTOR, 'h1.propertyTitle')
                title = title_elem.text.strip() if title_elem else None
                
                # Get price
                price_elem = self.driver.find_element(By.CSS_SELECTOR, '.propertyPrice')
                price = self.extract_price(price_elem.text) if price_elem else None
                
                # Get location
                location_elem = self.driver.find_element(By.CSS_SELECTOR, '.propertyLocation')
                location = location_elem.text.strip() if location_elem else 'Sea Point'
                
                # Get description
                desc_elem = self.driver.find_element(By.CSS_SELECTOR, '.propertyDescription')
                description = desc_elem.text.strip() if desc_elem else None
                
                # Get features
                feature_elems = self.driver.find_elements(By.CSS_SELECTOR, '.propertyFeatures li')
                for elem in feature_elems:
                    text = elem.text.strip().lower()
                    if 'bedroom' in text:
                        bed_match = re.search(r'(\d+)\s*bedroom', text)
                        if bed_match:
                            features['bedrooms'] = int(bed_match.group(1))
                    elif 'bathroom' in text:
                        bath_match = re.search(r'(\d+)\s*bathroom', text)
                        if bath_match:
                            features['bathrooms'] = float(bath_match.group(1))
                    elif 'parking' in text:
                        park_match = re.search(r'(\d+)\s*parking', text)
                        if park_match:
                            features['parking'] = int(park_match.group(1))
                    elif 'm²' in text:
                        size_match = re.search(r'(\d+)\s*m²', text)
                        if size_match:
                            features['size'] = float(size_match.group(1))
                
                # Get availability
                avail_elem = self.driver.find_element(By.CSS_SELECTOR, '.propertyAvailability')
                availability = avail_elem.text.strip() if avail_elem else None
                
                # Get additional features
                additional_features = []
                feature_list = self.driver.find_elements(By.CSS_SELECTOR, '.propertyFeatures li')
                for feature in feature_list:
                    feature_text = feature.text.strip()
                    if feature_text:
                        additional_features.append(feature_text)
                
                # Get agent info
                agent_elem = self.driver.find_element(By.CSS_SELECTOR, '.agentDetails')
                agent_info = agent_elem.text.strip() if agent_elem else None
                
                # Extract more info from description
                if description:
                    # Get pet policy
                    pet_matches = re.findall(r'(?i)pets?\s*(not\s*)?allowed|no\s*pets|pet\s*friendly', description)
                    pet_policy = pet_matches[0] if pet_matches else None
                    
                    # Get lease terms
                    lease_matches = re.findall(r'(?i)(?:minimum|max|maximum)?\s*lease\s*(?:term|period|length)?\s*(?:of|is|:)?\s*(\d+)\s*(?:month|year)s?', description)
                    lease_terms = lease_matches[0] if lease_matches else None
                    
                    # Get deposit info
                    deposit_matches = re.findall(r'(?i)deposit\s*(?:of|is|:)?\s*R?\s*([\d,]+)', description)
                    deposit = float(deposit_matches[0].replace(',', '')) if deposit_matches else None
                
                # Create property object
                property_data = {
                    'title': title,
                    'current_price': price,
                    'price_type': 'monthly',  # Property24 deals in monthly rentals
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
                    'rating': None,  # Property24 doesn't have ratings
                    'review_count': None,  # Property24 doesn't have reviews
                    'max_guests': None,  # Property24 is for long-term rentals
                    'location_score': None,  # Property24 doesn't have location scores
                    'additional_features': additional_features,
                    'agent_info': agent_info,
                    'pet_policy': pet_policy if 'pet_policy' in locals() else None,
                    'lease_terms': lease_terms if 'lease_terms' in locals() else None,
                    'deposit': deposit if 'deposit' in locals() else None
                }
                
                print(f"Successfully scraped: {title}")
                return property_data
                
            except Exception as e:
                print(f"Error extracting property details: {str(e)}")
                return None
            
        except Exception as e:
            print(f"Error accessing property: {str(e)}")
            return None
        
    def scrape_properties(self, urls):
        """Scrape multiple property pages"""
        results = []
        
        try:
            for url in urls:
                property_data = self.scrape_property(url)
                if property_data:
                    results.append(property_data)
                self.random_delay(5, 10)  # Longer delay between properties
            
            # Save results
            with open('privateproperty_direct_listings.json', 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2)
            print(f"\nSaved {len(results)} listings to property24_direct_listings.json")
            
            # Print summary
            if results:
                print("\nData Collection Summary:")
                print(f"Total properties: {len(results)}")
                
                # Calculate price range
                prices = [p['current_price'] for p in results if p['current_price']]
                if prices:
                    print(f"Price Range: R{min(prices):,.2f} - R{max(prices):,.2f} per month")
                
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
            print(f"\nError during scraping: {str(e)}")
        
        finally:
            self.driver.quit()

if __name__ == "__main__":
    # Sea Point rental URLs
    test_urls = [
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR4459514",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/606-doverhurst/4-dover-road/RR2201229",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR4427444",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR4477248",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR4476547",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/50-bordeaux/239-beach-road/RR4475718",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/105-costa-brava/299-beach-road/RR4475220",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR4474262",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR4473477",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR4473315",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/38-ambassador-flats/20-london-road/RR4471794",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR4471495",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR4470644",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR3905905",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR4469746",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR4469328",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR4469194",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR4468875",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR4468664",
        "https://www.privateproperty.co.za/to-rent/western-cape/cape-town/atlantic-seaboard/sea-point/RR4467662"
    ]
    
    scraper = PrivatePropertyDirectScraper()
    scraper.scrape_properties(test_urls)
