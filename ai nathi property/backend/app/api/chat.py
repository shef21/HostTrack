from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

from app.services.supabase_client import supabase_client
from app.services.openai_client import openai_client
from app.models.database import ConversationMessage

router = APIRouter()

class ChatMessage(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    user_id: str = "default_user"  # For MVP, we'll use a default user

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    timestamp: datetime

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(message: ChatMessage):
    """Main chat endpoint that handles user messages and returns AI responses"""
    try:
        # Generate conversation ID if not provided
        conversation_id = message.conversation_id or str(uuid.uuid4())
        
        # Store conversation history and retrieve context
        supabase = supabase_client.get_client()
        
        # Store the user message
        user_message_data = {
            "id": str(uuid.uuid4()),
            "conversation_id": conversation_id,
            "user_id": message.user_id,
            "role": "user",
            "content": message.message,
            "timestamp": datetime.utcnow().isoformat()
        }
        supabase.table("conversation_messages").insert(user_message_data).execute()
        
        # Retrieve conversation history
        history_result = supabase.table("conversation_messages").select("*").eq(
            "conversation_id", conversation_id
        ).order("timestamp").execute()
        
        # Prepare messages for OpenAI with full conversation history
        messages = []
        for msg in history_result.data:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Get relevant context from user memory and scraped data
        context = await get_relevant_context(message.message, message.user_id)
        
        # Get AI response with real market data context
        ai_response = await openai_client.get_chat_completion(messages, context)
        
        # Add Host Track upgrade prompt to responses
        if "price" in message.message.lower() or "market" in message.message.lower() or "analytics" in message.message.lower():
            ai_response += "\n\n🚀 Want detailed analytics for your properties? Get comprehensive insights with Host Track!"
        
        # Store the AI response
        ai_message_data = {
            "id": str(uuid.uuid4()),
            "conversation_id": conversation_id,
            "user_id": message.user_id,
            "role": "assistant",
            "content": ai_response,
            "timestamp": datetime.utcnow().isoformat()
        }
        supabase.table("conversation_messages").insert(ai_message_data).execute()
        
        return ChatResponse(
            response=ai_response,
            conversation_id=conversation_id,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

async def get_relevant_context(query: str, user_id: str) -> str:
    """Retrieve relevant context from real market data"""
    try:
        supabase = supabase_client.get_client()
        context_parts = []
        
        # Get real Cape Town competitor data for market insights
        competitors_result = supabase.table("cape_town_competitors").select("*").execute()
        
        if competitors_result.data:
            context_parts.append("🏙️ Cape Town Market Data (Live):")
            
            # Calculate market statistics
            prices = [comp['current_price'] for comp in competitors_result.data if comp['current_price']]
            ratings = [comp['rating'] for comp in competitors_result.data if comp['rating']]
            areas = [comp['area'] for comp in competitors_result.data if comp['area']]
            
            if prices:
                avg_price = sum(prices) / len(prices)
                min_price = min(prices)
                max_price = max(prices)
                context_parts.append(f"- Average Price: R{avg_price:.0f}/night")
                context_parts.append(f"- Price Range: R{min_price:.0f} - R{max_price:.0f}")
            
            if ratings:
                avg_rating = sum(ratings) / len(ratings)
                context_parts.append(f"- Average Rating: {avg_rating:.1f}/5")
            
            # Show top properties by area
            area_stats = {}
            for comp in competitors_result.data:
                area = comp.get('area', 'Unknown')
                if area not in area_stats:
                    area_stats[area] = []
                area_stats[area].append(comp)
            
            context_parts.append("\n📍 Area Breakdown:")
            for area, props in area_stats.items():
                if props:
                    area_prices = [p['current_price'] for p in props if p['current_price']]
                    if area_prices:
                        avg_area_price = sum(area_prices) / len(area_prices)
                        context_parts.append(f"- {area}: R{avg_area_price:.0f}/night ({len(props)} properties)")
            
            # Show top performing properties
            top_properties = sorted([comp for comp in competitors_result.data if comp['rating']], 
                                  key=lambda x: x['rating'], reverse=True)[:3]
            
            if top_properties:
                context_parts.append("\n⭐ Top Performing Properties:")
                for prop in top_properties:
                    context_parts.append(f"- {prop['title']} in {prop['area']}: R{prop['current_price']}/night, {prop['rating']}/5 ({prop['review_count']} reviews)")
        
        # Get user profile information
        try:
            profile_result = supabase.table("profiles").select("*").eq("id", user_id).execute()
            
            if profile_result.data:
                profile = profile_result.data[0]
                context_parts.append(f"\n👤 User Profile:")
                context_parts.append(f"- Name: {profile.get('name', 'Unknown')}")
                context_parts.append(f"- Currency: {profile.get('settings', {}).get('currency', 'ZAR')}")
                context_parts.append(f"- Timezone: {profile.get('settings', {}).get('timezone', 'Africa/Johannesburg')}")
        except:
            pass  # Skip if profiles table doesn't exist
        
        # Get user's properties from Host Track (if any)
        try:
            properties_result = supabase.table("properties").select("*").eq(
                "user_id", user_id
            ).eq("status", "active").execute()
            
            if properties_result.data:
                context_parts.append("\n🏠 Your Properties:")
                for prop in properties_result.data:
                    context_parts.append(f"- {prop['name']}: {prop['property_type']} with {prop['bedrooms']} bedrooms")
        except:
            pass  # Skip if properties table doesn't exist
        
        # Get recent bookings
        try:
            if 'properties_result' in locals() and properties_result.data:
                property_ids = [prop['id'] for prop in properties_result.data]
                bookings_result = supabase.table("bookings").select("*").in_(
                    "property_id", property_ids
                ).eq("status", "confirmed").order("check_in", desc=True).limit(5).execute()
                
                if bookings_result.data:
                    context_parts.append("\n📅 Recent Bookings:")
                    for booking in bookings_result.data:
                        context_parts.append(f"- {booking['guest_name']}: {booking['check_in']} to {booking['check_out']} ({booking['nights']} nights)")
        except:
            pass  # Skip if bookings table doesn't exist
        
        return "\n".join(context_parts)
        
    except Exception as e:
        print(f"Error getting context: {e}")
        return ""

@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get conversation history"""
    try:
        supabase = supabase_client.get_client()
        result = supabase.table("conversation_messages").select("*").eq(
            "conversation_id", conversation_id
        ).order("timestamp").execute()
        
        return {"messages": result.data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving conversation: {str(e)}")
