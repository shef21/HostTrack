import requests
import json
from datetime import datetime
import re

def search_property24(area="sea-point", city="cape-town", province="western-cape", area_code="11021"):
    """
    Search Property24 using their search endpoint
    """
    print("Searching Property24 for rentals in", area)
    
    # Search URL (mobile site)
    search_url = f"https://m.property24.com/to-rent/{area}/{city}/{province}/{area_code}"
    
    # Headers to mimic mobile browser
    headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
    }
    
    try:
        # First visit the main mobile page to get cookies
        session = requests.Session()
        session.get("https://m.property24.com", headers=headers)
        
        # Now perform the search
        print("Fetching search results...")
        response = session.get(search_url, headers=headers)
        response.raise_for_status()
        
        # Extract listing data from HTML
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find all listing containers (mobile site has different structure)
        listings = soup.find_all('div', {'class': 'p24m_listing'})
        print(f"Found {len(listings)} listings")
        
        # Extract data from each listing
        results = []
        for listing in listings:
            try:
                # Get basic info
                title_elem = listing.find('h2', {'class': 'p24m_title'})
                title = title_elem.text.strip() if title_elem else None
                
                price_elem = listing.find('span', {'class': 'p24m_price'})
                price = price_elem.text.strip() if price_elem else None
                
                # Get URL
                url_elem = listing.find('a', {'class': 'p24m_propertyUrl'})
                url = url_elem.get('href') if url_elem else None
                
                # Get features
                features = []
                feature_elems = listing.find_all('div', {'class': 'p24m_feature'})
                for elem in feature_elems:
                    feature_text = elem.text.strip()
                    if 'bed' in feature_text.lower():
                        features.append({
                            'title': 'Bedrooms',
                            'value': re.search(r'\d+', feature_text).group() if re.search(r'\d+', feature_text) else None
                        })
                    elif 'bath' in feature_text.lower():
                        features.append({
                            'title': 'Bathrooms',
                            'value': re.search(r'\d+', feature_text).group() if re.search(r'\d+', feature_text) else None
                        })
                    elif 'm²' in feature_text:
                        features.append({
                            'title': 'Size',
                            'value': re.search(r'\d+', feature_text).group() if re.search(r'\d+', feature_text) else None
                        })
                
                # Get description
                desc_elem = listing.find('div', {'class': 'p24m_description'})
                description = desc_elem.text.strip() if desc_elem else None
                
                # Get location
                location_elem = listing.find('div', {'class': 'p24m_location'})
                location = location_elem.text.strip() if location_elem else None
                
                # Add to results
                results.append({
                    'title': title,
                    'price': price,
                    'url': url,
                    'features': features,
                    'description': description,
                    'location': location
                })
                
            except Exception as e:
                print(f"Error extracting listing data: {str(e)}")
                continue
        
        # Save raw results for debugging
        with open('property24_sea_point_raw.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
        
        print("Raw results saved to property24_sea_point_raw.json")
        return {'listings': results}
            
    except requests.exceptions.RequestException as e:
        print(f"Error during request: {str(e)}")
        return None

def normalize_property24_data(raw_data):
    """
    Normalize Property24 data to match our schema
    """
    if not raw_data or 'listings' not in raw_data:
        return []
        
    normalized = []
    
    for listing in raw_data['listings']:
        try:
            # Extract price
            price = None
            if 'price' in listing:
                price_match = re.search(r'R\s*([\d,]+)', listing['price'])
                if price_match:
                    price = float(price_match.group(1).replace(',', ''))
            
            # Extract bedrooms and bathrooms
            bedrooms = listing.get('bedrooms')
            if bedrooms and isinstance(bedrooms, str):
                bedrooms = int(re.search(r'\d+', bedrooms).group()) if re.search(r'\d+', bedrooms) else None
                
            bathrooms = listing.get('bathrooms')
            if bathrooms and isinstance(bathrooms, str):
                bathrooms = int(re.search(r'\d+', bathrooms).group()) if re.search(r'\d+', bathrooms) else None
            
            # Extract size
            size = None
            if 'size' in listing:
                size_match = re.search(r'(\d+)\s*m²', listing['size'])
                if size_match:
                    size = float(size_match.group(1))
            
            # Extract amenities
            amenities = []
            if listing.get('features'):
                for feature in listing['features']:
                    if 'parking' in feature.lower():
                        amenities.append('parking')
                    if 'security' in feature.lower():
                        amenities.append('security')
                    if 'pool' in feature.lower():
                        amenities.append('pool')
                    if 'garden' in feature.lower():
                        amenities.append('garden')
                    if 'view' in feature.lower():
                        amenities.append('view')
            
            # Create normalized listing
            normalized_listing = {
                'title': listing.get('title'),
                'current_price': price,
                'price_type': 'monthly',  # Property24 deals in monthly rentals
                'bedrooms': bedrooms,
                'bathrooms': bathrooms,
                'url': f"https://www.property24.com{listing.get('url')}" if listing.get('url') else None,
                'amenities': amenities,
                'size_sqm': size,
                'location': listing.get('location', 'Sea Point'),
                'description': listing.get('description'),
                'platform': 'property24',
                'scan_date': datetime.now().isoformat(),
                'rating': None,  # Property24 doesn't have ratings
                'review_count': None,  # Property24 doesn't have reviews
                'max_guests': None,  # Property24 is for long-term rentals
                'location_score': None  # Property24 doesn't have location scores
            }
            
            # Only add if we have the minimum required data
            if normalized_listing['title'] and normalized_listing['current_price'] and normalized_listing['url']:
                normalized.append(normalized_listing)
                
        except Exception as e:
            print(f"Error normalizing listing: {str(e)}")
            continue
    
    # Save normalized results
    with open('property24_sea_point_normalized.json', 'w', encoding='utf-8') as f:
        json.dump(normalized, f, indent=2)
    
    print(f"Normalized {len(normalized)} listings")
    return normalized

if __name__ == "__main__":
    # Search Property24
    raw_data = search_property24()
    
    if raw_data:
        # Normalize the data
        normalized_data = normalize_property24_data(raw_data)
        
        # Print summary
        print("\nData Collection Summary:")
        print(f"Total properties: {len(normalized_data)}")
        
        if normalized_data:
            # Calculate field completeness
            fields = ['title', 'current_price', 'bedrooms', 'bathrooms', 'url', 'amenities', 'size_sqm', 'location']
            print("\nField Completeness:")
            for field in fields:
                present = sum(1 for p in normalized_data if p.get(field))
                percentage = (present / len(normalized_data)) * 100
                print(f"{field}: {present}/{len(normalized_data)} ({percentage:.1f}%)")
            
            # Calculate price range
            prices = [p['current_price'] for p in normalized_data if p.get('current_price')]
            if prices:
                print(f"\nPrice Range: R{min(prices):,.2f} - R{max(prices):,.2f} per month")
