import json
import csv
from datetime import datetime
import pandas as pd

class ManualDataCollector:
    def __init__(self):
        self.data_template = {
            'url': '',
            'title': '',
            'current_price': None,  # Monthly price in ZAR
            'price_type': 'monthly',
            'bedrooms': None,
            'bathrooms': None,
            'parking': None,
            'size_sqm': None,
            'location': '',
            'address': '',
            'description': '',
            'availability': '',
            'platform': 'manual_entry',
            'scan_date': datetime.now().isoformat(),
            'additional_features': [],
            'agent_info': '',
            'pet_policy': '',
            'lease_terms': '',
            'deposit': None,
            'property_type': '',  # Apartment, House, Townhouse, etc.
            'furnished': '',  # Furnished, Unfurnished, Semi-furnished
            'building_security': '',  # Security complex, No security, etc.
            'amenities': [],  # Pool, Gym, Garden, etc.
            'maintenance_included': False,
            'electricity_included': False,
            'water_included': False,
            'internet_included': False,
            'notes': ''  # Any additional observations
        }

    def create_data_entry_form(self):
        """Create a data entry form template"""
        print("\n" + "="*80)
        print("MANUAL DATA COLLECTION FORM - SEA POINT RENTALS")
        print("="*80)

        entry = self.data_template.copy()

        print("\n1. BASIC INFORMATION:")
        print("-" * 40)

        entry['url'] = input("Property URL: ").strip()
        entry['title'] = input("Property Title: ").strip()
        entry['property_type'] = input("Property Type (Apartment/House/Townhouse/etc.): ").strip()
        entry['location'] = input("Location (e.g., Sea Point): ").strip()
        entry['address'] = input("Full Address: ").strip()

        print("\n2. PRICE & PAYMENT:")
        print("-" * 40)

        try:
            price = input("Monthly Price (ZAR): ").strip()
            entry['current_price'] = float(price.replace('R', '').replace(',', '')) if price else None
        except:
            entry['current_price'] = None

        try:
            deposit = input("Deposit (ZAR): ").strip()
            entry['deposit'] = float(deposit.replace('R', '').replace(',', '')) if deposit else None
        except:
            entry['deposit'] = None

        entry['furnished'] = input("Furnished Status: ").strip()
        entry['maintenance_included'] = input("Maintenance Included? (y/n): ").strip().lower() == 'y'
        entry['electricity_included'] = input("Electricity Included? (y/n): ").strip().lower() == 'y'
        entry['water_included'] = input("Water Included? (y/n): ").strip().lower() == 'y'
        entry['internet_included'] = input("Internet Included? (y/n): ").strip().lower() == 'y'

        print("\n3. PROPERTY FEATURES:")
        print("-" * 40)

        try:
            entry['bedrooms'] = int(input("Number of Bedrooms: ").strip() or 0)
        except:
            entry['bedrooms'] = None

        try:
            entry['bathrooms'] = float(input("Number of Bathrooms: ").strip() or 0)
        except:
            entry['bathrooms'] = None

        try:
            entry['parking'] = int(input("Parking Spaces: ").strip() or 0)
        except:
            entry['parking'] = None

        try:
            size = input("Size (m²): ").strip()
            entry['size_sqm'] = float(size) if size else None
        except:
            entry['size_sqm'] = None

        print("\n4. ADDITIONAL DETAILS:")
        print("-" * 40)

        entry['availability'] = input("Availability: ").strip()
        entry['agent_info'] = input("Agent/Landlord Info: ").strip()
        entry['lease_terms'] = input("Lease Terms: ").strip()
        entry['pet_policy'] = input("Pet Policy: ").strip()
        entry['building_security'] = input("Building Security: ").strip()

        print("\n5. AMENITIES & FEATURES:")
        print("-" * 40)

        amenities_input = input("Amenities (comma-separated): ").strip()
        if amenities_input:
            entry['amenities'] = [a.strip() for a in amenities_input.split(',')]

        additional_features_input = input("Additional Features (comma-separated): ").strip()
        if additional_features_input:
            entry['additional_features'] = [f.strip() for f in additional_features_input.split(',')]

        print("\n6. DESCRIPTION:")
        print("-" * 40)

        entry['description'] = input("Full Description: ").strip()
        entry['notes'] = input("Additional Notes: ").strip()

        return entry

    def save_entry(self, entry, filename='sea_point_rentals_manual.json'):
        """Save a single entry to JSON file"""
        try:
            # Load existing data
            try:
                with open(filename, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                data = []

            # Add new entry
            data.append(entry)

            # Save updated data
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            print(f"\n✅ Entry saved to {filename}")
            return True

        except Exception as e:
            print(f"\n❌ Error saving entry: {str(e)}")
            return False

    def export_to_csv(self, json_file='sea_point_rentals_manual.json', csv_file='sea_point_rentals.csv'):
        """Export JSON data to CSV format"""
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if not data:
                print("No data to export")
                return

            # Convert to DataFrame
            df = pd.DataFrame(data)

            # Export to CSV
            df.to_csv(csv_file, index=False)
            print(f"\n✅ Data exported to {csv_file}")

        except Exception as e:
            print(f"\n❌ Error exporting to CSV: {str(e)}")

    def show_summary(self, filename='sea_point_rentals_manual.json'):
        """Show summary of collected data"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if not data:
                print("\n📊 No data collected yet")
                return

            print(f"\n📊 DATA COLLECTION SUMMARY")
            print("="*50)
            print(f"Total Properties: {len(data)}")

            # Price analysis
            prices = [p['current_price'] for p in data if p.get('current_price')]
            if prices:
                print(f"Average Price: R{sum(prices)/len(prices):,.2f}")
                print(f"Price Range: R{min(prices):,.2f} - R{max(prices):,.2f}")

            # Property type breakdown
            property_types = [p['property_type'] for p in data if p.get('property_type')]
            if property_types:
                type_counts = pd.Series(property_types).value_counts()
                print(f"\nProperty Types:")
                for prop_type, count in type_counts.items():
                    print(f"  {prop_type}: {count}")

            # Average features
            bedrooms = [p['bedrooms'] for p in data if p.get('bedrooms')]
            bathrooms = [p['bathrooms'] for p in data if p.get('bathrooms')]
            sizes = [p['size_sqm'] for p in data if p.get('size_sqm')]

            if bedrooms:
                print(f"\nAverage Bedrooms: {sum(bedrooms)/len(bedrooms):.1f}")
            if bathrooms:
                print(f"Average Bathrooms: {sum(bathrooms)/len(bathrooms):.1f}")
            if sizes:
                print(f"Average Size: {sum(sizes)/len(sizes):.1f} m²")

        except FileNotFoundError:
            print("\n📊 No data collected yet")
        except Exception as e:
            print(f"\n❌ Error showing summary: {str(e)}")

def main():
    """Main data collection workflow"""
    collector = ManualDataCollector()

    print("🔍 SEA POINT RENTAL DATA COLLECTION")
    print("This tool helps you manually collect rental property data from various sources.")

    while True:
        print("\n" + "="*60)
        print("OPTIONS:")
        print("1. Add new property entry")
        print("2. View data summary")
        print("3. Export to CSV")
        print("4. Exit")
        print("="*60)

        choice = input("\nChoose an option (1-4): ").strip()

        if choice == '1':
            entry = collector.create_data_entry_form()
            if entry:
                collector.save_entry(entry)

        elif choice == '2':
            collector.show_summary()

        elif choice == '3':
            collector.export_to_csv()

        elif choice == '4':
            print("\n👋 Goodbye!")
            break

        else:
            print("\n❌ Invalid option. Please choose 1-4.")

if __name__ == "__main__":
    main()
