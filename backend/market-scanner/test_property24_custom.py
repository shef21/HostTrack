from lib.advanced_scraper import AdvancedScraper
from bs4 import BeautifulSoup
import json
import re

def test_property24():
    print("Testing Property24 access with custom scraper...")
    
    # Initialize scraper
    scraper = AdvancedScraper()
    
    # Sea Point rentals URL
    url = "https://www.property24.com/to-rent/sea-point/cape-town/western-cape/11021"
    
    # Get the page
    print(f"\nFetching: {url}")
    response = scraper.get(url)
    
    if response['success']:
        print(f"Successfully accessed using profile: {response['profile_used']}")
        
        # Save raw HTML for debugging
        with open('property24_raw.html', 'w', encoding='utf-8') as f:
            f.write(response['content'])
        print("Raw HTML saved to property24_raw.html")
        
        # Parse HTML
        soup = BeautifulSoup(response['content'], 'html.parser')
        
        # Find all listings
        listings = soup.find_all('div', {'class': 'p24_tileContainer'})
        print(f"\nFound {len(listings)} listings")
        
        if listings:
            # Process all listings
            results = []
            for listing in listings:
                try:
                    # Get listing number
                    listing_number = listing.get('data-listing-number')
                    
                    # Get URL
                    url_elem = listing.find('a', href=True)
                    url = f"https://www.property24.com{url_elem['href']}" if url_elem else None
                    
                    # Get price
                    price_div = listing.find('div', {'class': 'p24_price'})
                    price_text = price_div.text.strip() if price_div else None
                    price = None
                    if price_text:
                        price_match = re.search(r'R\s*([\d,]+)', price_text)
                        if price_match:
                            price = float(price_match.group(1).replace(',', ''))
                    
                    # Get description and location
                    desc_div = listing.find('div', {'class': 'p24_description'})
                    if desc_div:
                        description = desc_div.get_text(strip=True, separator=' ')
                        location = desc_div.find('span', {'class': 'p24_location'})
                        location = location.text.strip() if location else None
                    else:
                        description = None
                        location = None
                    
                    # Get address
                    address = listing.find('span', {'class': 'p24_address'})
                    address = address.text.strip() if address else None
                    
                    # Get features
                    features = listing.find_all('span', {'class': 'p24_featureDetails'})
                    feature_data = {}
                    if features:
                        for feature in features:
                            title = feature.get('title')
                            value = feature.find('span')
                            if title and value:
                                feature_data[title] = value.text.strip()
                    
                    # Get size
                    size_elem = listing.find('span', {'class': 'p24_size'})
                    size = None
                    if size_elem:
                        size_value = size_elem.find('span')
                        if size_value:
                            size_text = size_value.text.strip()
                            size_match = re.search(r'(\d+)\s*m²', size_text)
                            if size_match:
                                size = float(size_match.group(1))
                    
                    # Get availability
                    availability = None
                    badges = listing.find('ul', {'class': 'p24_badges'})
                    if badges:
                        avail_badge = badges.find('li', {'class': 'p24_availableBadge'})
                        if avail_badge:
                            availability = avail_badge.text.strip()
                    
                    # Create listing object
                    listing_data = {
                        'listing_number': listing_number,
                        'url': url,
                        'price': price,
                        'price_type': 'monthly',  # Property24 deals in monthly rentals
                        'description': description,
                        'location': location,
                        'address': address,
                        'size_sqm': size,
                        'availability': availability,
                        'bedrooms': int(feature_data.get('Bedrooms', 0)),
                        'bathrooms': float(feature_data.get('Bathrooms', 0)),
                        'parking': int(feature_data.get('Parking Spaces', 0)),
                        'platform': 'property24'
                    }
                    
                    results.append(listing_data)
                    
                except Exception as e:
                    print(f"Error processing listing: {str(e)}")
                    continue
            
            # Save results
            with open('property24_listings.json', 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2)
            print(f"\nSaved {len(results)} listings to property24_listings.json")
            
            # Print summary
            print("\nData Collection Summary:")
            print(f"Total properties: {len(results)}")
            
            if results:
                # Calculate price range
                prices = [p['price'] for p in results if p['price']]
                if prices:
                    print(f"Price Range: R{min(prices):,.2f} - R{max(prices):,.2f} per month")
                
                # Calculate averages
                avg_bedrooms = sum(p['bedrooms'] for p in results) / len(results)
                avg_bathrooms = sum(p['bathrooms'] for p in results) / len(results)
                avg_size = sum(p['size_sqm'] for p in results if p['size_sqm']) / len([p for p in results if p['size_sqm']])
                
                print(f"Average Bedrooms: {avg_bedrooms:.1f}")
                print(f"Average Bathrooms: {avg_bathrooms:.1f}")
                print(f"Average Size: {avg_size:.1f} m²")
        
        else:
            print("\nNo listings found. Check the HTML for changes in page structure.")
    
    else:
        print("Failed to access Property24")

if __name__ == "__main__":
    test_property24()
