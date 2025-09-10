from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ConversationMessage(BaseModel):
    id: Optional[str] = None
    conversation_id: str
    user_id: str
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

class UserMemory(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str
    content: str
    category: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]] = None

class ScrapedProperty(BaseModel):
    id: Optional[str] = None
    source: str
    property_data: Dict[str, Any]
    processed_at: datetime
    metadata: Optional[Dict[str, Any]] = None

class VectorEmbedding(BaseModel):
    id: Optional[str] = None
    content_id: str
    content_type: str  # "conversation", "memory", "property"
    content: str
    embedding: List[float]
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

# Host Track Models
class User(BaseModel):
    id: Optional[str] = None
    email: str
    name: str
    phone: Optional[str] = None
    subscription_tier: str = "free"
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]] = None

class Property(BaseModel):
    id: Optional[str] = None
    user_id: str
    name: str
    address: str
    city: str
    property_type: str
    bedrooms: int
    bathrooms: float
    square_feet: Optional[int] = None
    amenities: Optional[List[str]] = None
    description: Optional[str] = None
    base_price: float
    currency: str = "ZAR"
    status: str = "active"
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]] = None

class Booking(BaseModel):
    id: Optional[str] = None
    property_id: str
    guest_name: str
    guest_email: Optional[str] = None
    check_in: str  # Date as string
    check_out: str  # Date as string
    nights: int
    guests: int = 1
    total_price: float
    currency: str = "ZAR"
    platform: str
    booking_reference: Optional[str] = None
    status: str = "confirmed"
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]] = None

class PricingRule(BaseModel):
    id: Optional[str] = None
    property_id: str
    rule_type: str
    start_date: Optional[str] = None  # Date as string
    end_date: Optional[str] = None  # Date as string
    day_of_week: Optional[int] = None
    multiplier: float = 1.0
    fixed_price: Optional[float] = None
    minimum_nights: int = 1
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]] = None

class MarketData(BaseModel):
    id: Optional[str] = None
    city: str
    property_type: str
    date: str  # Date as string
    average_price: float
    occupancy_rate: float
    total_listings: int
    new_listings: int
    price_trend: float
    occupancy_trend: float
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = None

class PerformanceMetrics(BaseModel):
    id: Optional[str] = None
    property_id: str
    date: str  # Date as string
    revenue: float = 0.0
    occupancy_rate: float = 0.0
    average_daily_rate: float = 0.0
    revpar: float = 0.0
    bookings_count: int = 0
    cancellation_rate: float = 0.0
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = None
