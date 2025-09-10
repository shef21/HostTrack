import json
import csv
from datetime import datetime
import pandas as pd

def quick_entry_template():
    """Fast data entry template for essential fields only"""
    return {
        'url': '',
        'title': '',
        'current_price': None,  # Monthly price in ZAR
        'price_type': 'monthly',
        'bedrooms': None,
        'bathrooms': None,
        'location': 'Sea Point',
        'property_type': '',  # Apartment, House, Townhouse, etc.
        'platform': 'manual_entry',
        'scan_date': datetime.now().isoformat(),
        'size_sqm': None,
        'parking': None,
        'furnished': '',  # Yes/No
        'availability': '',
        'notes': ''
    }

def fast_data_entry():
    """Quick data entry for essential fields only"""
    print("\n" + "="*50)
    print("FAST DATA ENTRY - SEA POINT RENTALS")
    print("="*50)
    print("Enter only essential information (press Enter to skip)")

    entry = quick_entry_template()

    # Required fields
    entry['url'] = input("URL: ").strip()
    entry['title'] = input("Title: ").strip()
    entry['property_type'] = input("Type (Apartment/House/etc.): ").strip()

    # Price
    price = input("Price (ZAR/month): ").strip()
    if price:
        try:
            entry['current_price'] = float(price.replace('R', '').replace(',', ''))
        except:
            pass

    # Bedrooms/Bathrooms
    bedrooms = input("Bedrooms: ").strip()
    if bedrooms:
        try:
            entry['bedrooms'] = int(bedrooms)
        except:
            pass

    bathrooms = input("Bathrooms: ").strip()
    if bathrooms:
        try:
            entry['bathrooms'] = float(bathrooms)
        except:
            pass

    # Optional quick fields
    size = input("Size (m²): ").strip()
    if size:
        try:
            entry['size_sqm'] = float(size)
        except:
            pass

    parking = input("Parking spaces: ").strip()
    if parking:
        try:
            entry['parking'] = int(parking)
        except:
            pass

    entry['furnished'] = input("Furnished? (y/n): ").strip().lower()
    entry['availability'] = input("Available: ").strip()
    entry['notes'] = input("Notes: ").strip()

    return entry

def bulk_import_from_csv(csv_file='sea_point_quick_import.csv'):
    """Import data from a simple CSV file"""
    try:
        df = pd.read_csv(csv_file)
        data = []

        for _, row in df.iterrows():
            entry = quick_entry_template()
            entry.update({
                'url': str(row.get('url', '')),
                'title': str(row.get('title', '')),
                'current_price': row.get('price'),
                'bedrooms': row.get('bedrooms'),
                'bathrooms': row.get('bathrooms'),
                'property_type': str(row.get('type', '')),
                'size_sqm': row.get('size_sqm'),
                'parking': row.get('parking'),
                'furnished': str(row.get('furnished', '')),
                'availability': str(row.get('availability', '')),
                'notes': str(row.get('notes', ''))
            })
            data.append(entry)

        # Save to JSON
        with open('sea_point_quick_data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

        print(f"\n✅ Imported {len(data)} properties from {csv_file}")
        return data

    except Exception as e:
        print(f"\n❌ Import error: {str(e)}")
        return []

def create_csv_template(filename='sea_point_quick_template.csv'):
    """Create a CSV template for bulk import"""
    template_data = [
        ['url', 'title', 'price', 'bedrooms', 'bathrooms', 'type', 'size_sqm', 'parking', 'furnished', 'availability', 'notes'],
        ['https://example.com/property1', '2 Bed Sea Point Apartment', 25000, 2, 2, 'Apartment', 85, 1, 'n', 'Immediate', 'Great views'],
        ['https://example.com/property2', '3 Bed House', 35000, 3, 2.5, 'House', 120, 2, 'y', '1 March', 'Garden'],
        ['', '', '', '', '', '', '', '', '', '', '']  # Empty row for copying
    ]

    df = pd.DataFrame(template_data[1:], columns=template_data[0])
    df.to_csv(filename, index=False)
    print(f"\n✅ CSV template created: {filename}")
    print("Fill in the template and use bulk import!")

def show_quick_summary(filename='sea_point_quick_data.json'):
    """Show summary of quick data"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if not data:
            print("\n📊 No data collected yet")
            return

        print(f"\n📊 QUICK DATA SUMMARY")
        print("="*40)
        print(f"Total Properties: {len(data)}")

        # Price analysis
        prices = [p['current_price'] for p in data if p.get('current_price')]
        if prices:
            print(f"Avg Price: R{sum(prices)/len(prices):,.0f}")
            print(f"Price Range: R{min(prices):,.0f} - R{max(prices):,.0f}")

        # Bedroom breakdown
        bedrooms = [p['bedrooms'] for p in data if p.get('bedrooms')]
        if bedrooms:
            bed_counts = pd.Series(bedrooms).value_counts().sort_index()
            print(f"\nBedroom Breakdown:")
            for beds, count in bed_counts.items():
                print(f"  {int(beds)} bed: {count}")

    except FileNotFoundError:
        print("\n📊 No data collected yet")

def main():
    """Main quick data collection workflow"""
    while True:
        print("\n" + "="*50)
        print("QUICK SEA POINT DATA COLLECTION")
        print("="*50)
        print("1. Add property (fast entry)")
        print("2. Bulk import from CSV")
        print("3. Create CSV template")
        print("4. View summary")
        print("5. Export to main format")
        print("6. Exit")
        print("="*50)

        choice = input("\nChoose (1-6): ").strip()

        if choice == '1':
            entry = fast_data_entry()
            if entry['url']:  # Only save if URL provided
                try:
                    # Load existing data
                    try:
                        with open('sea_point_quick_data.json', 'r') as f:
                            data = json.load(f)
                    except:
                        data = []

                    data.append(entry)

                    # Save
                    with open('sea_point_quick_data.json', 'w') as f:
                        json.dump(data, f, indent=2)

                    print(f"\n✅ Saved! Total: {len(data)} properties")

                except Exception as e:
                    print(f"\n❌ Error: {str(e)}")

        elif choice == '2':
            filename = input("CSV filename: ").strip() or 'sea_point_quick_import.csv'
            bulk_import_from_csv(filename)

        elif choice == '3':
            filename = input("Template filename: ").strip() or 'sea_point_template.csv'
            create_csv_template(filename)

        elif choice == '4':
            show_quick_summary()

        elif choice == '5':
            # Export to main format
            try:
                with open('sea_point_quick_data.json', 'r') as f:
                    quick_data = json.load(f)

                if quick_data:
                    # Convert to full format
                    full_data = []
                    for item in quick_data:
                        full_entry = {
                            'url': item['url'],
                            'title': item['title'],
                            'current_price': item['current_price'],
                            'price_type': 'monthly',
                            'bedrooms': item['bedrooms'],
                            'bathrooms': item['bathrooms'],
                            'parking': item['parking'],
                            'size_sqm': item['size_sqm'],
                            'location': item['location'],
                            'address': '',
                            'description': item.get('notes', ''),
                            'availability': item['availability'],
                            'platform': 'manual_entry',
                            'scan_date': item['scan_date'],
                            'additional_features': [],
                            'agent_info': '',
                            'pet_policy': '',
                            'lease_terms': '',
                            'deposit': None,
                            'property_type': item['property_type'],
                            'furnished': 'Furnished' if item['furnished'] == 'y' else 'Unfurnished',
                            'building_security': '',
                            'amenities': [],
                            'maintenance_included': False,
                            'electricity_included': False,
                            'water_included': False,
                            'internet_included': False,
                            'notes': item['notes']
                        }
                        full_data.append(full_entry)

                    with open('sea_point_rentals_manual.json', 'w', encoding='utf-8') as f:
                        json.dump(full_data, f, indent=2, ensure_ascii=False)

                    print(f"\n✅ Exported {len(full_data)} properties to main format!")

            except Exception as e:
                print(f"\n❌ Export error: {str(e)}")

        elif choice == '6':
            print("\n👋 Done!")
            break

        else:
            print("\n❌ Choose 1-6")

if __name__ == "__main__":
    main()
