from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime
import uuid
import json
import pandas as pd
import io

from app.services.supabase_client import supabase_client
from app.services.openai_client import openai_client

router = APIRouter()

class IngestResponse(BaseModel):
    message: str
    records_processed: int
    records_stored: int
    errors: List[str]

@router.post("/scraper", response_model=IngestResponse)
async def ingest_scraper_data(file: UploadFile = File(...)):
    """Ingest CSV or JSON data from scrapers"""
    try:
        # Read file content
        content = await file.read()
        
        # Determine file type and parse
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
            records = df.to_dict('records')
        elif file.filename.endswith('.json'):
            records = json.loads(content.decode('utf-8'))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload CSV or JSON.")
        
        # Process and store records
        processed_count = 0
        stored_count = 0
        errors = []
        
        supabase = supabase_client.get_client()
        
        for record in records:
            try:
                # Normalize the record
                normalized_record = normalize_property_data(record)
                
                # Store in database
                property_data = {
                    "id": str(uuid.uuid4()),
                    "source": file.filename,
                    "property_data": normalized_record,
                    "processed_at": datetime.utcnow().isoformat()
                }
                
                result = supabase.table("scraped_properties").insert(property_data).execute()
                
                # Create embedding for the property data
                await create_property_embedding(
                    property_data["id"], 
                    format_property_for_embedding(normalized_record)
                )
                
                stored_count += 1
                
            except Exception as e:
                errors.append(f"Error processing record {processed_count}: {str(e)}")
            
            processed_count += 1
        
        return IngestResponse(
            message=f"Successfully processed {processed_count} records",
            records_processed=processed_count,
            records_stored=stored_count,
            errors=errors
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ingesting data: {str(e)}")

def normalize_property_data(record: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize property data to a standard format"""
    normalized = {}
    
    # Common property fields mapping
    field_mapping = {
        'address': ['address', 'location', 'property_address', 'street_address'],
        'price': ['price', 'rental_price', 'monthly_rent', 'rate'],
        'bedrooms': ['bedrooms', 'beds', 'bed_count'],
        'bathrooms': ['bathrooms', 'baths', 'bath_count'],
        'square_feet': ['square_feet', 'sqft', 'size', 'area'],
        'property_type': ['property_type', 'type', 'category'],
        'amenities': ['amenities', 'features', 'facilities'],
        'description': ['description', 'details', 'summary'],
        'location': ['location', 'neighborhood', 'area', 'city'],
        'availability': ['availability', 'available', 'status']
    }
    
    # Map fields
    for standard_field, possible_fields in field_mapping.items():
        for field in possible_fields:
            if field in record and record[field] is not None:
                normalized[standard_field] = record[field]
                break
    
    # Add any unmapped fields
    for key, value in record.items():
        if key not in normalized and value is not None:
            normalized[key] = value
    
    return normalized

def format_property_for_embedding(property_data: Dict[str, Any]) -> str:
    """Format property data for embedding creation"""
    parts = []
    
    if 'address' in property_data:
        parts.append(f"Address: {property_data['address']}")
    
    if 'price' in property_data:
        parts.append(f"Price: {property_data['price']}")
    
    if 'bedrooms' in property_data:
        parts.append(f"Bedrooms: {property_data['bedrooms']}")
    
    if 'bathrooms' in property_data:
        parts.append(f"Bathrooms: {property_data['bathrooms']}")
    
    if 'property_type' in property_data:
        parts.append(f"Type: {property_data['property_type']}")
    
    if 'description' in property_data:
        parts.append(f"Description: {property_data['description']}")
    
    if 'amenities' in property_data:
        parts.append(f"Amenities: {property_data['amenities']}")
    
    return " | ".join(parts)

async def create_property_embedding(property_id: str, content: str):
    """Create embedding for property data"""
    try:
        embedding = await openai_client.get_embedding(content)
        
        supabase = supabase_client.get_client()
        supabase.table("vector_embeddings").insert({
            "content_id": property_id,
            "content_type": "property",
            "content": content,
            "embedding": embedding,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
    except Exception as e:
        print(f"Error creating property embedding: {e}")

@router.get("/properties")
async def get_scraped_properties(limit: int = 50):
    """Get scraped properties"""
    try:
        supabase = supabase_client.get_client()
        result = supabase.table("scraped_properties").select("*").order(
            "processed_at", desc=True
        ).limit(limit).execute()
        
        return {"properties": result.data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving properties: {str(e)}")
