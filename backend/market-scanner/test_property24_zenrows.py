from zenrows import ZenRowsClient
from bs4 import BeautifulSoup
import json

def test_property24():
    print("Testing Property24 access with ZenRows...")
    
    # Initialize ZenRows client
    client = ZenRowsClient("17823de2655e15ba7af0cdfc299e3cf2db6e3bde")
    
    # Sea Point rentals URL
    url = "https://www.property24.com/to-rent/sea-point/cape-town/western-cape/11021"
    
    try:
        # Get the page
        print(f"\nFetching: {url}")
        response = client.get(url)
        
        # Save raw HTML for debugging
        with open('property24_raw.html', 'w', encoding='utf-8') as f:
            f.write(response.text)
        print("Raw HTML saved to property24_raw.html")
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Try to find listings
        listings = soup.find_all('div', {'class': 'p24_tileContainer'})
        print(f"\nFound {len(listings)} listings")
        
        if listings:
            # Extract data from first listing as a test
            first_listing = listings[0]
            
            # Get listing number
            listing_number = first_listing.get('data-listing-number')
            
            # Get URL
            url_elem = first_listing.find('a', href=True)
            url = f"https://www.property24.com{url_elem['href']}" if url_elem else None
            
            # Get price
            price_div = first_listing.find('div', {'class': 'p24_price'})
            price = price_div.text.strip() if price_div else None
            
            # Get description and location
            desc_div = first_listing.find('div', {'class': 'p24_description'})
            if desc_div:
                description = desc_div.get_text(strip=True, separator=' ')
                location = desc_div.find('span', {'class': 'p24_location'})
                location = location.text.strip() if location else None
            else:
                description = None
                location = None
            
            # Get address
            address = first_listing.find('span', {'class': 'p24_address'})
            address = address.text.strip() if address else None
            
            # Get features
            features = first_listing.find_all('span', {'class': 'p24_featureDetails'})
            feature_data = {}
            if features:
                for feature in features:
                    title = feature.get('title')
                    value = feature.find('span')
                    if title and value:
                        feature_data[title] = value.text.strip()
            
            # Get size
            size_elem = first_listing.find('span', {'class': 'p24_size'})
            if size_elem:
                size_value = size_elem.find('span')
                size = size_value.text.strip() if size_value else None
            else:
                size = None
            
            # Get availability
            availability = None
            badges = first_listing.find('ul', {'class': 'p24_badges'})
            if badges:
                avail_badge = badges.find('li', {'class': 'p24_availableBadge'})
                if avail_badge:
                    availability = avail_badge.text.strip()
            
            print("\nFirst Listing Details:")
            print(f"Listing Number: {listing_number}")
            print(f"URL: {url}")
            print(f"Price: {price}")
            print(f"Description: {description}")
            print(f"Location: {location}")
            print(f"Address: {address}")
            print(f"Size: {size}")
            print(f"Availability: {availability}")
            
            if feature_data:
                print("\nFeatures:")
                for title, value in feature_data.items():
                    print(f"{title}: {value}")
            
            # Save first listing HTML for debugging
            with open('property24_first_listing.html', 'w', encoding='utf-8') as f:
                f.write(first_listing.prettify())
            print("\nFirst listing HTML saved to property24_first_listing.html")
            
        else:
            print("\nNo listings found. Checking page structure...")
            
            # Save some general page info
            page_info = {
                'title': soup.title.text if soup.title else None,
                'meta_description': soup.find('meta', {'name': 'description'}).get('content') if soup.find('meta', {'name': 'description'}) else None,
                'h1_tags': [h1.text for h1 in soup.find_all('h1')],
                'available_classes': list(set([tag.get('class')[0] for tag in soup.find_all(class_=True) if tag.get('class')]))
            }
            
            with open('property24_page_info.json', 'w', encoding='utf-8') as f:
                json.dump(page_info, f, indent=2)
            print("Page structure info saved to property24_page_info.json")
            
    except Exception as e:
        print(f"\nError: {str(e)}")

if __name__ == "__main__":
    test_property24()
