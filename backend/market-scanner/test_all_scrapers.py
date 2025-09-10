import json
import os
from datetime import datetime
import subprocess
from tabulate import tabulate
import pandas as pd

def run_scraper(name, command):
    print(f"\n{'='*80}")
    print(f"Running {name} scraper...")
    print(f"{'='*80}")
    
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Scraper completed successfully")
        else:
            print("❌ Scraper failed")
            print("Error output:", result.stderr)
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error running scraper: {e}")
        return False

def load_json_data(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error loading {file_path}: {e}")
        return None

def get_numeric_value(value):
    """Extract numeric value from various data types"""
    if isinstance(value, (int, float)):
        return float(value)
    elif isinstance(value, dict) and 'value' in value:
        return float(value['value'])
    elif isinstance(value, str):
        try:
            return float(value)
        except ValueError:
            return None
    return None

def analyze_data_quality(data, source):
    if not data:
        return {
            'source': source,
            'total_listings': 0,
            'complete_listings': 0,
            'avg_completeness': 0,
            'fields_present': {},
            'price_range': 'N/A',
            'rating_range': 'N/A'
        }

    total = len(data)
    required_fields = [
        'title', 'current_price', 'bedrooms', 'bathrooms',
        'rating', 'review_count', 'url', 'amenities'
    ]
    
    # Count field presence
    fields_present = {}
    complete_listings = 0
    for field in required_fields:
        present = sum(1 for item in data if item.get(field) is not None)
        fields_present[field] = f"{present}/{total} ({present/total*100:.1f}%)"
        
    # Count complete listings
    for item in data:
        if all(item.get(field) is not None for field in required_fields):
            complete_listings += 1
    
    # Calculate price range
    prices = [item['current_price'] for item in data if item.get('current_price')]
    price_range = f"R{min(prices):,.2f} - R{max(prices):,.2f}" if prices else 'N/A'
    
    # Calculate rating range
    ratings = [item['rating'] for item in data if item.get('rating')]
    ratings = [r for r in ratings if r is not None]  # Filter out None values
    rating_range = f"{min(ratings):.1f} - {max(ratings):.1f}" if ratings else 'N/A'
    
    # Calculate average completeness
    avg_completeness = sum(
        sum(1 for field in required_fields if item.get(field) is not None) 
        for item in data
    ) / (total * len(required_fields)) * 100

    return {
        'source': source,
        'total_listings': total,
        'complete_listings': f"{complete_listings}/{total} ({complete_listings/total*100:.1f}%)",
        'avg_completeness': f"{avg_completeness:.1f}%",
        'fields_present': fields_present,
        'price_range': price_range,
        'rating_range': rating_range
    }

def print_report(analysis):
    print("\n📊 Data Collection Report")
    print("="*80)
    
    # Basic stats table
    basic_stats = []
    for source, data in analysis.items():
        basic_stats.append([
            source,
            data['total_listings'],
            data['complete_listings'],
            data['avg_completeness'],
            data['price_range'],
            data['rating_range']
        ])
    
    print("\nBasic Statistics:")
    print(tabulate(basic_stats, headers=[
        'Source', 'Total Listings', 'Complete Listings', 
        'Avg Completeness', 'Price Range', 'Rating Range'
    ], tablefmt='grid'))
    
    # Field presence details
    print("\nField Presence Details:")
    for source, data in analysis.items():
        print(f"\n{source}:")
        field_stats = [[field, presence] for field, presence in data['fields_present'].items()]
        print(tabulate(field_stats, headers=['Field', 'Present'], tablefmt='grid'))

def save_combined_data(analysis):
    try:
        # Create a timestamp for the report
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save analysis as JSON
        with open(f'scraper_analysis_{timestamp}.json', 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2)
        print(f"\n✅ Analysis saved to scraper_analysis_{timestamp}.json")
        
        # Create Excel report with multiple sheets
        writer = pd.ExcelWriter(f'scraper_report_{timestamp}.xlsx', engine='xlsxwriter')
        
        # Summary sheet
        summary_data = []
        for source, data in analysis.items():
            summary_data.append({
                'Source': source,
                'Total Listings': data['total_listings'],
                'Complete Listings': data['complete_listings'],
                'Average Completeness': data['avg_completeness'],
                'Price Range': data['price_range'],
                'Rating Range': data['rating_range']
            })
        pd.DataFrame(summary_data).to_excel(writer, sheet_name='Summary', index=False)
        
        # Field presence sheet
        field_data = []
        for source, data in analysis.items():
            for field, presence in data['fields_present'].items():
                field_data.append({
                    'Source': source,
                    'Field': field,
                    'Presence': presence
                })
        pd.DataFrame(field_data).to_excel(writer, sheet_name='Field Presence', index=False)
        
        # Raw data sheets
        for source in ['airbnb', 'booking', 'property24']:
            # Try normalized data first, then raw data
            normalized_path = f'{source}_sea_point_normalized.json'
            raw_path = f'{source}_sea_point_raw.json'
            
            file_path = normalized_path if os.path.exists(normalized_path) else raw_path
            if os.path.exists(file_path):
                data = load_json_data(file_path)
                if data:
                    df = pd.json_normalize(data)
                    df.to_excel(writer, sheet_name=f'{source.capitalize()} Data', index=False)
        
        writer.close()
        print(f"✅ Excel report saved to scraper_report_{timestamp}.xlsx")
        
    except Exception as e:
        print(f"❌ Error saving combined data: {e}")

def main():
    # Run all scrapers
    scrapers = {
        'Airbnb': 'python3 test_airbnb_normalized.py',
        'Booking.com': 'python3 test_booking_direct.py',
        'Property24': 'python3 test_property24_api.py'
    }
    
    for name, command in scrapers.items():
        run_scraper(name, command)
    
    # Load and analyze data
    analysis = {}
    for source in ['airbnb', 'booking', 'property24']:
        # Try normalized data first, then raw data
        normalized_path = f'{source}_sea_point_normalized.json'
        raw_path = f'{source}_sea_point_raw.json'
        
        file_path = normalized_path if os.path.exists(normalized_path) else raw_path
        if os.path.exists(file_path):
            data = load_json_data(file_path)
            if data:
                analysis[source] = analyze_data_quality(data, source)
    
    # Print report
    print_report(analysis)
    
    # Save combined data
    save_combined_data(analysis)

if __name__ == "__main__":
    main()